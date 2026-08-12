import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { In, MoreThan, Repository, SelectQueryBuilder } from 'typeorm';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { JobSource } from './enums/job-source.enum';
import { JobRelevance } from './enums/job-relevance.enum';
import { JobRoleCategory } from './enums/job-role-category.enum';
import { AddedWithin } from './enums/added-within.enum';
import { CreateBlockedCompanyDto } from './dto/blocked-company.dto';
import { IngestJobDto } from './dto/ingest-job.dto';
import { IngestResult, PaginatedJobs } from './dto/jobs-response.dto';
import { PipelineStatsDto } from './dto/pipeline-stats.dto';
import { ScrapeTriggerResultDto } from './dto/scrape-trigger-result.dto';
import { BlockedCompany } from './entities/blocked-company.entity';
import { Job } from './entities/job.entity';
import { JobUserStatus } from './entities/job-user-status.entity';
import { InterestStatus } from './enums/interest-status.enum';
import { JobSortBy } from './enums/job-sort-by.enum';
import { SortDirection } from './enums/sort-direction.enum';
import { WorkMode } from './enums/work-mode.enum';
import { WorkModeSource } from './enums/work-mode-source.enum';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobsListQuery } from './types/jobs-list-query.type';
import { categorizeJobRole } from './utils/role-category';
import { extractTechKeywords } from './utils/tech-keywords';
import { classifyWorkMode } from './utils/work-mode-heuristics';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/** Normalized dedup key: same title + company should be treated as the same
 * job posting even when re-scraped under a different URL (tracking params,
 * a repost, or the same listing mirrored on another site). */
function jobDedupeKey(title: string, company: string | null): string {
  const norm = (value: string | null | undefined) =>
    (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${norm(title)}|${norm(company)}`;
}

function normalizeCompanyName(company: string): string {
  return company.trim().toLowerCase().replace(/\s+/g, ' ');
}

const MIN_HOURS_BETWEEN_SCRAPES = 24;
const DEDUPE_LOOKBACK_DAYS = 30;

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectRepository(SearchProfile)
    private readonly profilesRepository: Repository<SearchProfile>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(JobUserStatus)
    private readonly jobUserStatusRepository: Repository<JobUserStatus>,
    @InjectRepository(BlockedCompany)
    private readonly blockedCompanyRepository: Repository<BlockedCompany>,
    private readonly jobAnalysesService: JobAnalysesService,
  ) {}

  async ingest(records: Record<string, unknown>[]): Promise<IngestResult> {
    const received = records.length;
    let rejected = 0;
    let blocked = 0;
    const validRecords: IngestJobDto[] = [];
    const blockedCompanies = await this.getBlockedCompanyNames();

    for (const raw of records) {
      const validated = this.validateIngestRecord(raw);

      if (!validated) {
        rejected++;
        continue;
      }

      if (
        validated.company &&
        this.isCompanyBlocked(validated.company, blockedCompanies)
      ) {
        blocked++;
        continue;
      }

      validRecords.push(validated);
    }

    const jobs = validRecords.map((record) => this.mapIngestRecord(record));

    if (jobs.length === 0) {
      const result: IngestResult = {
        received,
        inserted: 0,
        skipped: 0,
        rejected,
        blocked,
      };
      this.logger.log(
        `Ingest complete: received=${received}, inserted=0, skipped=0, rejected=${rejected}, blocked=${blocked}`,
      );
      return result;
    }

    const urls = jobs
      .map((job) => job.url)
      .filter((url): url is string => !!url);

    const existingUrls = new Set(
      urls.length === 0
        ? []
        : (
            await this.jobsRepository.find({
              where: { url: In(urls) },
              select: { url: true },
            })
          ).map((job) => job.url),
    );

    const recentJobs = await this.jobsRepository.find({
      where: {
        scraped_at: MoreThan(
          new Date(Date.now() - DEDUPE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000),
        ),
      },
      select: { title: true, company: true },
    });
    const existingContentKeys = new Set(
      recentJobs.map((job) => jobDedupeKey(job.title, job.company)),
    );

    const seenContentKeysInBatch = new Set<string>();
    const newJobs = jobs.filter((job) => {
      if (!job.url || existingUrls.has(job.url)) {
        return false;
      }

      const contentKey = jobDedupeKey(job.title as string, job.company ?? null);

      if (
        existingContentKeys.has(contentKey) ||
        seenContentKeysInBatch.has(contentKey)
      ) {
        return false;
      }

      seenContentKeysInBatch.add(contentKey);
      return true;
    });

    if (newJobs.length > 0) {
      await this.jobsRepository.upsert(newJobs, {
        conflictPaths: ['url'],
        skipUpdateIfNoValuesChanged: true,
      });

      const insertedJobs = await this.jobsRepository.find({
        where: { url: In(newJobs.map((job) => job.url as string)) },
        select: { id: true },
      });

      const insertedJobIds = insertedJobs.map((job) => job.id);
      this.jobAnalysesService.queueAnalysesForJobs(insertedJobIds);
      this.jobAnalysesService.queueDescriptionSummaries(insertedJobIds);
      this.jobAnalysesService.queueWorkModeClassification(insertedJobIds);
    }

    const result: IngestResult = {
      received,
      inserted: newJobs.length,
      skipped: validRecords.length - newJobs.length,
      rejected,
      blocked,
    };

    this.logger.log(
      `Ingest complete: received=${result.received}, inserted=${result.inserted}, skipped=${result.skipped}, rejected=${result.rejected}, blocked=${result.blocked}`,
    );

    return result;
  }

  async removeAll(): Promise<{ deleted: number }> {
    const result = await this.jobsRepository
      .createQueryBuilder()
      .delete()
      .execute();

    const deleted = result.affected ?? 0;
    this.logger.log(`Deleted all jobs: count=${deleted}`);

    return { deleted };
  }

  async remove(id: string): Promise<void> {
    const result = await this.jobsRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    this.logger.log(`Deleted job: id=${id}`);
  }

  async removeMany(ids: string[]): Promise<{ deleted: number }> {
    const result = await this.jobsRepository.delete({ id: In(ids) });

    const deleted = result.affected ?? 0;
    this.logger.log(`Bulk deleted jobs: count=${deleted}`);

    return { deleted };
  }

  async findAll(userId: string, query: JobsListQuery): Promise<PaginatedJobs> {
    const {
      page,
      limit,
      profileId,
      minScore,
      source,
      interest,
      applied,
      rejected,
      workMode,
      relevance,
      roleCategory,
      techKeyword,
      locationCountry,
      locationCity,
      addedWithin,
      sortBy,
      sortDir,
    } = query;

    if (profileId) {
      await this.assertProfileBelongsToUser(userId, profileId);
    }

    const listQuery = this.buildJobsListQuery(userId, {
      source,
      profileId,
      minScore,
      interest,
      applied,
      rejected,
      workMode,
      relevance,
      roleCategory,
      techKeyword,
      locationCountry,
      locationCity,
      addedWithin,
    });
    this.applySorting(listQuery, userId, profileId, sortBy, sortDir);
    const total = await listQuery.getCount();
    const jobs = await listQuery
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    if (jobs.length === 0) {
      return { data: [], total, page, limit };
    }

    const data = await this.loadJobsWithUserAnalyses(
      jobs.map((job) => job.id),
      userId,
      profileId,
    );

    await this.attachUserStatuses(data, userId);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<Job> {
    const job = await this.jobsRepository.findOne({
      where: { id },
      relations: { analyses: { profile: true } },
    });

    if (!job) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    job.analyses = this.filterAnalysesForUser(job.analyses ?? [], userId);
    await this.attachUserStatuses([job], userId);

    return job;
  }

  async updateUserStatus(
    userId: string,
    jobId: string,
    patch: UpdateJobStatusDto,
  ): Promise<{
    job_id: string;
    interest: InterestStatus | null;
    applied: boolean;
    rejected: boolean;
  }> {
    const job = await this.jobsRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const existing = await this.jobUserStatusRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    const row =
      existing ??
      this.jobUserStatusRepository.create({
        user_id: userId,
        job_id: jobId,
        interest: null,
        applied: false,
        rejected: false,
      });

    if ('interest' in patch) {
      row.interest = patch.interest ?? null;
    }
    if (patch.applied !== undefined && patch.applied !== row.applied) {
      row.applied = patch.applied;
      row.applied_at = patch.applied ? new Date() : null;
    }
    if (patch.rejected !== undefined && patch.rejected !== row.rejected) {
      row.rejected = patch.rejected;
      row.rejected_at = patch.rejected ? new Date() : null;
    }

    const saved = await this.jobUserStatusRepository.save(row);

    return {
      job_id: jobId,
      interest: saved.interest,
      applied: saved.applied,
      rejected: saved.rejected,
    };
  }

  async getPipelineStats(userId: string): Promise<PipelineStatsDto> {
    const rows = await this.jobUserStatusRepository.find({
      where: { user_id: userId, applied: true },
      select: { rejected: true, applied_at: true, rejected_at: true },
    });

    const totalApplied = rows.length;
    const rejectedRows = rows.filter((row) => row.rejected);
    const pending = totalApplied - rejectedRows.length;

    const daysToReject = rejectedRows
      .filter((row) => row.applied_at && row.rejected_at)
      .map(
        (row) =>
          (row.rejected_at!.getTime() - row.applied_at!.getTime()) /
          (24 * 60 * 60 * 1000),
      )
      .filter((days) => days >= 0);

    const avgDaysToReject =
      daysToReject.length > 0
        ? daysToReject.reduce((sum, days) => sum + days, 0) /
          daysToReject.length
        : null;

    return {
      pending,
      rejected: rejectedRows.length,
      total_applied: totalApplied,
      rejection_rate:
        totalApplied > 0 ? rejectedRows.length / totalApplied : null,
      avg_days_to_reject:
        avgDaysToReject !== null ? Math.round(avgDaysToReject * 10) / 10 : null,
    };
  }

  async listBlockedCompanies(): Promise<BlockedCompany[]> {
    return this.blockedCompanyRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async createBlockedCompany(
    dto: CreateBlockedCompanyDto,
  ): Promise<{ blocked_company: BlockedCompany; purged: number }> {
    const company = dto.company.trim();
    const companyNormalized = normalizeCompanyName(company);

    if (!companyNormalized) {
      throw new BadRequestException('Company name is required');
    }

    const existing = await this.blockedCompanyRepository.findOne({
      where: { company_normalized: companyNormalized },
    });

    if (existing) {
      throw new BadRequestException(`"${existing.company}" is already blocked`);
    }

    const blockedCompany = await this.blockedCompanyRepository.save(
      this.blockedCompanyRepository.create({
        company,
        company_normalized: companyNormalized,
        reason: dto.reason ?? null,
      }),
    );

    let purged = 0;
    if (dto.purge_existing) {
      purged = await this.purgeJobsForCompany(companyNormalized);
    }

    this.logger.log(
      `Blocked company added: company=${company}, purged=${purged}`,
    );

    return { blocked_company: blockedCompany, purged };
  }

  async removeBlockedCompany(id: string): Promise<void> {
    const result = await this.blockedCompanyRepository.delete(id);

    if (!result.affected) {
      throw new NotFoundException(`Blocked company with id ${id} not found`);
    }
  }

  private async purgeJobsForCompany(
    companyNormalized: string,
  ): Promise<number> {
    const result = await this.jobsRepository
      .createQueryBuilder()
      .delete()
      .where('position(:companyNormalized in lower(company)) > 0', {
        companyNormalized,
      })
      .execute();

    return result.affected ?? 0;
  }

  private async getBlockedCompanyNames(): Promise<string[]> {
    const blocked = await this.blockedCompanyRepository.find({
      select: { company_normalized: true },
    });
    return blocked.map((row) => row.company_normalized);
  }

  private isCompanyBlocked(
    company: string,
    blockedCompanies: string[],
  ): boolean {
    const normalized = normalizeCompanyName(company);
    return blockedCompanies.some((blocked) => normalized.includes(blocked));
  }

  private async attachUserStatuses(jobs: Job[], userId: string): Promise<void> {
    if (jobs.length === 0) {
      return;
    }

    const statuses = await this.jobUserStatusRepository.find({
      where: {
        user_id: userId,
        job_id: In(jobs.map((job) => job.id)),
      },
    });

    const statusMap = new Map(
      statuses.map((row) => [row.job_id, row] as const),
    );

    for (const job of jobs) {
      const status = statusMap.get(job.id);
      job.user_interest = status?.interest ?? null;
      job.user_applied = status?.applied ?? false;
      job.user_rejected = status?.rejected ?? false;
    }
  }

  private buildJobsListQuery(
    userId: string,
    filters: {
      source?: JobSource;
      profileId?: string;
      minScore?: number;
      interest?: InterestStatus;
      applied?: boolean;
      rejected?: boolean;
      workMode?: WorkMode[];
      relevance?: JobRelevance;
      roleCategory?: JobRoleCategory[];
      techKeyword?: string;
      locationCountry?: string;
      locationCity?: string;
      addedWithin?: AddedWithin;
    },
  ) {
    const qb = this.jobsRepository.createQueryBuilder('job');

    // Blocklisted companies (see blocked_companies) are hidden everywhere,
    // not just at ingest time, so entries added after a job was already
    // scraped still disappear from the list.
    qb.andWhere(
      `NOT EXISTS (
        SELECT 1 FROM blocked_companies bc
        WHERE job.company IS NOT NULL
          AND position(bc.company_normalized in lower(job.company)) > 0
      )`,
    );

    if (filters.addedWithin) {
      const hours = filters.addedWithin === AddedWithin.DAY ? 24 : 24 * 7;
      qb.andWhere('job.scraped_at >= :scrapedAfter', {
        scrapedAfter: new Date(Date.now() - hours * 60 * 60 * 1000),
      });
    }

    if (filters.source) {
      qb.andWhere('job.source = :source', { source: filters.source });
    }

    if (filters.workMode && filters.workMode.length > 0) {
      qb.andWhere('job.work_mode IN (:...workMode)', {
        workMode: filters.workMode,
      });
    }

    if (filters.relevance) {
      qb.andWhere('job.relevance = :relevance', {
        relevance: filters.relevance,
      });
    }

    if (filters.roleCategory && filters.roleCategory.length > 0) {
      qb.andWhere('job.role_category IN (:...roleCategory)', {
        roleCategory: filters.roleCategory,
      });
    }

    if (filters.techKeyword) {
      qb.andWhere(':techKeyword = ANY(job.tech_keywords)', {
        techKeyword: filters.techKeyword,
      });
    }

    if (filters.locationCountry) {
      // location_country is only populated once AI classification has run
      // (see job-analyses.service.ts), which is skipped for jobs whose work
      // mode was already resolved by heuristics. Fall back to the raw
      // location text so filtering still works for those jobs.
      qb.andWhere(
        '(job.location_country ILIKE :locationCountry OR job.location ILIKE :locationCountry)',
        { locationCountry: `%${filters.locationCountry}%` },
      );
    }

    if (filters.locationCity) {
      qb.andWhere(
        '(job.location_city ILIKE :locationCity OR job.location ILIKE :locationCity)',
        { locationCity: `%${filters.locationCity}%` },
      );
    }

    if (
      filters.interest !== undefined ||
      filters.applied !== undefined ||
      filters.rejected !== undefined
    ) {
      const conditions = ['jus.job_id = job.id', 'jus.user_id = :statusUserId'];
      const params: Record<string, unknown> = { statusUserId: userId };

      if (filters.interest !== undefined) {
        conditions.push('jus.interest = :interest');
        params.interest = filters.interest;
      }

      if (filters.applied !== undefined) {
        conditions.push('jus.applied = :applied');
        params.applied = filters.applied;
      }

      if (filters.rejected !== undefined) {
        conditions.push('jus.rejected = :rejected');
        params.rejected = filters.rejected;
      }

      qb.innerJoin(JobUserStatus, 'jus', conditions.join(' AND '), params);
    }

    if (filters.minScore !== undefined) {
      const params: {
        userId: string;
        minScore: number;
        profileId?: string;
      } = {
        userId,
        minScore: filters.minScore,
      };
      let existsSql = `EXISTS (
        SELECT 1 FROM job_analyses ja
        INNER JOIN search_profiles sp ON sp.id = ja.profile_id
        WHERE ja.job_id = job.id
          AND sp.user_id = :userId
          AND ja.fit_score >= :minScore`;

      if (filters.profileId) {
        existsSql += ' AND ja.profile_id = :profileId';
        params.profileId = filters.profileId;
      }

      existsSql += ')';

      qb.andWhere(existsSql, params);
    }

    return qb;
  }

  private applySorting(
    qb: SelectQueryBuilder<Job>,
    userId: string,
    profileId: string | undefined,
    sortBy: JobSortBy | undefined,
    sortDir: SortDirection | undefined,
  ): void {
    const dir = sortDir === SortDirection.ASC ? 'ASC' : 'DESC';

    switch (sortBy) {
      case JobSortBy.LOCATION:
        qb.orderBy('job.location', dir, 'NULLS LAST');
        return;
      case JobSortBy.SALARY: {
        const buildSalarySubQuery = (subQuery: SelectQueryBuilder<Job>) => {
          const sub = subQuery
            .select('COALESCE(ja.salary_min, ja.salary_max)', 'best_salary')
            .from(JobAnalysis, 'ja')
            .innerJoin(SearchProfile, 'sp', 'sp.id = ja.profile_id')
            .where('ja.job_id = job.id')
            .andWhere('sp.user_id = :salaryUserId', { salaryUserId: userId })
            .orderBy('ja.fit_score', 'DESC')
            .limit(1);

          if (profileId) {
            sub.andWhere('ja.profile_id = :salaryProfileId', {
              salaryProfileId: profileId,
            });
          }

          return sub;
        };

        qb.addSelect(buildSalarySubQuery, 'best_salary');

        // Postgres only allows a SELECT-list alias to be used in ORDER BY
        // as a bare identifier, not nested inside another expression like
        // COALESCE(...). So the subquery SQL is inlined here directly
        // instead of referencing the "best_salary" alias.
        const orderSubQuery = buildSalarySubQuery(qb.subQuery());
        qb.setParameters(orderSubQuery.getParameters());
        qb.orderBy(
          `COALESCE((${orderSubQuery.getQuery()}), job.salary_min, job.salary_max)`,
          dir,
          'NULLS LAST',
        );
        return;
      }
      case JobSortBy.SCORE:
        qb.addSelect((subQuery) => {
          const sub = subQuery
            .select('MAX(ja.fit_score)', 'max_score')
            .from(JobAnalysis, 'ja')
            .innerJoin(SearchProfile, 'sp', 'sp.id = ja.profile_id')
            .where('ja.job_id = job.id')
            .andWhere('sp.user_id = :scoreUserId', { scoreUserId: userId });

          if (profileId) {
            sub.andWhere('ja.profile_id = :scoreProfileId', {
              scoreProfileId: profileId,
            });
          }

          return sub;
        }, 'max_score').orderBy('max_score', dir, 'NULLS LAST');
        return;
      default:
        // Rank by the job's actual posting date when the site provided one;
        // fall back to when we scraped it for postings with no date_posted,
        // so those don't all clump together instead of reflecting recency.
        //
        // Selected under an alias (instead of passed as a raw expression to
        // orderBy) because TypeORM's order-by-with-select-joins path splits
        // any order criteria containing a "." to resolve it as an
        // alias.column reference — which mis-parses a raw
        // "COALESCE(job.foo, job.bar)" string and throws "alias not found".
        // That path only kicks in when a join (e.g. the status filters
        // above) is combined with pagination, which is why this only
        // surfaces for some filter combinations.
        qb.addSelect(
          'COALESCE(job.date_posted::timestamptz, job.scraped_at)',
          'effective_posted_at',
        );
        qb.orderBy('effective_posted_at', 'DESC');
    }
  }

  private async loadJobsWithUserAnalyses(
    jobIds: string[],
    userId: string,
    profileId?: string,
  ): Promise<Job[]> {
    const jobs = await this.jobsRepository.find({
      where: { id: In(jobIds) },
      relations: { analyses: { profile: true } },
      order: { scraped_at: 'DESC' },
    });

    const orderMap = new Map(jobIds.map((id, index) => [id, index]));
    jobs.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));

    for (const job of jobs) {
      job.analyses = this.filterAnalysesForUser(
        job.analyses ?? [],
        userId,
        profileId,
      );
    }

    return jobs;
  }

  private filterAnalysesForUser(
    analyses: JobAnalysis[],
    userId: string,
    profileId?: string,
  ): JobAnalysis[] {
    return analyses
      .filter((analysis) => analysis.profile?.user_id === userId)
      .filter((analysis) => !profileId || analysis.profile_id === profileId)
      .sort((a, b) => b.fit_score - a.fit_score);
  }

  private async assertProfileBelongsToUser(
    userId: string,
    profileId: string,
  ): Promise<void> {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, user_id: userId },
    });

    if (!profile) {
      throw new BadRequestException(`Profile with id ${profileId} not found`);
    }
  }

  private validateIngestRecord(
    raw: Record<string, unknown>,
  ): IngestJobDto | null {
    const record = plainToInstance(IngestJobDto, raw, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(record, { whitelist: true });

    if (errors.length > 0) {
      return null;
    }

    if (!record.title?.trim() || !record.job_url?.trim()) {
      return null;
    }

    return record;
  }

  async triggerScrape(userId: string): Promise<ScrapeTriggerResultDto> {
    await this.assertScrapeNotThrottled();

    const scraperBaseUrl = (
      process.env.SCRAPER_URL || 'http://localhost:8000'
    ).replace(/\/$/, '');

    const activeProfiles = await this.profilesRepository.find({
      where: { user_id: userId, is_active: true },
    });
    const user = await this.usersRepository.findOneBy({ id: userId });

    const body = this.buildScrapeRequestBody(activeProfiles, user);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120_000);

    try {
      this.logger.log(
        `Triggering scrape at ${scraperBaseUrl}/scrape for user=${userId}`,
      );

      const response = await fetch(`${scraperBaseUrl}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {}),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        ScrapeTriggerResultDto | { detail?: unknown; message?: string } | null;

      if (!response.ok) {
        const detail =
          payload && typeof payload === 'object' && 'detail' in payload
            ? payload.detail
            : payload;
        throw new BadGatewayException(
          detail ?? `Scraper returned HTTP ${response.status}`,
        );
      }

      return payload as ScrapeTriggerResultDto;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException(
          'Scraper timed out after 120 seconds',
        );
      }

      this.logger.error(
        `Failed to reach scraper at ${scraperBaseUrl}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException(
        `Could not reach scraper at ${scraperBaseUrl}. Is it running?`,
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Blocks manual scrape triggers within MIN_HOURS_BETWEEN_SCRAPES of the
   * last one, regardless of which user requests it — the scraper hits
   * external sites, so the limit is global, not per-user. */
  private async assertScrapeNotThrottled(): Promise<void> {
    const [lastJob] = await this.jobsRepository.find({
      order: { scraped_at: 'DESC' },
      take: 1,
      select: { scraped_at: true },
    });

    if (!lastJob) {
      return;
    }

    const hoursSinceLastScrape =
      (Date.now() - lastJob.scraped_at.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastScrape < MIN_HOURS_BETWEEN_SCRAPES) {
      const nextAvailable = new Date(
        lastJob.scraped_at.getTime() +
          MIN_HOURS_BETWEEN_SCRAPES * 60 * 60 * 1000,
      );
      throw new HttpException(
        `Ya se hizo scraping en las últimas ${MIN_HOURS_BETWEEN_SCRAPES}h. ` +
          `Próximo disponible: ${nextAvailable.toISOString()}`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private buildScrapeRequestBody(
    activeProfiles: SearchProfile[],
    user: User | null,
  ): Record<string, unknown> | null {
    if (activeProfiles.length === 0) {
      return null;
    }

    const ROLE_SEARCH_TERMS: Record<string, string> = {
      frontend: 'frontend developer',
      backend: 'backend developer',
      fullstack: 'fullstack developer',
      mobile: 'mobile developer',
    };

    const roleTerms = uniqueStrings(
      activeProfiles.map(
        (profile) =>
          ROLE_SEARCH_TERMS[profile.role] ?? `${profile.role} developer`,
      ),
    );

    const technicalKeywords = uniqueStrings(
      activeProfiles.flatMap((profile) => profile.keywords ?? []),
    ).filter((keyword) => keyword.length >= 3);

    const searchTerms = uniqueStrings([...roleTerms, ...technicalKeywords]);
    const profileLocations = uniqueStrings(
      activeProfiles.flatMap((profile) => profile.locations ?? []),
    );

    // No profile has its own locations set: fall back to the user's home
    // city/country so scraping isn't limited to the scraper's own defaults.
    const homeLocation = uniqueStrings(
      [user?.home_city, user?.home_country].filter(
        (value): value is string => !!value,
      ),
    );

    const locations =
      profileLocations.length > 0 ? profileLocations : homeLocation;

    if (searchTerms.length === 0 && locations.length === 0) {
      return null;
    }

    return {
      sites: ['linkedin', 'indeed'],
      ...(searchTerms.length > 0 ? { search_terms: searchTerms } : {}),
      ...(locations.length > 0 ? { locations } : {}),
    };
  }

  private mapIngestRecord(record: IngestJobDto): Partial<Job> {
    const workMode =
      record.work_mode ??
      classifyWorkMode(record.title, record.location, record.description);

    return {
      title: record.title,
      url: record.job_url,
      source: record.site,
      company: record.company ?? null,
      location: record.location ?? null,
      description: record.description ?? null,
      date_posted: this.parseDatePosted(record.date_posted),
      job_type: record.job_type ?? null,
      salary_min: this.parseSalaryAmount(record.min_amount),
      salary_max: this.parseSalaryAmount(record.max_amount),
      salary_interval: record.interval ?? null,
      work_mode: workMode,
      work_mode_source:
        workMode === WorkMode.UNKNOWN ? null : WorkModeSource.HEURISTIC,
      role_category: categorizeJobRole(record.title, record.description),
      tech_keywords: extractTechKeywords(record.title, record.description),
    };
  }

  private parseSalaryAmount(amount?: number | null): number | null {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return null;
    }

    return Math.round(amount);
  }

  private parseDatePosted(datePosted?: number | null): Date | null {
    if (!datePosted) {
      return null;
    }

    return new Date(datePosted);
  }
}

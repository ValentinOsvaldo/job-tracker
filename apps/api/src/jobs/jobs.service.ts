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
import { JobSource } from './enums/job-source.enum';
import { IngestJobDto } from './dto/ingest-job.dto';
import { IngestResult, PaginatedJobs } from './dto/jobs-response.dto';
import { ScrapeTriggerResultDto } from './dto/scrape-trigger-result.dto';
import { Job } from './entities/job.entity';
import { JobUserStatus } from './entities/job-user-status.entity';
import { InterestStatus } from './enums/interest-status.enum';
import { JobSortBy } from './enums/job-sort-by.enum';
import { SortDirection } from './enums/sort-direction.enum';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { JobsListQuery } from './types/jobs-list-query.type';

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
    @InjectRepository(JobUserStatus)
    private readonly jobUserStatusRepository: Repository<JobUserStatus>,
    private readonly jobAnalysesService: JobAnalysesService,
  ) {}

  async ingest(records: Record<string, unknown>[]): Promise<IngestResult> {
    const received = records.length;
    let rejected = 0;
    const validRecords: IngestJobDto[] = [];

    for (const raw of records) {
      const validated = this.validateIngestRecord(raw);

      if (!validated) {
        rejected++;
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
      };
      this.logger.log(
        `Ingest complete: received=${received}, inserted=0, skipped=0, rejected=${rejected}`,
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
    }

    const result: IngestResult = {
      received,
      inserted: newJobs.length,
      skipped: validRecords.length - newJobs.length,
      rejected,
    };

    this.logger.log(
      `Ingest complete: received=${result.received}, inserted=${result.inserted}, skipped=${result.skipped}, rejected=${result.rejected}`,
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
    if (patch.applied !== undefined) {
      row.applied = patch.applied;
    }
    if (patch.rejected !== undefined) {
      row.rejected = patch.rejected;
    }

    const saved = await this.jobUserStatusRepository.save(row);

    return {
      job_id: jobId,
      interest: saved.interest,
      applied: saved.applied,
      rejected: saved.rejected,
    };
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
    },
  ) {
    const qb = this.jobsRepository.createQueryBuilder('job');

    if (filters.source) {
      qb.andWhere('job.source = :source', { source: filters.source });
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
        qb.orderBy('job.scraped_at', 'DESC');
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

    const body = this.buildScrapeRequestBody(activeProfiles);
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
    const locations = uniqueStrings(
      activeProfiles.flatMap((profile) => profile.locations ?? []),
    );

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

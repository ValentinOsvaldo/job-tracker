import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { In, Repository } from 'typeorm';
import { JobAnalysis } from '../job-analyses/entities/job-analysis.entity';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { JobSource } from './enums/job-source.enum';
import { IngestJobDto } from './dto/ingest-job.dto';
import { IngestResult, PaginatedJobs } from './dto/jobs-response.dto';
import { ScrapeTriggerResultDto } from './dto/scrape-trigger-result.dto';
import { Job } from './entities/job.entity';
import { JobUserStatus } from './entities/job-user-status.entity';
import { JobInterestStatus } from './enums/job-interest-status.enum';
import { JobsListQuery } from './types/jobs-list-query.type';

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

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

    const newJobs = jobs.filter((job) => job.url && !existingUrls.has(job.url));

    if (newJobs.length > 0) {
      await this.jobsRepository.upsert(newJobs, {
        conflictPaths: ['url'],
        skipUpdateIfNoValuesChanged: true,
      });

      const insertedJobs = await this.jobsRepository.find({
        where: { url: In(newJobs.map((job) => job.url as string)) },
        select: { id: true },
      });

      this.jobAnalysesService.queueAnalysesForJobs(
        insertedJobs.map((job) => job.id),
      );
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

  async findAll(userId: string, query: JobsListQuery): Promise<PaginatedJobs> {
    const { page, limit, profileId, minScore, source, status } = query;

    if (profileId) {
      await this.assertProfileBelongsToUser(userId, profileId);
    }

    const listQuery = this.buildJobsListQuery(userId, {
      source,
      profileId,
      minScore,
      status,
    });
    const total = await listQuery.getCount();
    const jobs = await listQuery
      .orderBy('job.scraped_at', 'DESC')
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
    status: JobInterestStatus | null,
  ): Promise<{ job_id: string; status: JobInterestStatus | null }> {
    const job = await this.jobsRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const existing = await this.jobUserStatusRepository.findOne({
      where: { user_id: userId, job_id: jobId },
    });

    if (status === null) {
      if (existing) {
        await this.jobUserStatusRepository.remove(existing);
      }
      return { job_id: jobId, status: null };
    }

    if (existing) {
      existing.status = status;
      await this.jobUserStatusRepository.save(existing);
    } else {
      await this.jobUserStatusRepository.save({
        user_id: userId,
        job_id: jobId,
        status,
      });
    }

    return { job_id: jobId, status };
  }

  private async attachUserStatuses(
    jobs: Job[],
    userId: string,
  ): Promise<void> {
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
      statuses.map((row) => [row.job_id, row.status] as const),
    );

    for (const job of jobs) {
      job.user_status = statusMap.get(job.id) ?? null;
    }
  }

  private buildJobsListQuery(
    userId: string,
    filters: {
      source?: JobSource;
      profileId?: string;
      minScore?: number;
      status?: JobInterestStatus;
    },
  ) {
    const qb = this.jobsRepository.createQueryBuilder('job');

    if (filters.source) {
      qb.andWhere('job.source = :source', { source: filters.source });
    }

    if (filters.status) {
      qb.innerJoin(
        JobUserStatus,
        'jus',
        'jus.job_id = job.id AND jus.user_id = :statusUserId AND jus.status = :interestStatus',
        {
          statusUserId: userId,
          interestStatus: filters.status,
        },
      );
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
        | ScrapeTriggerResultDto
        | { detail?: unknown; message?: string }
        | null;

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
        (profile) => ROLE_SEARCH_TERMS[profile.role] ?? `${profile.role} developer`,
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

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { In, Repository } from 'typeorm';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { IngestJobDto } from './dto/ingest-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import { IngestResult, PaginatedJobs } from './dto/jobs-response.dto';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
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

  async findAll(query: ListJobsQueryDto): Promise<PaginatedJobs> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = query.source ? { source: query.source } : {};

    const [data, total] = await this.jobsRepository.findAndCount({
      where,
      order: { scraped_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id });

    if (!job) {
      throw new NotFoundException(`Job with id ${id} not found`);
    }

    return job;
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

  private mapIngestRecord(record: IngestJobDto): Partial<Job> {
    return {
      title: record.title,
      url: record.job_url,
      source: record.site,
      company: record.company ?? null,
      location: record.location ?? null,
      description: record.description ?? null,
      date_posted: this.parseDatePosted(record.date_posted),
    };
  }

  private parseDatePosted(datePosted?: number | null): Date | null {
    if (!datePosted) {
      return null;
    }

    return new Date(datePosted);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JobAnalysesService } from '../job-analyses/job-analyses.service';
import { IngestJobDto } from './dto/ingest-job.dto';
import { ListJobsQueryDto } from './dto/list-jobs-query.dto';
import {
  IngestResult,
  PaginatedJobs,
} from './dto/jobs-response.dto';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    private readonly jobAnalysesService: JobAnalysesService,
  ) {}

  async ingest(records: IngestJobDto[]): Promise<IngestResult> {
    const received = records.length;
    const jobs = records
      .filter((record) => record.title && record.job_url)
      .map((record) => this.mapIngestRecord(record));

    if (jobs.length === 0) {
      return { received, inserted: 0, skipped: received };
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

    return {
      received,
      inserted: newJobs.length,
      skipped: received - newJobs.length,
    };
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

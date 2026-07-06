import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { GroqService } from '../groq/groq.service';
import { Job } from '../jobs/entities/job.entity';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { JobAnalysis } from './entities/job-analysis.entity';
import { CreateJobAnalysisInput } from './types/create-job-analysis.input';

interface AnalysisTask {
  job: Job;
  profile: SearchProfile;
  user: User;
}

@Injectable()
export class JobAnalysesService {
  private readonly logger = new Logger(JobAnalysesService.name);

  constructor(
    @InjectRepository(JobAnalysis)
    private readonly jobAnalysesRepository: Repository<JobAnalysis>,
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
    @InjectRepository(SearchProfile)
    private readonly profilesRepository: Repository<SearchProfile>,
    private readonly groqService: GroqService,
    private readonly configService: ConfigService,
  ) {}

  create(input: CreateJobAnalysisInput): Promise<JobAnalysis> {
    const analysis = this.jobAnalysesRepository.create(input);
    return this.jobAnalysesRepository.save(analysis);
  }

  findByProfileId(profileId: string): Promise<JobAnalysis[]> {
    return this.jobAnalysesRepository.find({
      where: { profile_id: profileId },
      relations: { job: true },
      order: { fit_score: 'DESC' },
    });
  }

  findByJobId(jobId: string): Promise<JobAnalysis[]> {
    return this.jobAnalysesRepository.find({
      where: { job_id: jobId },
      relations: { profile: true },
      order: { fit_score: 'DESC' },
    });
  }

  findByJobAndProfile(
    jobId: string,
    profileId: string,
  ): Promise<JobAnalysis | null> {
    return this.jobAnalysesRepository.findOne({
      where: { job_id: jobId, profile_id: profileId },
    });
  }

  findTopByProfileId(profileId: string, limit = 5): Promise<JobAnalysis[]> {
    return this.jobAnalysesRepository.find({
      where: { profile_id: profileId },
      relations: { job: true },
      order: { fit_score: 'DESC' },
      take: limit,
    });
  }

  async deleteByProfileId(profileId: string): Promise<void> {
    await this.jobAnalysesRepository.delete({ profile_id: profileId });
  }

  queueAnalysesForJobs(jobIds: string[]): void {
    if (jobIds.length === 0) {
      return;
    }

    void this.buildTasksForJobs(jobIds)
      .then((tasks) => this.runBatch(tasks))
      .catch((error: unknown) => {
        this.logger.error('Failed to queue analyses for jobs', error);
      });
  }

  queueAnalysesForProfile(profileId: string): void {
    void this.buildTasksForProfile(profileId)
      .then((tasks) => this.runBatch(tasks))
      .catch((error: unknown) => {
        this.logger.error(
          `Failed to queue analyses for profile ${profileId}`,
          error,
        );
      });
  }

  private async buildTasksForJobs(jobIds: string[]): Promise<AnalysisTask[]> {
    const jobs = await this.jobsRepository.find({
      where: { id: In(jobIds) },
    });

    if (jobs.length === 0) {
      return [];
    }

    const profiles = await this.getEligibleProfiles();
    return this.buildTasks(jobs, profiles);
  }

  private async buildTasksForProfile(
    profileId: string,
  ): Promise<AnalysisTask[]> {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, is_active: true },
      relations: { user: true },
    });

    if (!profile?.user?.cv_text) {
      return [];
    }

    const jobs = await this.jobsRepository.find();
    return this.buildTasks(jobs, [profile]);
  }

  private async getEligibleProfiles(): Promise<SearchProfile[]> {
    const profiles = await this.profilesRepository.find({
      where: { is_active: true },
      relations: { user: true },
    });

    return profiles.filter((profile) => !!profile.user?.cv_text);
  }

  private async buildTasks(
    jobs: Job[],
    profiles: SearchProfile[],
  ): Promise<AnalysisTask[]> {
    if (jobs.length === 0 || profiles.length === 0) {
      return [];
    }

    const existingAnalyses = await this.jobAnalysesRepository.find({
      where: jobs.flatMap((job) =>
        profiles.map((profile) => ({
          job_id: job.id,
          profile_id: profile.id,
        })),
      ),
      select: { job_id: true, profile_id: true },
    });

    const existingKeys = new Set(
      existingAnalyses.map(
        (analysis) => `${analysis.job_id}:${analysis.profile_id}`,
      ),
    );

    const tasks: AnalysisTask[] = [];

    for (const job of jobs) {
      for (const profile of profiles) {
        const key = `${job.id}:${profile.id}`;

        if (existingKeys.has(key) || !profile.user?.cv_text) {
          continue;
        }

        tasks.push({
          job,
          profile,
          user: profile.user,
        });
      }
    }

    return tasks;
  }

  private async runBatch(tasks: AnalysisTask[]): Promise<void> {
    if (tasks.length === 0) {
      return;
    }

    const batchSize = Number(this.configService.get('GROQ_BATCH_SIZE') ?? 5);
    const batchDelayMs = Number(
      this.configService.get('GROQ_BATCH_DELAY_MS') ?? 200,
    );

    for (let index = 0; index < tasks.length; index += batchSize) {
      const chunk = tasks.slice(index, index + batchSize);

      await Promise.allSettled(chunk.map((task) => this.analyzeAndSave(task)));

      if (index + batchSize < tasks.length) {
        await this.sleep(batchDelayMs);
      }
    }
  }

  private async analyzeAndSave(task: AnalysisTask): Promise<void> {
    const existing = await this.findByJobAndProfile(
      task.job.id,
      task.profile.id,
    );

    if (existing) {
      return;
    }

    try {
      const result = await this.groqService.analyzeJob(
        task.job,
        task.profile,
        task.user,
      );

      await this.jobAnalysesRepository.save({
        job_id: task.job.id,
        profile_id: task.profile.id,
        fit_score: result.fit_score,
        matched_skills: result.matched_skills,
        missing_skills: result.missing_skills,
        summary: result.summary,
        salary_min: result.salary_min,
        salary_max: result.salary_max,
        salary_is_inferred: result.salary_is_inferred,
        benefits: result.benefits,
        benefits_is_inferred: result.benefits_is_inferred,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Analysis failed for job ${task.job.id} and profile ${task.profile.id}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

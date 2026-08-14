import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  AI_JOB_ANALYZER,
  AI_JOB_SUMMARIZER,
  AI_RELEVANCE_CLASSIFIER,
  AI_WORK_MODE_CLASSIFIER,
} from '../ai/ai.constants';
import { JobAnalyzer } from '../ai/interfaces/job-analyzer.interface';
import { JobSummarizer } from '../ai/interfaces/job-summarizer.interface';
import { RelevanceClassifier } from '../ai/interfaces/relevance-classifier.interface';
import { WorkModeClassifier } from '../ai/interfaces/work-mode-classifier.interface';
import { buildAnalysisPrompt } from '../ai/prompts/build-analysis-prompt';
import {
  JobAnalysisResult,
  parseAnalysisResult,
} from '../ai/types/job-analysis-result.type';
import { Job } from '../jobs/entities/job.entity';
import { JobRelevance } from '../jobs/enums/job-relevance.enum';
import { WorkMode } from '../jobs/enums/work-mode.enum';
import { WorkModeSource } from '../jobs/enums/work-mode-source.enum';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import { RegenerateAnalysesResult } from './dto/regenerate-analyses-result.dto';
import { JobAnalysis } from './entities/job-analysis.entity';
import { CreateJobAnalysisInput } from './types/create-job-analysis.input';
import { inferJobRoles } from './utils/infer-job-roles';

interface AnalysisTask {
  job: Job;
  profile: SearchProfile;
  user: User;
}

interface TaskOptions {
  force?: boolean;
  /** Narrows which profiles a given job is analyzed against. Used only for
   * the automatic ingest path — manual/forced regeneration always targets
   * whatever profile(s) the caller explicitly asked for. */
  profilesForJob?: (job: Job) => SearchProfile[];
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
    @Inject(AI_JOB_ANALYZER)
    private readonly jobAnalyzer: JobAnalyzer,
    @Inject(AI_JOB_SUMMARIZER)
    private readonly jobSummarizer: JobSummarizer,
    @Inject(AI_WORK_MODE_CLASSIFIER)
    private readonly workModeClassifier: WorkModeClassifier,
    @Inject(AI_RELEVANCE_CLASSIFIER)
    private readonly relevanceClassifier: RelevanceClassifier,
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

  queueDescriptionSummaries(jobIds: string[]): void {
    if (jobIds.length === 0) {
      return;
    }

    void this.jobsRepository
      .find({ where: { id: In(jobIds) } })
      .then((jobs) => this.runSummaryBatch(jobs))
      .catch((error: unknown) => {
        this.logger.error('Failed to queue description summaries', error);
      });
  }

  /** Only classifies jobs whose work_mode wasn't already resolved by the
   * scraper/backend heuristic — keeps AI usage limited to the residual. */
  queueWorkModeClassification(jobIds: string[]): void {
    if (jobIds.length === 0) {
      return;
    }

    void this.jobsRepository
      .find({ where: { id: In(jobIds), work_mode: WorkMode.UNKNOWN } })
      .then((jobs) => this.runWorkModeBatch(jobs))
      .catch((error: unknown) => {
        this.logger.error('Failed to queue work mode classification', error);
      });
  }

  async regenerateWorkModeForJob(jobId: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    await this.classifyAndSaveWorkMode(job, { force: true });

    return (await this.jobsRepository.findOneBy({ id: jobId })) ?? job;
  }

  /** Fire-and-forget backfill for jobs ingested before this feature existed
   * (or left as 'unknown' by the heuristic). Returns immediately with how
   * many jobs were queued; classification runs in the background. */
  async backfillWorkModes(): Promise<{ queued: number }> {
    const jobs = await this.jobsRepository.find({
      where: { work_mode: WorkMode.UNKNOWN },
    });

    void this.runWorkModeBatch(jobs).catch((error: unknown) => {
      this.logger.error('Failed to backfill work modes', error);
    });

    return { queued: jobs.length };
  }

  private async runWorkModeBatch(jobs: Job[]): Promise<void> {
    if (jobs.length === 0) {
      return;
    }

    const batchSize = Number(this.configService.get('AI_BATCH_SIZE') ?? 5);
    const batchDelayMs = Number(
      this.configService.get('AI_BATCH_DELAY_MS') ?? 200,
    );

    for (let index = 0; index < jobs.length; index += batchSize) {
      const chunk = jobs.slice(index, index + batchSize);

      await Promise.allSettled(
        chunk.map((job) => this.classifyAndSaveWorkMode(job)),
      );

      if (index + batchSize < jobs.length) {
        await this.sleep(batchDelayMs);
      }
    }
  }

  private async classifyAndSaveWorkMode(
    job: Job,
    options: TaskOptions = {},
  ): Promise<void> {
    if (job.work_mode !== WorkMode.UNKNOWN && !options.force) {
      return;
    }

    try {
      const result = await this.workModeClassifier.classify(job);

      await this.jobsRepository.update(job.id, {
        work_mode: result.work_mode,
        work_mode_source: WorkModeSource.AI,
        location_city: result.location_city,
        location_region: result.location_region,
        location_country: result.location_country,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Work mode classification failed for job ${job.id}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  /** Fire-and-forget on-demand scan: classifies every job whose relevance
   * hasn't been checked yet against the roles/keywords of active search
   * profiles, so off-topic scraped jobs (wrong occupation entirely) can be
   * filtered out and bulk-deleted from the jobs list. Returns immediately
   * with how many jobs were queued; classification runs in the background. */
  async scanRelevance(): Promise<{ queued: number }> {
    const profiles = await this.profilesRepository.find({
      where: { is_active: true },
    });

    if (profiles.length === 0) {
      return { queued: 0 };
    }

    const targetRoles = this.buildTargetRolesDescription(profiles);

    const jobs = await this.jobsRepository.find({
      where: { relevance: JobRelevance.UNKNOWN },
    });

    void this.runRelevanceBatch(jobs, targetRoles).catch((error: unknown) => {
      this.logger.error('Failed to scan job relevance', error);
    });

    return { queued: jobs.length };
  }

  private buildTargetRolesDescription(profiles: SearchProfile[]): string {
    return profiles
      .map((profile) => {
        const keywords =
          profile.keywords.length > 0 ? profile.keywords.join(', ') : 'N/A';
        return `- ${profile.role}: ${keywords}`;
      })
      .join('\n');
  }

  private async runRelevanceBatch(
    jobs: Job[],
    targetRoles: string,
  ): Promise<void> {
    if (jobs.length === 0) {
      return;
    }

    const batchSize = Number(this.configService.get('AI_BATCH_SIZE') ?? 5);
    const batchDelayMs = Number(
      this.configService.get('AI_BATCH_DELAY_MS') ?? 200,
    );

    for (let index = 0; index < jobs.length; index += batchSize) {
      const chunk = jobs.slice(index, index + batchSize);

      await Promise.allSettled(
        chunk.map((job) => this.classifyAndSaveRelevance(job, targetRoles)),
      );

      if (index + batchSize < jobs.length) {
        await this.sleep(batchDelayMs);
      }
    }
  }

  private async classifyAndSaveRelevance(
    job: Job,
    targetRoles: string,
  ): Promise<void> {
    try {
      const result = await this.relevanceClassifier.classify(job, targetRoles);

      await this.jobsRepository.update(job.id, {
        relevance: result.relevant
          ? JobRelevance.RELEVANT
          : JobRelevance.IRRELEVANT,
        relevance_reason: result.reason,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Relevance classification failed for job ${job.id}`,
        error instanceof Error ? error.message : error,
      );
    }
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

  async regenerateForJob(
    userId: string,
    jobId: string,
    profileId?: string,
  ): Promise<RegenerateAnalysesResult> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const profiles = await this.getUserEligibleProfiles(userId, profileId);

    if (profiles.length === 0) {
      throw new BadRequestException(
        profileId
          ? `Profile with id ${profileId} not found or has no CV`
          : 'No active profiles with CV found for this user',
      );
    }

    const tasks = await this.buildTasks([job], profiles, { force: true });

    void this.runBatch(tasks, { force: true }).catch((error: unknown) => {
      this.logger.error(
        `Failed to regenerate analyses for job ${jobId}`,
        error,
      );
    });

    return {
      queued: tasks.length,
      scope: 'job',
      job_id: jobId,
    };
  }

  async regenerateForProfile(
    userId: string,
    profileId: string,
  ): Promise<RegenerateAnalysesResult> {
    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, user_id: userId },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    if (!profile.user?.cv_text) {
      throw new BadRequestException(
        `Profile with id ${profileId} requires an uploaded CV before analysis`,
      );
    }

    const jobs = await this.jobsRepository.find();
    const tasks = await this.buildTasks(jobs, [profile], { force: true });

    void this.runBatch(tasks, { force: true }).catch((error: unknown) => {
      this.logger.error(
        `Failed to regenerate analyses for profile ${profileId}`,
        error,
      );
    });

    return {
      queued: tasks.length,
      scope: 'profile',
      profile_id: profileId,
    };
  }

  /** Builds the same prompt the AI provider would receive, so it can be
   * copied and pasted into an external chat tool when tokens are running
   * low. Scoped to the requesting user so their CV/profile isn't leaked. */
  async getPromptForJob(
    userId: string,
    jobId: string,
    profileId: string,
  ): Promise<string> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, user_id: userId },
      relations: { user: true },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    if (!profile.user?.cv_text) {
      throw new BadRequestException(
        `Profile with id ${profileId} requires an uploaded CV before analysis`,
      );
    }

    return buildAnalysisPrompt(job, profile, profile.user);
  }

  /** Saves an analysis result obtained by pasting the prompt from
   * getPromptForJob into an external AI chat tool and copying back its raw
   * response, instead of calling the AI provider directly. */
  async saveManualAnalysis(
    userId: string,
    jobId: string,
    profileId: string,
    raw: string,
  ): Promise<JobAnalysis> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    const profile = await this.profilesRepository.findOne({
      where: { id: profileId, user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with id ${profileId} not found`);
    }

    let result: JobAnalysisResult;
    try {
      result = parseAnalysisResult(raw);
    } catch {
      throw new BadRequestException(
        'El texto pegado no es un JSON de análisis válido',
      );
    }

    const existing = await this.findByJobAndProfile(jobId, profileId);

    const saved = await this.jobAnalysesRepository.save({
      id: existing?.id,
      job_id: jobId,
      profile_id: profileId,
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

    return (
      (await this.jobAnalysesRepository.findOne({
        where: { id: saved.id },
        relations: { profile: true },
      })) ?? saved
    );
  }

  async regenerateSummaryForJob(jobId: string): Promise<Job> {
    const job = await this.jobsRepository.findOneBy({ id: jobId });

    if (!job) {
      throw new NotFoundException(`Job with id ${jobId} not found`);
    }

    if (!job.description) {
      throw new BadRequestException('Job has no description to summarize');
    }

    const summary = await this.jobSummarizer.summarize(job);
    await this.jobsRepository.update(jobId, { description_summary: summary });

    job.description_summary = summary;
    return job;
  }

  private async getUserEligibleProfiles(
    userId: string,
    profileId?: string,
  ): Promise<SearchProfile[]> {
    const profiles = await this.profilesRepository.find({
      where: {
        user_id: userId,
        is_active: true,
        ...(profileId ? { id: profileId } : {}),
      },
      relations: { user: true },
    });

    return profiles.filter((profile) => !!profile.user?.cv_text);
  }

  private async buildTasksForJobs(jobIds: string[]): Promise<AnalysisTask[]> {
    const jobs = await this.jobsRepository.find({
      where: { id: In(jobIds) },
    });

    if (jobs.length === 0) {
      return [];
    }

    const profiles = await this.getEligibleProfiles();
    return this.buildTasks(jobs, profiles, {
      profilesForJob: (job) => {
        const inferredRoles = inferJobRoles(job.title);
        return inferredRoles.length > 0
          ? profiles.filter((profile) => inferredRoles.includes(profile.role))
          : profiles;
      },
    });
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
    options: TaskOptions = {},
  ): Promise<AnalysisTask[]> {
    if (jobs.length === 0 || profiles.length === 0) {
      return [];
    }

    let existingKeys = new Set<string>();

    if (!options.force) {
      const existingAnalyses = await this.jobAnalysesRepository.find({
        where: jobs.flatMap((job) =>
          profiles.map((profile) => ({
            job_id: job.id,
            profile_id: profile.id,
          })),
        ),
        select: { job_id: true, profile_id: true },
      });

      existingKeys = new Set(
        existingAnalyses.map(
          (analysis) => `${analysis.job_id}:${analysis.profile_id}`,
        ),
      );
    }

    const tasks: AnalysisTask[] = [];

    for (const job of jobs) {
      const jobProfiles = options.profilesForJob
        ? options.profilesForJob(job)
        : profiles;

      for (const profile of jobProfiles) {
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

  private async runBatch(
    tasks: AnalysisTask[],
    options: TaskOptions = {},
  ): Promise<void> {
    if (tasks.length === 0) {
      return;
    }

    const batchSize = Number(this.configService.get('AI_BATCH_SIZE') ?? 5);
    const batchDelayMs = Number(
      this.configService.get('AI_BATCH_DELAY_MS') ?? 200,
    );

    for (let index = 0; index < tasks.length; index += batchSize) {
      const chunk = tasks.slice(index, index + batchSize);

      await Promise.allSettled(
        chunk.map((task) => this.analyzeAndSave(task, options)),
      );

      if (index + batchSize < tasks.length) {
        await this.sleep(batchDelayMs);
      }
    }
  }

  private async analyzeAndSave(
    task: AnalysisTask,
    options: TaskOptions = {},
  ): Promise<void> {
    const existing = await this.findByJobAndProfile(
      task.job.id,
      task.profile.id,
    );

    if (existing && !options.force) {
      return;
    }

    try {
      const result = await this.jobAnalyzer.analyzeJob(
        task.job,
        task.profile,
        task.user,
      );

      await this.jobAnalysesRepository.save({
        id: existing?.id,
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

  private async runSummaryBatch(jobs: Job[]): Promise<void> {
    const pending = jobs.filter((job) => job.description);

    if (pending.length === 0) {
      return;
    }

    const batchSize = Number(this.configService.get('AI_BATCH_SIZE') ?? 5);
    const batchDelayMs = Number(
      this.configService.get('AI_BATCH_DELAY_MS') ?? 200,
    );

    for (let index = 0; index < pending.length; index += batchSize) {
      const chunk = pending.slice(index, index + batchSize);

      await Promise.allSettled(chunk.map((job) => this.summarizeAndSave(job)));

      if (index + batchSize < pending.length) {
        await this.sleep(batchDelayMs);
      }
    }
  }

  private async summarizeAndSave(job: Job): Promise<void> {
    try {
      const summary = await this.jobSummarizer.summarize(job);
      await this.jobsRepository.update(job.id, {
        description_summary: summary,
      });
    } catch (error: unknown) {
      this.logger.warn(
        `Description summary failed for job ${job.id}`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

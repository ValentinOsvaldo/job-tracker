import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobAnalysis } from './entities/job-analysis.entity';
import { CreateJobAnalysisInput } from './types/create-job-analysis.input';

@Injectable()
export class JobAnalysesService {
  constructor(
    @InjectRepository(JobAnalysis)
    private readonly jobAnalysesRepository: Repository<JobAnalysis>,
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

  queueAnalysesForProfile(profileId: string): void {
    // GroqModule integration: analyze all existing jobs against this profile
    void profileId;
  }
}

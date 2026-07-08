import { Job } from '../../jobs/entities/job.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';
import { User } from '../../users/entities/user.entity';
import { JobAnalysisResult } from '../types/job-analysis-result.type';

export interface JobAnalyzer {
  analyzeJob(
    job: Job,
    profile: SearchProfile,
    user: User,
  ): Promise<JobAnalysisResult>;
}

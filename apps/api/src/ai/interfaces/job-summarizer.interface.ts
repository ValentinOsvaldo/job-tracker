import { Job } from '../../jobs/entities/job.entity';

export interface JobSummarizer {
  summarize(job: Job): Promise<string>;
}

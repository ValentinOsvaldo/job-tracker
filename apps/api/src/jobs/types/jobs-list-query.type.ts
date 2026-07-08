import { JobSource } from '../enums/job-source.enum';

export interface JobsListQuery {
  source?: JobSource;
  profileId?: string;
  minScore?: number;
  page: number;
  limit: number;
}

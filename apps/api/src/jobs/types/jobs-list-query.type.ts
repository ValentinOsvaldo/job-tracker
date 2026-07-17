import { JobSource } from '../enums/job-source.enum';
import { JobInterestStatus } from '../enums/job-interest-status.enum';

export interface JobsListQuery {
  source?: JobSource;
  profileId?: string;
  minScore?: number;
  status?: JobInterestStatus;
  page: number;
  limit: number;
}

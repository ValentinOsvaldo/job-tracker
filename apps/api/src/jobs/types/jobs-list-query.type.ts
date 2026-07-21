import { JobSource } from '../enums/job-source.enum';
import { InterestStatus } from '../enums/interest-status.enum';
import { JobSortBy } from '../enums/job-sort-by.enum';
import { SortDirection } from '../enums/sort-direction.enum';

export interface JobsListQuery {
  source?: JobSource;
  profileId?: string;
  minScore?: number;
  interest?: InterestStatus;
  applied?: boolean;
  rejected?: boolean;
  sortBy?: JobSortBy;
  sortDir?: SortDirection;
  page: number;
  limit: number;
}

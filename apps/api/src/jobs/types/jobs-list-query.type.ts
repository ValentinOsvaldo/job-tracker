import { JobSource } from '../enums/job-source.enum';
import { InterestStatus } from '../enums/interest-status.enum';
import { JobRelevance } from '../enums/job-relevance.enum';
import { JobRoleCategory } from '../enums/job-role-category.enum';
import { JobSortBy } from '../enums/job-sort-by.enum';
import { SortDirection } from '../enums/sort-direction.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { AddedWithin } from '../enums/added-within.enum';

export interface JobsListQuery {
  source?: JobSource;
  profileId?: string;
  minScore?: number;
  interest?: InterestStatus;
  applied?: boolean;
  rejected?: boolean;
  workMode?: WorkMode[];
  relevance?: JobRelevance;
  roleCategory?: JobRoleCategory[];
  techKeyword?: string;
  locationCountry?: string;
  locationCity?: string;
  addedWithin?: AddedWithin;
  sortBy?: JobSortBy;
  sortDir?: SortDirection;
  page: number;
  limit: number;
}

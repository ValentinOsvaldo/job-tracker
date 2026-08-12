import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { ParseBoolean } from '../../common/transforms/parse-boolean.transform';
import { JobSource } from '../enums/job-source.enum';
import { InterestStatus } from '../enums/interest-status.enum';
import { JobRelevance } from '../enums/job-relevance.enum';
import { JobRoleCategory } from '../enums/job-role-category.enum';
import { JobSortBy } from '../enums/job-sort-by.enum';
import { SortDirection } from '../enums/sort-direction.enum';
import { WorkMode } from '../enums/work-mode.enum';
import { AddedWithin } from '../enums/added-within.enum';

function toArray({ value }: { value: unknown }): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export class ListJobsQueryDto {
  @ApiPropertyOptional({ enum: JobSource, example: JobSource.LINKEDIN })
  @IsOptional()
  @IsEnum(JobSource)
  source?: JobSource;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  profile_id?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  min_score?: number;

  @ApiPropertyOptional({ enum: InterestStatus })
  @IsOptional()
  @IsEnum(InterestStatus)
  interest?: InterestStatus;

  @ApiPropertyOptional({
    enum: WorkMode,
    isArray: true,
    description: 'Comma-separated list, e.g. remote,hybrid',
    example: 'remote,hybrid',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(WorkMode, { each: true })
  work_mode?: WorkMode[];

  @ApiPropertyOptional({ enum: JobRelevance })
  @IsOptional()
  @IsEnum(JobRelevance)
  relevance?: JobRelevance;

  @ApiPropertyOptional({
    enum: JobRoleCategory,
    isArray: true,
    description: 'Comma-separated list, e.g. frontend,backend',
    example: 'frontend,fullstack',
  })
  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsEnum(JobRoleCategory, { each: true })
  role_category?: JobRoleCategory[];

  @ApiPropertyOptional({
    example: 'React',
    description: 'Filter to jobs tagged with this technology keyword',
  })
  @IsOptional()
  @IsString()
  tech_keyword?: string;

  @ApiPropertyOptional({ example: 'Mexico' })
  @IsOptional()
  @IsString()
  location_country?: string;

  @ApiPropertyOptional({ example: 'Guadalajara' })
  @IsOptional()
  @IsString()
  location_city?: string;

  @ApiPropertyOptional({ description: 'Filter to jobs the user applied to' })
  @IsOptional()
  @ParseBoolean()
  @IsBoolean()
  applied?: boolean;

  @ApiPropertyOptional({
    description: 'Filter to jobs the user was rejected from',
  })
  @IsOptional()
  @ParseBoolean()
  @IsBoolean()
  rejected?: boolean;

  @ApiPropertyOptional({
    enum: AddedWithin,
    description:
      'Filter to jobs scraped within this window. Omit to include all history.',
  })
  @IsOptional()
  @IsEnum(AddedWithin)
  added_within?: AddedWithin;

  @ApiPropertyOptional({ enum: JobSortBy })
  @IsOptional()
  @IsEnum(JobSortBy)
  sort_by?: JobSortBy;

  @ApiPropertyOptional({ enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection)
  sort_dir?: SortDirection;

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

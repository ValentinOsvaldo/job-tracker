import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { JobSource } from '../enums/job-source.enum';
import { JobInterestStatus } from '../enums/job-interest-status.enum';

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

  @ApiPropertyOptional({ enum: JobInterestStatus })
  @IsOptional()
  @IsEnum(JobInterestStatus)
  status?: JobInterestStatus;

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

import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JobSource } from '../types/job-source.type';

export class IngestJobDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsUrl()
  job_url: string;

  @IsIn(['linkedin', 'indeed'])
  site: JobSource;

  @IsOptional()
  @IsString()
  company?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsNumber()
  date_posted?: number | null;
}

export class IngestJobsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestJobDto)
  jobs: IngestJobDto[];
}

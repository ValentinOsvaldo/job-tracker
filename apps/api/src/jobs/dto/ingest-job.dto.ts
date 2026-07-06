import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JobSource } from '../enums/job-source.enum';

export class IngestJobDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsUrl()
  job_url: string;

  @IsEnum(JobSource)
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

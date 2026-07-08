import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JobSource } from '../enums/job-source.enum';

export class IngestJobDto {
  @ApiProperty({ example: 'Senior Frontend Developer' })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiProperty({ example: 'https://linkedin.com/jobs/view/123456' })
  @IsString()
  @MinLength(1)
  @Matches(/^https?:\/\//)
  job_url: string;

  @ApiProperty({ enum: JobSource, example: JobSource.LINKEDIN })
  @IsEnum(JobSource)
  site: JobSource;

  @ApiPropertyOptional({ nullable: true, example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  company?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Remote' })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Unix timestamp of the posting date',
    example: 1717200000,
  })
  @IsOptional()
  @IsNumber()
  date_posted?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'fulltime' })
  @IsOptional()
  @IsString()
  job_type?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 110000 })
  @IsOptional()
  @IsNumber()
  min_amount?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 135000 })
  @IsOptional()
  @IsNumber()
  max_amount?: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'yearly' })
  @IsOptional()
  @IsString()
  interval?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string | null;
}

export class IngestJobsDto {
  @ApiProperty({ type: [IngestJobDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngestJobDto)
  jobs: IngestJobDto[];
}

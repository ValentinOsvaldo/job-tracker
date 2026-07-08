import { ApiProperty } from '@nestjs/swagger';
import { Job } from '../entities/job.entity';

export class IngestResultDto {
  @ApiProperty({ example: 10 })
  received: number;

  @ApiProperty({ example: 8 })
  inserted: number;

  @ApiProperty({ example: 2 })
  skipped: number;

  @ApiProperty({ example: 0 })
  rejected: number;
}

export class PaginatedJobsResponseDto {
  @ApiProperty({ type: [Job] })
  data: Job[];

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}

export type IngestResult = IngestResultDto;
export type PaginatedJobs = PaginatedJobsResponseDto;

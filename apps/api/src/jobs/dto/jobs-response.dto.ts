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

  @ApiProperty({
    example: 0,
    description: 'Records skipped because their company is blocklisted',
  })
  blocked: number;
}

export class DeleteAllJobsResultDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 42, description: 'Number of jobs deleted' })
  deleted: number;
}

export class WorkModeBackfillResultDto {
  @ApiProperty({
    example: 42,
    description: 'Jobs with work_mode=unknown queued for AI classification',
  })
  queued: number;
}

export class RelevanceScanResultDto {
  @ApiProperty({
    example: 42,
    description: 'Jobs with relevance=unknown queued for AI classification',
  })
  queued: number;
}

export class BulkDeleteJobsResultDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 5, description: 'Number of jobs deleted' })
  deleted: number;
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

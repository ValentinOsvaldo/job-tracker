import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegenerateAnalysesResultDto {
  @ApiProperty({ example: 12 })
  queued: number;

  @ApiProperty({ enum: ['job', 'profile'], example: 'job' })
  scope: 'job' | 'profile';

  @ApiPropertyOptional({ format: 'uuid' })
  job_id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  profile_id?: string;
}

export type RegenerateAnalysesResult = RegenerateAnalysesResultDto;

import { ApiProperty } from '@nestjs/swagger';

export class PipelineStatsDto {
  @ApiProperty({
    example: 12,
    description: 'Applied jobs still awaiting a response',
  })
  pending: number;

  @ApiProperty({
    example: 5,
    description: 'Applied jobs the user was rejected from',
  })
  rejected: number;

  @ApiProperty({ example: 17, description: 'Total jobs applied to' })
  total_applied: number;

  @ApiProperty({
    example: 0.29,
    nullable: true,
    description: 'rejected / total_applied, or null if nothing applied yet',
  })
  rejection_rate: number | null;

  @ApiProperty({
    example: 8.5,
    nullable: true,
    description:
      'Average days between marking a job applied and being rejected, across rejections with both timestamps recorded. Null if no such rejection exists yet.',
  })
  avg_days_to_reject: number | null;
}

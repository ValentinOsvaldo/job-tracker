import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { JobInterestStatus } from '../enums/job-interest-status.enum';

export class UpdateJobStatusDto {
  @ApiPropertyOptional({
    enum: JobInterestStatus,
    nullable: true,
    description: 'Set to null to clear the status',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsEnum(JobInterestStatus)
  status: JobInterestStatus | null;
}

export class JobStatusResponseDto {
  @ApiProperty({ format: 'uuid' })
  job_id: string;

  @ApiPropertyOptional({ enum: JobInterestStatus, nullable: true })
  status: JobInterestStatus | null;
}

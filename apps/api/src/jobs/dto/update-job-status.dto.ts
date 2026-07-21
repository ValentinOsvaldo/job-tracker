import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, ValidateIf } from 'class-validator';
import { InterestStatus } from '../enums/interest-status.enum';

export class UpdateJobStatusDto {
  @ApiPropertyOptional({
    enum: InterestStatus,
    nullable: true,
    description: 'Set to null to clear the like/dislike status',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsEnum(InterestStatus)
  interest?: InterestStatus | null;

  @ApiPropertyOptional({ description: 'Whether the user applied to this job' })
  @IsOptional()
  @IsBoolean()
  applied?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user was rejected from this job',
  })
  @IsOptional()
  @IsBoolean()
  rejected?: boolean;
}

export class JobStatusResponseDto {
  @ApiProperty({ format: 'uuid' })
  job_id: string;

  @ApiProperty({ enum: InterestStatus, nullable: true })
  interest: InterestStatus | null;

  @ApiProperty()
  applied: boolean;

  @ApiProperty()
  rejected: boolean;
}

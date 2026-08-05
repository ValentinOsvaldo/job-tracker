import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBlockedCompanyDto {
  @ApiProperty({ example: 'BairesDev' })
  @IsString()
  @MinLength(1)
  company: string;

  @ApiPropertyOptional({ nullable: true, example: 'Rejected 3 times' })
  @IsOptional()
  @IsString()
  reason?: string | null;

  @ApiPropertyOptional({
    description:
      'Also hard-delete existing jobs from this company (and their analyses)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  purge_existing?: boolean;
}

export class BlockedCompanyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'BairesDev' })
  company: string;

  @ApiPropertyOptional({ nullable: true })
  reason: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;
}

export class CreateBlockedCompanyResultDto {
  @ApiProperty({ type: BlockedCompanyResponseDto })
  blocked_company: BlockedCompanyResponseDto;

  @ApiProperty({
    example: 0,
    description:
      'Existing jobs deleted for this company, if purge was requested',
  })
  purged: number;
}

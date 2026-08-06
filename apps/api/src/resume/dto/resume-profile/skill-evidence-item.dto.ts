import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EvidenceConfidence } from '../../enums/evidence-confidence.enum';

export class SkillEvidenceItemDto {
  @ApiProperty({ example: 'ev-1' })
  @IsString()
  @MinLength(1)
  id: string;

  @ApiProperty({ example: 'Migración del pipeline de CI/CD en Acme Corp' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  context: string;

  @ApiProperty({
    example: 'Configuré cache de Docker layers para acelerar los builds',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  raw_fact: string;

  @ApiPropertyOptional({ nullable: true, example: 'De 12min a 7min por build' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  impact?: string | null;

  @ApiProperty({ enum: EvidenceConfidence, example: EvidenceConfidence.MEDIUM })
  @IsEnum(EvidenceConfidence)
  confidence: EvidenceConfidence;
}

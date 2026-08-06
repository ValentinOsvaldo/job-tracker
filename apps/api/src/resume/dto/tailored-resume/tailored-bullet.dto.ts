import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class TailoredBulletDto {
  @ApiProperty({ example: 'a1b2c3d4' })
  @IsString()
  @MinLength(1)
  id: string;

  @ApiProperty({
    example: 'Migré el pipeline de CI reduciendo el build en 40%',
  })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ example: 85 })
  @IsNumber()
  @Min(0)
  @Max(100)
  relevance_score: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  source_bullet_id: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  source_evidence_id: string | null;

  @ApiPropertyOptional({
    description: 'Ignored on write — recomputed server-side on every save',
  })
  @IsOptional()
  @IsBoolean()
  needs_review?: boolean;
}

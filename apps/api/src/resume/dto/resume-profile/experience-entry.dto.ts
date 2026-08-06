import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { BulletDto } from './bullet.dto';

export class ExperienceEntryDto {
  @ApiProperty({ example: 'Acme Corp' })
  @IsString()
  @MinLength(1)
  company: string;

  @ApiProperty({ example: 'Senior Frontend Developer' })
  @IsString()
  @MinLength(1)
  role: string;

  @ApiProperty({ example: '2022 - Presente' })
  @IsString()
  @MinLength(1)
  period: string;

  @ApiPropertyOptional({ nullable: true, example: 'Remoto' })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiProperty({ type: [BulletDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulletDto)
  bullets: BulletDto[];
}

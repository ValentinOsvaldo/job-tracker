import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TailoredBulletDto } from './tailored-bullet.dto';

export class TailoredExperienceEntryDto {
  @ApiProperty()
  @IsString()
  company: string;

  @ApiProperty()
  @IsString()
  role: string;

  @ApiProperty()
  @IsString()
  period: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  location: string | null;

  @ApiProperty({ type: [TailoredBulletDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TailoredBulletDto)
  bullets: TailoredBulletDto[];
}

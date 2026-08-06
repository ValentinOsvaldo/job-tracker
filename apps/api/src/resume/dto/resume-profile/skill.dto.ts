import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { SkillLevel } from '../../enums/skill-level.enum';

export class SkillDto {
  @ApiProperty({ example: 'TypeScript' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiProperty({ type: [String], example: ['frontend', 'language'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiProperty({ enum: SkillLevel, example: SkillLevel.ADVANCED })
  @IsEnum(SkillLevel)
  level: SkillLevel;
}

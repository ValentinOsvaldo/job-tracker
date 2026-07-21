import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ProfileRole } from '../enums/profile-role.enum';

export class CreateProfileDto {
  @ApiProperty({ example: 'Frontend Remote MX', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: ProfileRole, example: ProfileRole.FRONTEND })
  @IsEnum(ProfileRole)
  role: ProfileRole;

  @ApiProperty({ type: [String], example: ['react', 'typescript'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keywords: string[];

  @ApiProperty({ type: [String], example: ['Mexico', 'Remote'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  locations: string[];

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: 40000,
    description: 'Desired minimum salary in MXN',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_min_mxn?: number;

  @ApiPropertyOptional({
    example: 80000,
    description: 'Desired maximum salary in MXN',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_max_mxn?: number;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Desired minimum salary in USD',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_min_usd?: number;

  @ApiPropertyOptional({
    example: 4500,
    description: 'Desired maximum salary in USD',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  salary_max_usd?: number;
}

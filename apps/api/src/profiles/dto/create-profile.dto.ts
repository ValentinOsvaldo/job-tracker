import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
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
}

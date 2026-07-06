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
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(ProfileRole)
  role: ProfileRole;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  keywords: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  locations: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

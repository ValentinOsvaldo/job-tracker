import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSelfDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'ada@example.com', maxLength: 150 })
  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  email?: string;

  @ApiPropertyOptional({ nullable: true, example: 'Guadalajara', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  home_city?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Mexico', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  home_country?: string | null;
}

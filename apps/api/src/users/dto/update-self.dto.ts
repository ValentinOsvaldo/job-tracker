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
}

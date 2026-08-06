import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LinkDto } from './link.dto';

export class PersonalInfoDto {
  @ApiProperty({ example: 'Osvaldo Valentin' })
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  full_name: string;

  @ApiPropertyOptional({ nullable: true, example: 'Frontend Developer' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  headline?: string | null;

  @ApiProperty({ example: 'osvaldo@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ nullable: true, example: '+52 555 123 4567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Ciudad de México, MX' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  location?: string | null;

  @ApiProperty({ type: [LinkDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinkDto)
  links: LinkDto[];
}

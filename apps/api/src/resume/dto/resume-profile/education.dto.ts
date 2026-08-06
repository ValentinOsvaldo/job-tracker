import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class EducationDto {
  @ApiProperty({ example: 'Universidad Nacional Autónoma de México' })
  @IsString()
  @MinLength(1)
  institution: string;

  @ApiProperty({ example: 'Ingeniería en Computación' })
  @IsString()
  @MinLength(1)
  degree: string;

  @ApiPropertyOptional({ nullable: true, example: '2016 - 2020' })
  @IsOptional()
  @IsString()
  period?: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Ciudad de México' })
  @IsOptional()
  @IsString()
  location?: string | null;
}

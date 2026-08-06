import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ProjectDto {
  @ApiProperty({ example: 'proj-1' })
  @IsString()
  @MinLength(1)
  id: string;

  @ApiProperty({ example: 'Job Tracker' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'App para trackear postulaciones con scoring de fit por IA',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description: string;

  @ApiProperty({ type: [String], example: ['nestjs', 'nuxt'] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({
    nullable: true,
    example: 'https://github.com/me/job-tracker',
  })
  @IsOptional()
  @IsUrl()
  url?: string | null;
}

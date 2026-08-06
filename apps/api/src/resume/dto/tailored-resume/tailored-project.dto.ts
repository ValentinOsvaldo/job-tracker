import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class TailoredProjectDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  url: string | null;

  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(0)
  @Max(100)
  relevance_score: number;

  @ApiProperty()
  @IsString()
  source_project_id: string;
}

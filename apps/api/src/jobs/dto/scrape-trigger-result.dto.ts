import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IngestResultDto } from './jobs-response.dto';

export class ScrapeParamsDto {
  @ApiProperty({ type: [String], example: ['linkedin', 'indeed'] })
  sites: string[];

  @ApiProperty({ type: [String], example: ['vue', 'typescript'] })
  search_terms: string[];

  @ApiProperty({ type: [String], example: ['Mexico', 'Remote'] })
  locations: string[];

  @ApiProperty({ example: 30 })
  results_wanted: number;

  @ApiProperty({ example: 48 })
  hours_old: number;
}

export class ScrapeTriggerResultDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 12 })
  sent: number;

  @ApiPropertyOptional({ example: 5, description: 'Jobs dropped by relevance filter' })
  filtered_out?: number;

  @ApiProperty({ type: IngestResultDto })
  ingest: IngestResultDto;

  @ApiPropertyOptional({ type: ScrapeParamsDto })
  params?: ScrapeParamsDto;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketTrendsAiResult } from '../../ai/types/market-trends-result.type';
import { KeywordStat } from '../../ai/types/keyword-stat.type';

export class KeywordStatDto implements KeywordStat {
  @ApiProperty({ example: 'typescript' })
  term: string;

  @ApiProperty({ example: 34 })
  count: number;

  @ApiPropertyOptional({ example: 44.2 })
  percentage?: number;

  @ApiPropertyOptional({ enum: ['rising', 'stable', 'declining'] })
  trend?: 'rising' | 'stable' | 'declining';

  @ApiPropertyOptional({ enum: ['jobs', 'analyses'] })
  source?: 'jobs' | 'analyses';
}

export class MarketTrendsAiResultDto implements MarketTrendsAiResult {
  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  hot_technologies: string[];

  @ApiProperty({ type: [String] })
  emerging_roles: string[];

  @ApiPropertyOptional({ nullable: true })
  salary_signals: string | null;

  @ApiProperty({ type: [String] })
  recommendations: string[];
}

export class MarketTrendsResponseDto {
  @ApiProperty({ example: 30 })
  period_days: number;

  @ApiProperty({ example: 77 })
  total_jobs: number;

  @ApiProperty({ example: 12 })
  jobs_with_description: number;

  @ApiProperty({ type: [KeywordStatDto] })
  top_keywords: KeywordStatDto[];

  @ApiProperty({ type: [KeywordStatDto] })
  top_demanded_skills: KeywordStatDto[];

  @ApiProperty({ type: [KeywordStatDto] })
  top_missing_skills: KeywordStatDto[];

  @ApiPropertyOptional({ type: MarketTrendsAiResultDto, nullable: true })
  ai_insights: MarketTrendsAiResultDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  generated_at: string;

  @ApiProperty({ example: true })
  ai_cached: boolean;
}

export type MarketTrendsResponse = MarketTrendsResponseDto;

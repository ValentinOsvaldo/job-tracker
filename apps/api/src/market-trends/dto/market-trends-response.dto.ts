import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MarketTrendsAiResult } from '../../ai/types/market-trends-result.type';
import { KeywordStat } from '../../ai/types/keyword-stat.type';
import { JobRoleCategory } from '../../jobs/enums/job-role-category.enum';
import { WorkMode } from '../../jobs/enums/work-mode.enum';
import { DayCount, RoleCategoryCount, WorkModeCount } from '../utils/job-stats';
import { GeoCount, LocationInsights } from '../utils/location-aggregation';

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

export class GeoCountDto implements GeoCount {
  @ApiProperty({ example: 'Mexico' })
  label: string;

  @ApiProperty({ example: 42 })
  count: number;

  @ApiPropertyOptional({ nullable: true, example: 23.6345 })
  lat: number | null;

  @ApiPropertyOptional({ nullable: true, example: -102.5528 })
  lon: number | null;

  @ApiPropertyOptional({ nullable: true, example: 'MEX' })
  iso3?: string | null;
}

export class LocationInsightsDto implements LocationInsights {
  @ApiProperty({ type: [GeoCountDto] })
  by_country: GeoCountDto[];

  @ApiProperty({ type: [GeoCountDto] })
  mexico_by_region: GeoCountDto[];

  @ApiProperty({ type: [GeoCountDto] })
  mexico_by_city: GeoCountDto[];

  @ApiProperty({ example: 58 })
  total_with_location: number;

  @ApiProperty({ example: 41 })
  total_mexico: number;
}

export class WorkModeCountDto implements WorkModeCount {
  @ApiProperty({ enum: WorkMode, example: WorkMode.REMOTE })
  work_mode: WorkMode;

  @ApiProperty({ example: 12 })
  count: number;
}

export class RoleCategoryCountDto implements RoleCategoryCount {
  @ApiProperty({ enum: JobRoleCategory, example: JobRoleCategory.FULLSTACK })
  role_category: JobRoleCategory;

  @ApiProperty({ example: 12 })
  count: number;
}

export class DayCountDto implements DayCount {
  @ApiProperty({ example: '2026-08-01' })
  date: string;

  @ApiProperty({ example: 6 })
  count: number;
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

  @ApiProperty({ type: LocationInsightsDto })
  locations: LocationInsightsDto;

  @ApiProperty({ type: [WorkModeCountDto] })
  by_work_mode: WorkModeCountDto[];

  @ApiProperty({ type: [RoleCategoryCountDto] })
  by_role_category: RoleCategoryCountDto[];

  @ApiProperty({ type: [DayCountDto] })
  jobs_by_day: DayCountDto[];

  @ApiPropertyOptional({ type: MarketTrendsAiResultDto, nullable: true })
  ai_insights: MarketTrendsAiResultDto | null;

  @ApiProperty({ type: String, format: 'date-time' })
  generated_at: string;

  @ApiProperty({ example: true })
  ai_cached: boolean;
}

export type MarketTrendsResponse = MarketTrendsResponseDto;

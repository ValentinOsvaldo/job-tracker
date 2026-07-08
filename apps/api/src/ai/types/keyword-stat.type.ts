export type KeywordTrend = 'rising' | 'stable' | 'declining';

export interface KeywordStat {
  term: string;
  count: number;
  percentage?: number;
  trend?: KeywordTrend;
  source?: 'jobs' | 'analyses';
}

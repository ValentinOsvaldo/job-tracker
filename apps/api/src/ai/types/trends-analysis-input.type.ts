import { KeywordStat } from './keyword-stat.type';

export interface TrendsAnalysisInput {
  periodDays: number;
  totalJobs: number;
  topKeywords: KeywordStat[];
  risingKeywords: KeywordStat[];
  topSkillsFromAnalyses: KeywordStat[];
  sampleTitles: string[];
}

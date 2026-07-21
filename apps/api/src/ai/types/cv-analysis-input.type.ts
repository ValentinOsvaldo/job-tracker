import { KeywordStat } from './keyword-stat.type';

export interface CvAnalysisInput {
  cvText: string;
  profiles: { name: string; role: string; keywords: string[] }[];
  topStrengths: KeywordStat[];
  topGaps: KeywordStat[];
  avgFitScore: number | null;
  analyzedJobsCount: number;
}

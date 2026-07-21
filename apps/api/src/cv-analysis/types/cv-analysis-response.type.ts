import { CvAnalysisAiResult } from '../../ai/types/cv-analysis-result.type';

export interface CvAnalysisResponse extends CvAnalysisAiResult {
  analyzed_jobs_count: number;
  generated_at: string;
  ai_cached: boolean;
}

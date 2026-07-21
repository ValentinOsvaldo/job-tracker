import { CvAnalysisInput } from '../types/cv-analysis-input.type';
import { CvAnalysisAiResult } from '../types/cv-analysis-result.type';

export interface CvAnalyzer {
  analyzeCv(input: CvAnalysisInput): Promise<CvAnalysisAiResult>;
}

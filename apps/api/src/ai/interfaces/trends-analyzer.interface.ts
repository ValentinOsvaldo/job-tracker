import { MarketTrendsAiResult } from '../types/market-trends-result.type';
import { TrendsAnalysisInput } from '../types/trends-analysis-input.type';

export interface TrendsAnalyzer {
  summarizeTrends(input: TrendsAnalysisInput): Promise<MarketTrendsAiResult>;
}

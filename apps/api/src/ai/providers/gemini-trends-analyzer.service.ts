import { BadRequestException, Injectable } from '@nestjs/common';
import { TrendsAnalyzer } from '../interfaces/trends-analyzer.interface';
import { buildTrendsPrompt } from '../prompts/build-trends-prompt';
import {
  MarketTrendsAiResult,
  parseTrendsResult,
} from '../types/market-trends-result.type';
import { TrendsAnalysisInput } from '../types/trends-analysis-input.type';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiTrendsAnalyzerService implements TrendsAnalyzer {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async summarizeTrends(
    input: TrendsAnalysisInput,
  ): Promise<MarketTrendsAiResult> {
    const prompt = buildTrendsPrompt(input);
    const raw = await this.geminiClient.complete(prompt, 0.4);

    try {
      return parseTrendsResult(raw);
    } catch {
      throw new BadRequestException(
        'AI provider returned an invalid market trends response',
      );
    }
  }
}

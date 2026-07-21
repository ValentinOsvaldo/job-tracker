import { BadRequestException, Injectable } from '@nestjs/common';
import { CvAnalyzer } from '../interfaces/cv-analyzer.interface';
import { buildCvAnalysisPrompt } from '../prompts/build-cv-analysis-prompt';
import { CvAnalysisInput } from '../types/cv-analysis-input.type';
import {
  CvAnalysisAiResult,
  parseCvAnalysisResult,
} from '../types/cv-analysis-result.type';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiCvAnalyzerService implements CvAnalyzer {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async analyzeCv(input: CvAnalysisInput): Promise<CvAnalysisAiResult> {
    const prompt = buildCvAnalysisPrompt(input);
    const raw = await this.geminiClient.complete(prompt, 0.4);

    try {
      return parseCvAnalysisResult(raw);
    } catch {
      throw new BadRequestException(
        'AI provider returned an invalid CV analysis response',
      );
    }
  }
}

import { Module } from '@nestjs/common';
import { AI_JOB_ANALYZER, AI_TRENDS_ANALYZER } from './ai.constants';
import { GeminiClientService } from './providers/gemini-client.service';
import { GeminiJobAnalyzerService } from './providers/gemini-job-analyzer.service';
import { GeminiTrendsAnalyzerService } from './providers/gemini-trends-analyzer.service';

@Module({
  providers: [
    GeminiClientService,
    GeminiJobAnalyzerService,
    GeminiTrendsAnalyzerService,
    { provide: AI_JOB_ANALYZER, useExisting: GeminiJobAnalyzerService },
    { provide: AI_TRENDS_ANALYZER, useExisting: GeminiTrendsAnalyzerService },
  ],
  exports: [AI_JOB_ANALYZER, AI_TRENDS_ANALYZER],
})
export class AiModule {}

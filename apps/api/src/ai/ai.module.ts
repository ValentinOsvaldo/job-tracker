import { Module } from '@nestjs/common';
import {
  AI_CV_ANALYZER,
  AI_JOB_ANALYZER,
  AI_JOB_SUMMARIZER,
  AI_TRENDS_ANALYZER,
} from './ai.constants';
import { GeminiClientService } from './providers/gemini-client.service';
import { GeminiCvAnalyzerService } from './providers/gemini-cv-analyzer.service';
import { GeminiJobAnalyzerService } from './providers/gemini-job-analyzer.service';
import { GeminiJobSummarizerService } from './providers/gemini-job-summarizer.service';
import { GeminiTrendsAnalyzerService } from './providers/gemini-trends-analyzer.service';

@Module({
  providers: [
    GeminiClientService,
    GeminiJobAnalyzerService,
    GeminiTrendsAnalyzerService,
    GeminiJobSummarizerService,
    GeminiCvAnalyzerService,
    { provide: AI_JOB_ANALYZER, useExisting: GeminiJobAnalyzerService },
    { provide: AI_TRENDS_ANALYZER, useExisting: GeminiTrendsAnalyzerService },
    { provide: AI_JOB_SUMMARIZER, useExisting: GeminiJobSummarizerService },
    { provide: AI_CV_ANALYZER, useExisting: GeminiCvAnalyzerService },
  ],
  exports: [
    AI_JOB_ANALYZER,
    AI_TRENDS_ANALYZER,
    AI_JOB_SUMMARIZER,
    AI_CV_ANALYZER,
  ],
})
export class AiModule {}

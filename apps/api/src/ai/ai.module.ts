import { Module } from '@nestjs/common';
import {
  AI_CV_ANALYZER,
  AI_JOB_ANALYZER,
  AI_JOB_SUMMARIZER,
  AI_TRENDS_ANALYZER,
  AI_WORK_MODE_CLASSIFIER,
} from './ai.constants';
import { GeminiClientService } from './providers/gemini-client.service';
import { GeminiCvAnalyzerService } from './providers/gemini-cv-analyzer.service';
import { GeminiJobAnalyzerService } from './providers/gemini-job-analyzer.service';
import { GeminiJobSummarizerService } from './providers/gemini-job-summarizer.service';
import { GeminiTrendsAnalyzerService } from './providers/gemini-trends-analyzer.service';
import { GeminiWorkModeClassifierService } from './providers/gemini-work-mode-classifier.service';

@Module({
  providers: [
    GeminiClientService,
    GeminiJobAnalyzerService,
    GeminiTrendsAnalyzerService,
    GeminiJobSummarizerService,
    GeminiCvAnalyzerService,
    GeminiWorkModeClassifierService,
    { provide: AI_JOB_ANALYZER, useExisting: GeminiJobAnalyzerService },
    { provide: AI_TRENDS_ANALYZER, useExisting: GeminiTrendsAnalyzerService },
    { provide: AI_JOB_SUMMARIZER, useExisting: GeminiJobSummarizerService },
    { provide: AI_CV_ANALYZER, useExisting: GeminiCvAnalyzerService },
    {
      provide: AI_WORK_MODE_CLASSIFIER,
      useExisting: GeminiWorkModeClassifierService,
    },
  ],
  exports: [
    AI_JOB_ANALYZER,
    AI_TRENDS_ANALYZER,
    AI_JOB_SUMMARIZER,
    AI_CV_ANALYZER,
    AI_WORK_MODE_CLASSIFIER,
  ],
})
export class AiModule {}

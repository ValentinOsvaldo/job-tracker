import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AI_JOB_ANALYZER, AI_TRENDS_ANALYZER } from './ai.constants';
import { JobAnalyzer } from './interfaces/job-analyzer.interface';
import { TrendsAnalyzer } from './interfaces/trends-analyzer.interface';
import { GroqClientService } from './providers/groq-client.service';
import { GroqJobAnalyzerService } from './providers/groq-job-analyzer.service';
import { GroqTrendsAnalyzerService } from './providers/groq-trends-analyzer.service';

function resolveAiProvider(configService: ConfigService): string {
  return configService.get<string>('AI_PROVIDER', 'groq');
}

@Module({
  providers: [
    GroqClientService,
    GroqJobAnalyzerService,
    GroqTrendsAnalyzerService,
    {
      provide: AI_JOB_ANALYZER,
      useFactory: (
        configService: ConfigService,
        groqJobAnalyzer: GroqJobAnalyzerService,
      ): JobAnalyzer => {
        const provider = resolveAiProvider(configService);

        if (provider === 'groq') {
          return groqJobAnalyzer;
        }

        throw new Error(`Unknown AI_PROVIDER: ${provider}`);
      },
      inject: [ConfigService, GroqJobAnalyzerService],
    },
    {
      provide: AI_TRENDS_ANALYZER,
      useFactory: (
        configService: ConfigService,
        groqTrendsAnalyzer: GroqTrendsAnalyzerService,
      ): TrendsAnalyzer => {
        const provider = resolveAiProvider(configService);

        if (provider === 'groq') {
          return groqTrendsAnalyzer;
        }

        throw new Error(`Unknown AI_PROVIDER: ${provider}`);
      },
      inject: [ConfigService, GroqTrendsAnalyzerService],
    },
  ],
  exports: [AI_JOB_ANALYZER, AI_TRENDS_ANALYZER],
})
export class AiModule {}

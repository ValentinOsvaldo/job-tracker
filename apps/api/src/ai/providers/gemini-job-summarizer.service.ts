import { Injectable } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { JobSummarizer } from '../interfaces/job-summarizer.interface';
import { buildSummaryPrompt } from '../prompts/build-summary-prompt';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiJobSummarizerService implements JobSummarizer {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async summarize(job: Job): Promise<string> {
    const prompt = buildSummaryPrompt(job);
    const raw = await this.geminiClient.complete(prompt, 0.3);
    return raw.trim();
  }
}

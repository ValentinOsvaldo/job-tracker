import { Injectable } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { WorkModeClassifier } from '../interfaces/work-mode-classifier.interface';
import { buildWorkModePrompt } from '../prompts/build-work-mode-prompt';
import {
  WorkModeClassificationResult,
  parseWorkModeClassificationResult,
} from '../types/work-mode-classification-result.type';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiWorkModeClassifierService implements WorkModeClassifier {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async classify(job: Job): Promise<WorkModeClassificationResult> {
    const prompt = buildWorkModePrompt(job);
    const raw = await this.geminiClient.complete(prompt, 0.1);
    return parseWorkModeClassificationResult(raw);
  }
}

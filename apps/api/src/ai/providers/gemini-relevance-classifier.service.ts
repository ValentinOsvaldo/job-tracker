import { Injectable } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { RelevanceClassifier } from '../interfaces/relevance-classifier.interface';
import { buildRelevancePrompt } from '../prompts/build-relevance-prompt';
import {
  RelevanceClassificationResult,
  parseRelevanceClassificationResult,
} from '../types/relevance-classification-result.type';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiRelevanceClassifierService implements RelevanceClassifier {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async classify(
    job: Job,
    targetRoles: string,
  ): Promise<RelevanceClassificationResult> {
    const prompt = buildRelevancePrompt(job, targetRoles);
    const raw = await this.geminiClient.complete(prompt, 0.1);
    return parseRelevanceClassificationResult(raw);
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { SearchProfile } from '../../profiles/entities/search-profile.entity';
import { User } from '../../users/entities/user.entity';
import { JobAnalyzer } from '../interfaces/job-analyzer.interface';
import { buildAnalysisPrompt } from '../prompts/build-analysis-prompt';
import {
  JobAnalysisResult,
  parseAnalysisResult,
} from '../types/job-analysis-result.type';
import { GroqClientService } from './groq-client.service';

@Injectable()
export class GroqJobAnalyzerService implements JobAnalyzer {
  constructor(private readonly groqClient: GroqClientService) {}

  async analyzeJob(
    job: Job,
    profile: SearchProfile,
    user: User,
  ): Promise<JobAnalysisResult> {
    if (!user.cv_text) {
      throw new BadRequestException(
        `User ${user.id} does not have CV text for analysis`,
      );
    }

    const prompt = buildAnalysisPrompt(job, profile, user);
    const raw = await this.groqClient.complete(prompt, 0.3);

    try {
      return parseAnalysisResult(raw);
    } catch {
      throw new BadRequestException(
        'AI provider returned an invalid job analysis response',
      );
    }
  }
}

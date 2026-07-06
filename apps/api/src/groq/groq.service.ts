import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Job } from '../jobs/entities/job.entity';
import { SearchProfile } from '../profiles/entities/search-profile.entity';
import { User } from '../users/entities/user.entity';
import {
  GroqAnalysisResult,
  parseGroqAnalysisResult,
} from './types/groq-analysis-result.type';
import { buildAnalysisPrompt } from './utils/build-analysis-prompt';

@Injectable()
export class GroqService {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async analyzeJob(
    job: Job,
    profile: SearchProfile,
    user: User,
  ): Promise<GroqAnalysisResult> {
    if (!user.cv_text) {
      throw new BadRequestException(
        `User ${user.id} does not have CV text for analysis`,
      );
    }

    const prompt = buildAnalysisPrompt(job, profile, user);
    const model =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const raw = response.choices[0]?.message?.content ?? '{}';

    try {
      return parseGroqAnalysisResult(raw);
    } catch {
      throw new BadRequestException(
        'Groq returned an invalid analysis response',
      );
    }
  }
}

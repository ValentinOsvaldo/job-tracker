import { BadRequestException, Injectable } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { ResumeProfile } from '../../resume/entities/resume-profile.entity';
import { ResumeTailor } from '../interfaces/resume-tailor.interface';
import { buildTailorResumePrompt } from '../prompts/build-tailor-resume-prompt';
import {
  TailorResumeAiResultDto,
  parseTailorResumeResult,
} from '../types/tailor-resume-result.dto';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiResumeTailorService implements ResumeTailor {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async tailorResume(
    job: Job,
    profile: ResumeProfile,
  ): Promise<TailorResumeAiResultDto> {
    const prompt = buildTailorResumePrompt(job, profile);
    const raw = await this.geminiClient.complete(prompt, 0.2);

    try {
      return parseTailorResumeResult(raw);
    } catch {
      throw new BadRequestException(
        'AI provider returned an invalid tailor-resume response',
      );
    }
  }
}

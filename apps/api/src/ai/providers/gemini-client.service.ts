import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiError, GoogleGenAI } from '@google/genai';

const QUOTA_ERROR_PATTERN = /quota|resource_exhausted|rate limit/i;

@Injectable()
export class GeminiClientService {
  private readonly logger = new Logger(GeminiClientService.name);
  private readonly client: GoogleGenAI;
  private quotaExceededUntil: number | null = null;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async complete(prompt: string, temperature = 0.3): Promise<string> {
    if (this.quotaExceededUntil && Date.now() < this.quotaExceededUntil) {
      throw new ServiceUnavailableException(
        `Gemini quota exhausted, cooling down until ${new Date(this.quotaExceededUntil).toISOString()}`,
      );
    }

    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-3.8-flash';

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        config: { temperature },
      });

      return response.text ?? '{}';
    } catch (error: unknown) {
      if (this.isQuotaError(error)) {
        const cooldownMs = this.getCooldownMs();
        this.quotaExceededUntil = Date.now() + cooldownMs;
        this.logger.warn(
          `Gemini quota exhausted. Pausing AI calls until ${new Date(this.quotaExceededUntil).toISOString()}`,
        );
      }

      throw error;
    }
  }

  private isQuotaError(error: unknown): boolean {
    if (error instanceof ApiError && error.status === 429) {
      return true;
    }

    return error instanceof Error && QUOTA_ERROR_PATTERN.test(error.message);
  }

  private getCooldownMs(): number {
    const minutes = Number(
      this.configService.get('GEMINI_QUOTA_COOLDOWN_MINUTES') ?? 60,
    );

    return minutes * 60 * 1000;
  }
}

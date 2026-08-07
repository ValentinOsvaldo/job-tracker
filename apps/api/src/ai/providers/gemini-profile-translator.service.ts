import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ProfileTranslator,
  TranslationItem,
} from '../interfaces/profile-translator.interface';
import { buildTranslateProfilePrompt } from '../prompts/build-translate-profile-prompt';
import { parseTranslateProfileResult } from '../types/translate-profile-result.dto';
import { GeminiClientService } from './gemini-client.service';

@Injectable()
export class GeminiProfileTranslatorService implements ProfileTranslator {
  constructor(private readonly geminiClient: GeminiClientService) {}

  async translateToEnglish(
    items: TranslationItem[],
  ): Promise<TranslationItem[]> {
    if (items.length === 0) {
      return [];
    }

    const prompt = buildTranslateProfilePrompt(items);
    const raw = await this.geminiClient.complete(prompt, 0.1);

    try {
      return parseTranslateProfileResult(raw).translations;
    } catch {
      throw new BadRequestException(
        'AI provider returned an invalid translate-profile response',
      );
    }
  }
}

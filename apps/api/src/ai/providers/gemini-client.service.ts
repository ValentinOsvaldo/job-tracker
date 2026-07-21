import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiClientService {
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new GoogleGenAI({
      apiKey: this.configService.getOrThrow<string>('GEMINI_API_KEY'),
    });
  }

  async complete(prompt: string, temperature = 0.3): Promise<string> {
    const model =
      this.configService.get<string>('GEMINI_MODEL') ?? 'gemini-2.5-flash';

    const response = await this.client.models.generateContent({
      model,
      contents: prompt,
      config: { temperature },
    });

    return response.text ?? '{}';
  }
}

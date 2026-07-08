import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GroqClientService {
  private readonly client: OpenAI;

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('GROQ_API_KEY'),
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async complete(prompt: string, temperature = 0.3): Promise<string> {
    const model =
      this.configService.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
    });

    return response.choices[0]?.message?.content ?? '{}';
  }
}

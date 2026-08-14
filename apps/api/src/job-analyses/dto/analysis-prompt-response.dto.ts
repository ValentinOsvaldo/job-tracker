import { ApiProperty } from '@nestjs/swagger';

export class AnalysisPromptResponseDto {
  @ApiProperty({
    description:
      'Fully-built analysis prompt, ready to paste into an external AI chat tool',
  })
  prompt: string;
}

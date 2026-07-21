import { ApiProperty } from '@nestjs/swagger';
import { CvAnalysisResponse } from '../types/cv-analysis-response.type';

export class CvAnalysisResponseDto implements CvAnalysisResponse {
  @ApiProperty({ example: 72, description: 'CV competitiveness score, 0-100' })
  score: number;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  strengths: string[];

  @ApiProperty({ type: [String] })
  gaps: string[];

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty({ example: 34 })
  analyzed_jobs_count: number;

  @ApiProperty({ type: String, format: 'date-time' })
  generated_at: string;

  @ApiProperty({ example: true })
  ai_cached: boolean;
}

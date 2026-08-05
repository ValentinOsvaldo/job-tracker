import { ApiProperty } from '@nestjs/swagger';
import {
  AtsCheckItem,
  AtsCheckResponse,
  AtsCheckStatus,
} from '../types/ats-check-response.type';

export class AtsCheckItemDto implements AtsCheckItem {
  @ApiProperty({ example: 'contact_info' })
  key: string;

  @ApiProperty({ example: 'Información de contacto' })
  label: string;

  @ApiProperty({ enum: ['ok', 'warning', 'error', 'neutral'] })
  status: AtsCheckStatus;

  @ApiProperty({ example: 'Se detectó un correo y un teléfono' })
  detail: string;
}

export class AtsCheckResponseDto implements AtsCheckResponse {
  @ApiProperty({ example: 72, description: 'ATS compatibility score, 0-100' })
  score: number;

  @ApiProperty({ type: [AtsCheckItemDto] })
  checks: AtsCheckItemDto[];

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty({ example: 34 })
  analyzed_jobs_count: number;

  @ApiProperty({ type: String, format: 'date-time' })
  generated_at: string;
}

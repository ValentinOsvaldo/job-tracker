export type AtsCheckStatus = 'ok' | 'warning' | 'error' | 'neutral';

export interface AtsCheckItem {
  key: string;
  label: string;
  status: AtsCheckStatus;
  detail: string;
}

export interface AtsCheckResponse {
  score: number;
  checks: AtsCheckItem[];
  recommendations: string[];
  analyzed_jobs_count: number;
  generated_at: string;
}

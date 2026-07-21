export interface CvAnalysisAiResult {
  score: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export function parseCvAnalysisResult(raw: string): CvAnalysisAiResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed: unknown = JSON.parse(cleaned);

  if (!isCvAnalysisAiResult(parsed)) {
    throw new Error('Invalid CV analysis response shape');
  }

  return parsed;
}

function isCvAnalysisAiResult(value: unknown): value is CvAnalysisAiResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.score === 'number' &&
    typeof result.summary === 'string' &&
    Array.isArray(result.strengths) &&
    result.strengths.every((item) => typeof item === 'string') &&
    Array.isArray(result.gaps) &&
    result.gaps.every((item) => typeof item === 'string') &&
    Array.isArray(result.recommendations) &&
    result.recommendations.every((item) => typeof item === 'string')
  );
}

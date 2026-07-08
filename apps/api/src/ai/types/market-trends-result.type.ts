export interface MarketTrendsAiResult {
  summary: string;
  hot_technologies: string[];
  emerging_roles: string[];
  salary_signals: string | null;
  recommendations: string[];
}

export function parseTrendsResult(raw: string): MarketTrendsAiResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed: unknown = JSON.parse(cleaned);

  if (!isMarketTrendsAiResult(parsed)) {
    throw new Error('Invalid market trends response shape');
  }

  return parsed;
}

function isMarketTrendsAiResult(value: unknown): value is MarketTrendsAiResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.summary === 'string' &&
    Array.isArray(result.hot_technologies) &&
    result.hot_technologies.every((item) => typeof item === 'string') &&
    Array.isArray(result.emerging_roles) &&
    result.emerging_roles.every((item) => typeof item === 'string') &&
    (result.salary_signals === null ||
      typeof result.salary_signals === 'string') &&
    Array.isArray(result.recommendations) &&
    result.recommendations.every((item) => typeof item === 'string')
  );
}

export interface GroqAnalysisResult {
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  summary: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_is_inferred: boolean;
  benefits: string[];
  benefits_is_inferred: boolean;
}

export function parseGroqAnalysisResult(raw: string): GroqAnalysisResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed: unknown = JSON.parse(cleaned);

  if (!isGroqAnalysisResult(parsed)) {
    throw new Error('Invalid Groq analysis response shape');
  }

  return parsed;
}

function isGroqAnalysisResult(value: unknown): value is GroqAnalysisResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.fit_score === 'number' &&
    result.fit_score >= 1 &&
    result.fit_score <= 10 &&
    Array.isArray(result.matched_skills) &&
    result.matched_skills.every((item) => typeof item === 'string') &&
    Array.isArray(result.missing_skills) &&
    result.missing_skills.every((item) => typeof item === 'string') &&
    typeof result.summary === 'string' &&
    (result.salary_min === null || typeof result.salary_min === 'number') &&
    (result.salary_max === null || typeof result.salary_max === 'number') &&
    typeof result.salary_is_inferred === 'boolean' &&
    Array.isArray(result.benefits) &&
    result.benefits.every((item) => typeof item === 'string') &&
    typeof result.benefits_is_inferred === 'boolean'
  );
}

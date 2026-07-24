export interface RelevanceClassificationResult {
  relevant: boolean;
  reason: string;
}

export function parseRelevanceClassificationResult(
  raw: string,
): RelevanceClassificationResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed: unknown = JSON.parse(cleaned);

  if (!isRelevanceClassificationResult(parsed)) {
    throw new Error('Invalid relevance classification response shape');
  }

  return parsed;
}

function isRelevanceClassificationResult(
  value: unknown,
): value is RelevanceClassificationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.relevant === 'boolean' && typeof result.reason === 'string'
  );
}

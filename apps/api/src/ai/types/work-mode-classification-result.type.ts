import { WorkMode } from '../../jobs/enums/work-mode.enum';

export interface WorkModeClassificationResult {
  work_mode: WorkMode;
  location_city: string | null;
  location_region: string | null;
  location_country: string | null;
}

const VALID_WORK_MODES = new Set<string>(Object.values(WorkMode));

export function parseWorkModeClassificationResult(
  raw: string,
): WorkModeClassificationResult {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '');

  const parsed: unknown = JSON.parse(cleaned);

  if (!isWorkModeClassificationResult(parsed)) {
    throw new Error('Invalid work mode classification response shape');
  }

  return parsed;
}

function isWorkModeClassificationResult(
  value: unknown,
): value is WorkModeClassificationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    typeof result.work_mode === 'string' &&
    VALID_WORK_MODES.has(result.work_mode) &&
    (result.location_city === null || typeof result.location_city === 'string') &&
    (result.location_region === null ||
      typeof result.location_region === 'string') &&
    (result.location_country === null ||
      typeof result.location_country === 'string')
  );
}

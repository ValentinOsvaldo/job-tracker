import { WorkMode } from '../enums/work-mode.enum';

/** Mirrors apps/scrapper/work_mode.py — kept as a safety net for records
 * that arrive without a work_mode (e.g. an older scraper build, or a
 * manual/seeded ingest). */

const HYBRID_KEYWORDS = [
  'hibrido',
  'híbrido',
  'hibrida',
  'híbrida',
  'hybrid',
  'modalidad mixta',
  'trabajo mixto',
  'esquema mixto',
  'parcialmente remoto',
  'parcialmente remota',
  'parcialmente presencial',
  'remote onsite',
  'onsite remote',
  'office remote',
  'remote hybrid',
  'hybrid remote',
  'dias en oficina',
  'días en oficina',
  'days in office',
  'days per week in office',
  'days a week in office',
  'some days in office',
  'algunos dias en oficina',
  'algunos días en oficina',
];

const REMOTE_KEYWORDS = [
  'remoto',
  'remota',
  '100 remoto',
  '100 remota',
  'full remote',
  'fully remote',
  'totalmente remoto',
  'totalmente remota',
  'trabajo remoto',
  'trabajo desde casa',
  'home office',
  'teletrabajo',
  'work from home',
  'wfh',
  'remote work',
  'remote first',
  'remote friendly',
  'remote',
];

const ONSITE_KEYWORDS = [
  'presencial',
  '100 presencial',
  'totalmente presencial',
  'en oficina',
  'en sitio',
  'on site',
  'onsite',
  'in office',
  'en las instalaciones',
  'asistencia obligatoria a oficina',
];

/** Punctuation becomes whitespace and every token is single-space padded,
 * so keyword lists stay free of hyphens/slashes ("on-site" -> "on site")
 * and single ambiguous words like "remote" only match as a whole word
 * instead of matching inside "remotely". */
function normalize(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return ` ${cleaned.split(/\s+/).filter(Boolean).join(' ')} `;
}

function normalizeKeywords(keywords: string[]): string[] {
  return keywords.map((keyword) => normalize(keyword));
}

const HYBRID_PATTERNS = normalizeKeywords(HYBRID_KEYWORDS);
const REMOTE_PATTERNS = normalizeKeywords(REMOTE_KEYWORDS);
const ONSITE_PATTERNS = normalizeKeywords(ONSITE_KEYWORDS);

export function classifyWorkMode(
  title: string | null | undefined,
  location: string | null | undefined,
  description: string | null | undefined,
): WorkMode {
  const haystack = [title, location, description]
    .map((part) => normalize(part))
    .join('');

  const hasHybrid = HYBRID_PATTERNS.some((pattern) =>
    haystack.includes(pattern),
  );
  const hasRemote = REMOTE_PATTERNS.some((pattern) =>
    haystack.includes(pattern),
  );
  const hasOnsite = ONSITE_PATTERNS.some((pattern) =>
    haystack.includes(pattern),
  );

  if (hasHybrid) return WorkMode.HYBRID;
  if (hasRemote && hasOnsite) return WorkMode.HYBRID;
  if (hasRemote) return WorkMode.REMOTE;
  if (hasOnsite) return WorkMode.ONSITE;
  return WorkMode.UNKNOWN;
}

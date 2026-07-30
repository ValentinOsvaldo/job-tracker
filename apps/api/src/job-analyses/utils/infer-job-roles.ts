import { ProfileRole } from '../../profiles/enums/profile-role.enum';

/** Title-based role signal used to scope automatic analysis at ingest time:
 * a job clearly titled "Fullstack Developer" should only be auto-analyzed
 * against the fullstack profile, not separately against frontend/backend
 * ones (which produced incongruent scores for the same posting). Checked
 * before frontend/backend so "Fullstack (React/Node)" doesn't also match
 * those individually. */
const FULLSTACK_KEYWORDS = [
  'fullstack',
  'full stack',
  'full-stack',
  'desarrollador full stack',
  'desarrolladora full stack',
];

const MOBILE_KEYWORDS = [
  'mobile',
  'ios',
  'android',
  'react native',
  'flutter',
  'swift developer',
  'kotlin developer',
  'desarrollador movil',
  'desarrollador móvil',
  'desarrolladora movil',
  'desarrolladora móvil',
];

const FRONTEND_KEYWORDS = [
  'frontend',
  'front end',
  'front-end',
  'ui developer',
  'ui engineer',
  'desarrollador frontend',
  'desarrolladora frontend',
  'desarrollador front end',
  'desarrolladora front end',
];

const BACKEND_KEYWORDS = [
  'backend',
  'back end',
  'back-end',
  'api developer',
  'server side developer',
  'desarrollador backend',
  'desarrolladora backend',
  'desarrollador back end',
  'desarrolladora back end',
];

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

const FULLSTACK_PATTERNS = normalizeKeywords(FULLSTACK_KEYWORDS);
const MOBILE_PATTERNS = normalizeKeywords(MOBILE_KEYWORDS);
const FRONTEND_PATTERNS = normalizeKeywords(FRONTEND_KEYWORDS);
const BACKEND_PATTERNS = normalizeKeywords(BACKEND_KEYWORDS);

function matchesAny(haystack: string, patterns: string[]): boolean {
  return patterns.some((pattern) => haystack.includes(pattern));
}

/** Returns the profile role(s) a job's title clearly targets, or an empty
 * array when the title is ambiguous ("Software Engineer") — callers should
 * fall back to running analysis against every active profile in that case. */
export function inferJobRoles(title: string | null | undefined): ProfileRole[] {
  const haystack = normalize(title);

  if (matchesAny(haystack, FULLSTACK_PATTERNS)) {
    return [ProfileRole.FULLSTACK];
  }

  if (matchesAny(haystack, MOBILE_PATTERNS)) {
    return [ProfileRole.MOBILE];
  }

  const roles: ProfileRole[] = [];
  if (matchesAny(haystack, FRONTEND_PATTERNS)) {
    roles.push(ProfileRole.FRONTEND);
  }
  if (matchesAny(haystack, BACKEND_PATTERNS)) {
    roles.push(ProfileRole.BACKEND);
  }

  return roles;
}

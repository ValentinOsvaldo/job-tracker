/** Shared title/description keyword taxonomy for classifying a job posting
 * into a dev role (frontend/backend/fullstack/mobile). Single source of
 * truth consumed by both job-analyses' inferJobRoles (scopes which search
 * profiles a job is auto-analyzed against) and jobs' categorizeJobRole
 * (persists a single role_category on the job for filtering/stats), so the
 * two never drift apart on what counts as a "frontend" title. */

/** Checked before frontend/backend so "Fullstack (React/Node)" doesn't also
 * match those individually. */
export const FULLSTACK_KEYWORDS = [
  'fullstack',
  'full stack',
  'full-stack',
  'mern',
  'mean stack',
  'desarrollador full stack',
  'desarrolladora full stack',
];

export const MOBILE_KEYWORDS = [
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

export const FRONTEND_KEYWORDS = [
  'frontend',
  'front end',
  'front-end',
  'ui developer',
  'ui engineer',
  'react developer',
  'reactjs developer',
  'react.js developer',
  'angular developer',
  'angularjs developer',
  'vue developer',
  'vue.js developer',
  'vuejs developer',
  'next.js developer',
  'nextjs developer',
  'desarrollador frontend',
  'desarrolladora frontend',
  'desarrollador front end',
  'desarrolladora front end',
];

export const BACKEND_KEYWORDS = [
  'backend',
  'back end',
  'back-end',
  'api developer',
  'server side developer',
  'node developer',
  'node.js developer',
  'nodejs developer',
  'python developer',
  'django developer',
  'java developer',
  'spring developer',
  'php developer',
  'laravel developer',
  '.net developer',
  'dotnet developer',
  'golang developer',
  'go developer',
  'ruby developer',
  'rails developer',
  'desarrollador backend',
  'desarrolladora backend',
  'desarrollador back end',
  'desarrolladora back end',
];

export function normalizeRoleText(text: string | null | undefined): string {
  if (!text) {
    return '';
  }
  const cleaned = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ');
  return ` ${cleaned.split(/\s+/).filter(Boolean).join(' ')} `;
}

function normalizeKeywords(keywords: string[]): string[] {
  return keywords.map((keyword) => normalizeRoleText(keyword));
}

export const FULLSTACK_PATTERNS = normalizeKeywords(FULLSTACK_KEYWORDS);
export const MOBILE_PATTERNS = normalizeKeywords(MOBILE_KEYWORDS);
export const FRONTEND_PATTERNS = normalizeKeywords(FRONTEND_KEYWORDS);
export const BACKEND_PATTERNS = normalizeKeywords(BACKEND_KEYWORDS);

export function matchesAnyRolePattern(
  haystack: string,
  patterns: string[],
): boolean {
  return patterns.some((pattern) => haystack.includes(pattern));
}

import {
  BACKEND_PATTERNS,
  FRONTEND_PATTERNS,
  FULLSTACK_PATTERNS,
  MOBILE_PATTERNS,
  matchesAnyRolePattern,
  normalizeRoleText,
} from '../../common/utils/role-keywords';
import { JobRoleCategory } from '../enums/job-role-category.enum';

/** Single-category classification (unlike inferJobRoles, which can return
 * several roles or none — this always resolves to exactly one bucket,
 * including OTHER, since it's persisted for filtering/stats rather than
 * used to decide which profiles to auto-analyze against). */
function classify(text: string | null | undefined): JobRoleCategory | null {
  const haystack = normalizeRoleText(text);

  if (!haystack.trim()) {
    return null;
  }

  if (matchesAnyRolePattern(haystack, FULLSTACK_PATTERNS)) {
    return JobRoleCategory.FULLSTACK;
  }

  if (matchesAnyRolePattern(haystack, MOBILE_PATTERNS)) {
    return JobRoleCategory.MOBILE;
  }

  const isFrontend = matchesAnyRolePattern(haystack, FRONTEND_PATTERNS);
  const isBackend = matchesAnyRolePattern(haystack, BACKEND_PATTERNS);

  if (isFrontend && isBackend) {
    return JobRoleCategory.FULLSTACK;
  }
  if (isFrontend) {
    return JobRoleCategory.FRONTEND;
  }
  if (isBackend) {
    return JobRoleCategory.BACKEND;
  }

  return null;
}

/** Title first (most reliable signal), falling back to the description for
 * postings with a generic title like "Software Engineer". Defaults to
 * OTHER when neither gives a clear signal. */
export function categorizeJobRole(
  title: string | null | undefined,
  description: string | null | undefined,
): JobRoleCategory {
  return classify(title) ?? classify(description) ?? JobRoleCategory.OTHER;
}

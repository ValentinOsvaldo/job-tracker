import {
  BACKEND_PATTERNS,
  FRONTEND_PATTERNS,
  FULLSTACK_PATTERNS,
  MOBILE_PATTERNS,
  matchesAnyRolePattern,
  normalizeRoleText,
} from '../../common/utils/role-keywords';
import { ProfileRole } from '../../profiles/enums/profile-role.enum';

/** Title-based role signal used to scope automatic analysis at ingest time:
 * a job clearly titled "Fullstack Developer" should only be auto-analyzed
 * against the fullstack profile, not separately against frontend/backend
 * ones (which produced incongruent scores for the same posting). Checked
 * before frontend/backend so "Fullstack (React/Node)" doesn't also match
 * those individually. */

/** Returns the profile role(s) a job's title clearly targets, or an empty
 * array when the title is ambiguous ("Software Engineer") — callers should
 * fall back to running analysis against every active profile in that case. */
export function inferJobRoles(title: string | null | undefined): ProfileRole[] {
  const haystack = normalizeRoleText(title);

  if (matchesAnyRolePattern(haystack, FULLSTACK_PATTERNS)) {
    return [ProfileRole.FULLSTACK];
  }

  if (matchesAnyRolePattern(haystack, MOBILE_PATTERNS)) {
    return [ProfileRole.MOBILE];
  }

  const roles: ProfileRole[] = [];
  if (matchesAnyRolePattern(haystack, FRONTEND_PATTERNS)) {
    roles.push(ProfileRole.FRONTEND);
  }
  if (matchesAnyRolePattern(haystack, BACKEND_PATTERNS)) {
    roles.push(ProfileRole.BACKEND);
  }

  return roles;
}

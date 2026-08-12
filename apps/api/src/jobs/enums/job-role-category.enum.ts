/** Persisted, single-value classification of what kind of dev role a job
 * posting is — distinct from ProfileRole (which is what the *user* is
 * targeting): a job can be OTHER (e.g. QA, DevOps, PM) even though no
 * search profile targets that role. */
export enum JobRoleCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  FULLSTACK = 'fullstack',
  MOBILE = 'mobile',
  OTHER = 'other',
}

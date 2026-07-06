export interface CreateJobAnalysisInput {
  job_id: string;
  profile_id: string;
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

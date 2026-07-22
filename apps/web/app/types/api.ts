export type ProfileRole = 'frontend' | 'backend' | 'fullstack' | 'mobile'
export type JobSource = 'linkedin' | 'indeed'
export type InterestStatus = 'liked' | 'disliked'
export type JobSortBy = 'salary' | 'score' | 'location'
export type SortDirection = 'asc' | 'desc'
export type UserRole = 'admin' | 'user'

export interface PublicUser {
  id: string
  name: string
  email: string
  role: UserRole
  cv_text: string | null
  cv_filename: string | null
  cv_uploaded_at: string | null
  created_at: string
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role?: UserRole
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  role?: UserRole
}

export interface UpdateSelfInput {
  name?: string
  email?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface SearchProfile {
  id: string
  user_id: string
  name: string
  role: ProfileRole
  keywords: string[]
  locations: string[]
  is_active: boolean
  salary_min_mxn: number | null
  salary_max_mxn: number | null
  salary_min_usd: number | null
  salary_max_usd: number | null
  created_at: string
}

export interface CreateProfileInput {
  name: string
  role: ProfileRole
  keywords: string[]
  locations: string[]
  is_active?: boolean
  salary_min_mxn?: number
  salary_max_mxn?: number
  salary_min_usd?: number
  salary_max_usd?: number
}

export type UpdateProfileInput = Partial<CreateProfileInput>

export interface JobAnalysis {
  id: string
  job_id: string
  profile_id: string
  profile?: SearchProfile
  fit_score: number
  matched_skills: string[]
  missing_skills: string[]
  summary: string
  salary_min: number | null
  salary_max: number | null
  salary_is_inferred: boolean
  benefits: string[]
  benefits_is_inferred: boolean
  analyzed_at: string
}

export interface Job {
  id: string
  title: string
  company: string | null
  location: string | null
  description: string | null
  description_summary: string | null
  url: string
  source: JobSource
  date_posted: string | null
  job_type: string | null
  salary_min: number | null
  salary_max: number | null
  salary_interval: string | null
  scraped_at: string
  analyses: JobAnalysis[]
  user_interest?: InterestStatus | null
  user_applied?: boolean
  user_rejected?: boolean
}

export interface JobsListResponse {
  data: Job[]
  total: number
  page: number
  limit: number
}

export interface ListJobsQuery {
  source?: JobSource
  profile_id?: string
  min_score?: number
  interest?: InterestStatus
  applied?: boolean
  rejected?: boolean
  sort_by?: JobSortBy
  sort_dir?: SortDirection
  page?: number
  limit?: number
}

export interface UpdateJobStatusInput {
  interest?: InterestStatus | null
  applied?: boolean
  rejected?: boolean
}

export interface JobStatusResponse {
  job_id: string
  interest: InterestStatus | null
  applied: boolean
  rejected: boolean
}

export interface SeedResult {
  created: string[]
  skipped: string[]
}

export interface CvUploadResult {
  filename: string
  characters_extracted: number
  uploaded_at: string
}

export interface ScrapeTriggerResult {
  ok: boolean
  sent: number
  filtered_out?: number
  ingest: {
    received: number
    inserted: number
    skipped: number
    rejected: number
  }
  params?: {
    sites: string[]
    search_terms: string[]
    locations: string[]
    results_wanted: number
    hours_old: number
  }
}

export interface KeywordStat {
  term: string
  count: number
  percentage?: number
  trend?: 'rising' | 'stable' | 'declining'
  source?: 'jobs' | 'analyses'
}

export interface MarketTrendsResponse {
  period_days: number
  total_jobs: number
  jobs_with_description: number
  top_keywords: KeywordStat[]
  top_demanded_skills: KeywordStat[]
  top_missing_skills: KeywordStat[]
  ai_insights: {
    summary: string
    hot_technologies: string[]
    emerging_roles: string[]
    salary_signals: string | null
    recommendations: string[]
  } | null
  generated_at: string
  ai_cached: boolean
}

export interface CvAnalysisResponse {
  score: number
  summary: string
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  analyzed_jobs_count: number
  generated_at: string
  ai_cached: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: PublicUser
}

export interface AuthTokensResponse {
  accessToken: string
  refreshToken: string
}

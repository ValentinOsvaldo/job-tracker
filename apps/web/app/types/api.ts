export type ProfileRole = 'frontend' | 'backend' | 'fullstack' | 'mobile'
export type JobSource = 'linkedin' | 'indeed'

export interface PublicUser {
  id: string
  name: string
  email: string
  cv_text: string | null
  cv_filename: string | null
  cv_uploaded_at: string | null
  created_at: string
}

export interface SearchProfile {
  id: string
  user_id: string
  name: string
  role: ProfileRole
  keywords: string[]
  locations: string[]
  is_active: boolean
  created_at: string
}

export interface CreateProfileInput {
  name: string
  role: ProfileRole
  keywords: string[]
  locations: string[]
  is_active?: boolean
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
  url: string
  source: JobSource
  date_posted: string | null
  job_type: string | null
  salary_min: number | null
  salary_max: number | null
  salary_interval: string | null
  scraped_at: string
  analyses: JobAnalysis[]
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
  page?: number
  limit?: number
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
  keyword: string
  count: number
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

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: PublicUser
}

export interface AuthTokensResponse {
  accessToken: string
  refreshToken: string
}

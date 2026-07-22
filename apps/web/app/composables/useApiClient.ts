import type {
  ChangePasswordInput,
  CreateProfileInput,
  CreateUserInput,
  CvAnalysisResponse,
  CvUploadResult,
  Job,
  JobStatusResponse,
  JobsListResponse,
  ListJobsQuery,
  MarketTrendsResponse,
  PublicUser,
  ScrapeTriggerResult,
  SearchProfile,
  SeedResult,
  UpdateJobStatusInput,
  UpdateProfileInput,
  UpdateSelfInput,
  UpdateUserInput
} from '~/types/api'

function cleanQuery(query: Record<string, string | number | boolean | undefined | null>) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

/**
 * Cookie-aware API client. On SSR, useRequestFetch forwards the session cookie
 * so Nitro proxies can authenticate. Plain $fetch does not, which causes 401 on reload.
 */
export function useApiClient() {
  const requestFetch = useRequestFetch()

  const profilesQuery = {
    key: ['profiles'] as const,
    query: () => requestFetch<SearchProfile[]>('/api/profiles')
  }

  function jobsQuery(filters: ListJobsQuery) {
    return {
      key: ['jobs', filters] as const,
      query: () => requestFetch<JobsListResponse>('/api/jobs', {
        query: cleanQuery(filters as Record<string, string | number | boolean | undefined | null>)
      })
    }
  }

  function jobQuery(id: string) {
    return {
      key: ['job', id] as const,
      query: () => requestFetch<Job>(`/api/jobs/${id}`)
    }
  }

  function trendsQuery(params: { days?: number, source?: string, limit?: number } = {}) {
    return {
      key: ['trends', params] as const,
      query: () => requestFetch<MarketTrendsResponse>('/api/jobs/trends', {
        query: cleanQuery(params)
      })
    }
  }

  const meQuery = {
    key: ['me'] as const,
    query: () => requestFetch<PublicUser>('/api/auth/me')
  }

  const usersQuery = {
    key: ['users'] as const,
    query: () => requestFetch<PublicUser[]>('/api/users')
  }

  function cvAnalysisQuery(refresh = false) {
    return {
      key: ['cv-analysis', refresh] as const,
      query: () => requestFetch<CvAnalysisResponse>('/api/users/me/cv-analysis', {
        query: cleanQuery({ refresh })
      })
    }
  }

  function createProfile(body: CreateProfileInput) {
    return requestFetch<SearchProfile>('/api/profiles', { method: 'POST', body })
  }

  function updateProfile(id: string, body: UpdateProfileInput) {
    return requestFetch<SearchProfile>(`/api/profiles/${id}`, { method: 'PATCH', body })
  }

  function deleteProfile(id: string) {
    return requestFetch<{ ok: true }>(`/api/profiles/${id}`, { method: 'DELETE' })
  }

  function uploadCv(userId: string, file: File) {
    const body = new FormData()
    body.append('file', file)
    return requestFetch<CvUploadResult>(`/api/users/${userId}/cv`, {
      method: 'POST',
      body
    })
  }

  function triggerScrape() {
    return requestFetch<ScrapeTriggerResult>('/api/jobs/scrape', {
      method: 'POST',
      timeout: 130_000
    })
  }

  function updateJobStatus(jobId: string, patch: UpdateJobStatusInput) {
    return requestFetch<JobStatusResponse>(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: patch
    })
  }

  function deleteJob(jobId: string) {
    return requestFetch<{ ok: true }>(`/api/jobs/${jobId}`, { method: 'DELETE' })
  }

  function runSeed() {
    return requestFetch<SeedResult>('/api/seed', {
      method: 'POST',
      body: {}
    })
  }

  function createUser(body: CreateUserInput) {
    return requestFetch<PublicUser>('/api/users', { method: 'POST', body })
  }

  function updateUser(id: string, body: UpdateUserInput) {
    return requestFetch<PublicUser>(`/api/users/${id}`, { method: 'PATCH', body })
  }

  function deleteUser(id: string) {
    return requestFetch<{ ok: true }>(`/api/users/${id}`, { method: 'DELETE' })
  }

  function updateMe(body: UpdateSelfInput) {
    return requestFetch<PublicUser>('/api/users/me', { method: 'PATCH', body })
  }

  function changePassword(body: ChangePasswordInput) {
    return requestFetch<{ ok: true }>('/api/users/me/password', { method: 'PATCH', body })
  }

  return {
    profilesQuery,
    jobsQuery,
    jobQuery,
    trendsQuery,
    meQuery,
    usersQuery,
    cvAnalysisQuery,
    createProfile,
    updateProfile,
    deleteProfile,
    uploadCv,
    triggerScrape,
    updateJobStatus,
    deleteJob,
    runSeed,
    createUser,
    updateUser,
    deleteUser,
    updateMe,
    changePassword
  }
}

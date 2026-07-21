import type {
  CreateProfileInput,
  CvUploadResult,
  Job,
  JobInterestStatus,
  JobStatusResponse,
  JobsListResponse,
  ListJobsQuery,
  MarketTrendsResponse,
  PublicUser,
  ScrapeTriggerResult,
  SearchProfile,
  SeedResult,
  UpdateProfileInput
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

  function updateJobStatus(jobId: string, status: JobInterestStatus | null) {
    return requestFetch<JobStatusResponse>(`/api/jobs/${jobId}/status`, {
      method: 'PATCH',
      body: { status }
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

  return {
    profilesQuery,
    jobsQuery,
    jobQuery,
    trendsQuery,
    meQuery,
    createProfile,
    updateProfile,
    deleteProfile,
    uploadCv,
    triggerScrape,
    updateJobStatus,
    deleteJob,
    runSeed
  }
}

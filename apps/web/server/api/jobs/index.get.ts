import type { JobsListResponse } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return backendFetch<JobsListResponse>(event, '/api/jobs', {
    query: {
      source: query.source as string | undefined,
      profile_id: query.profile_id as string | undefined,
      min_score: query.min_score !== undefined ? Number(query.min_score) : undefined,
      interest: query.interest as string | undefined,
      applied: query.applied !== undefined ? query.applied === 'true' : undefined,
      rejected: query.rejected !== undefined ? query.rejected === 'true' : undefined,
      work_mode: query.work_mode as string | undefined,
      relevance: query.relevance as string | undefined,
      location_city: query.location_city as string | undefined,
      location_country: query.location_country as string | undefined,
      added_within: query.added_within as string | undefined,
      sort_by: query.sort_by as string | undefined,
      sort_dir: query.sort_dir as string | undefined,
      page: query.page !== undefined ? Number(query.page) : undefined,
      limit: query.limit !== undefined ? Number(query.limit) : undefined
    }
  })
})

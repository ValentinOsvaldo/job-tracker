import type { JobsListResponse } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return backendFetch<JobsListResponse>(event, '/api/jobs', {
    query: {
      source: query.source as string | undefined,
      profile_id: query.profile_id as string | undefined,
      min_score: query.min_score !== undefined ? Number(query.min_score) : undefined,
      page: query.page !== undefined ? Number(query.page) : undefined,
      limit: query.limit !== undefined ? Number(query.limit) : undefined
    }
  })
})

import type { MarketTrendsResponse } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return backendFetch<MarketTrendsResponse>(event, '/api/jobs/trends', {
    query: {
      days: query.days !== undefined ? Number(query.days) : undefined,
      source: query.source as string | undefined,
      limit: query.limit !== undefined ? Number(query.limit) : undefined,
      refresh: query.refresh !== undefined ? String(query.refresh) : undefined
    }
  })
})

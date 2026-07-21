import type { CvAnalysisResponse } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  return backendFetch<CvAnalysisResponse>(event, '/api/users/me/cv-analysis', {
    query: {
      refresh: query.refresh !== undefined ? query.refresh === 'true' : undefined
    }
  })
})

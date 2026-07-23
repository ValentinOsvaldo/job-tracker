import type { RegenerateAnalysesResult } from '../../../../../app/types/api'
import { backendFetch } from '../../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  return backendFetch<RegenerateAnalysesResult>(event, `/api/jobs/${id}/analyses/regenerate`, {
    method: 'POST',
    body: {}
  })
})

import type { JobAnalysis } from '../../../../../app/types/api'
import { backendFetch } from '../../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const body = await readBody(event)

  return backendFetch<JobAnalysis>(`/api/jobs/${id}/analyses/manual`, {
    method: 'POST',
    body
  })
})

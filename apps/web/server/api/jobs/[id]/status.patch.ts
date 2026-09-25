import type { JobStatusResponse, UpdateJobStatusInput } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const body = await readBody<UpdateJobStatusInput>(event)

  return backendFetch<JobStatusResponse>(`/api/jobs/${id}/status`, {
    method: 'PATCH',
    body
  })
})

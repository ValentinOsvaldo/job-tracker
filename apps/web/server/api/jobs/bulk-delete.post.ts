import type { BulkDeleteResult } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ ids?: string[] }>(event)

  if (!body?.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ids is required' })
  }

  return backendFetch<BulkDeleteResult>(event, '/api/jobs/bulk-delete', {
    method: 'POST',
    body: { ids: body.ids }
  })
})

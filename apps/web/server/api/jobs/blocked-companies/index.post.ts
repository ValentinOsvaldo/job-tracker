import type { CreateBlockedCompanyInput, CreateBlockedCompanyResult } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateBlockedCompanyInput>(event)

  if (!body?.company?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'company is required' })
  }

  return backendFetch<CreateBlockedCompanyResult>(event, '/api/jobs/blocked-companies', {
    method: 'POST',
    body
  })
})

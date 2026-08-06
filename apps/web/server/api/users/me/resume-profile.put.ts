import type { ResumeProfile, UpsertResumeProfileInput } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<UpsertResumeProfileInput>(event)

  return backendFetch<ResumeProfile>(event, '/api/users/me/resume-profile', {
    method: 'PUT',
    body
  })
})

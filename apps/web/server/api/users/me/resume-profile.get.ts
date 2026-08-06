import type { ResumeProfile } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<ResumeProfile>(event, '/api/users/me/resume-profile')
})

import type { AtsCheckResponse } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<AtsCheckResponse>('/api/users/me/ats-check')
})

import type { AtsCheckResponse } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<AtsCheckResponse>(event, '/api/users/me/ats-check')
})

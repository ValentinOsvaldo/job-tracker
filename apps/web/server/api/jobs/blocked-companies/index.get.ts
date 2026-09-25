import type { BlockedCompany } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<BlockedCompany[]>('/api/jobs/blocked-companies')
})

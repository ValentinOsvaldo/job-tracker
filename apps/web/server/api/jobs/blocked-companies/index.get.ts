import type { BlockedCompany } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<BlockedCompany[]>(event, '/api/jobs/blocked-companies')
})

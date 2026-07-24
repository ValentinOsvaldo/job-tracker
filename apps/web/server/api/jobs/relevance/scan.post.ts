import type { RelevanceScanResult } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<RelevanceScanResult>(event, '/api/jobs/relevance/scan', {
    method: 'POST',
    body: {}
  })
})

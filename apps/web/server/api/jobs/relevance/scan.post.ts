import type { RelevanceScanResult } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<RelevanceScanResult>('/api/jobs/relevance/scan', {
    method: 'POST',
    body: {}
  })
})

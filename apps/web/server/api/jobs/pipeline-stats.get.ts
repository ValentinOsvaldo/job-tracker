import type { PipelineStats } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<PipelineStats>('/api/jobs/pipeline-stats')
})

import type { PipelineStats } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<PipelineStats>(event, '/api/jobs/pipeline-stats')
})

import type { ScrapeTriggerResult } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<ScrapeTriggerResult>('/api/jobs/scrape', {
    method: 'POST',
    body: {},
    timeout: 130_000
  })
})

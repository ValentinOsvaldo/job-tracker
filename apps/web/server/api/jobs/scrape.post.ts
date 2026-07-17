import type { ScrapeTriggerResult } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<ScrapeTriggerResult>(event, '/api/jobs/scrape', {
    method: 'POST',
    body: {},
    timeout: 130_000
  })
})

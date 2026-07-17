import type { SearchProfile } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<SearchProfile[]>(event, '/api/profiles')
})

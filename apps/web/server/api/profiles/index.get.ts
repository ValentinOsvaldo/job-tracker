import type { SearchProfile } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async () => {
  return backendFetch<SearchProfile[]>('/api/profiles')
})

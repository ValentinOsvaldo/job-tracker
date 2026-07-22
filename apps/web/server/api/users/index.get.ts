import type { PublicUser } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  return backendFetch<PublicUser[]>(event, '/api/users')
})

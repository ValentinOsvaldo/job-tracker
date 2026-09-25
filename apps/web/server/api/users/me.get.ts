import type { PublicUser } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(() => backendFetch<PublicUser>('/api/users/me'))

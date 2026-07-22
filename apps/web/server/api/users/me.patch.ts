import type { PublicUser, UpdateSelfInput } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<UpdateSelfInput>(event)

  return backendFetch<PublicUser>(event, '/api/users/me', {
    method: 'PATCH',
    body
  })
})

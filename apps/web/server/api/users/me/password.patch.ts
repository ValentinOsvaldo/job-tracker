import type { ChangePasswordInput } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<ChangePasswordInput>(event)

  return backendFetch<{ ok: true }>(event, '/api/users/me/password', {
    method: 'PATCH',
    body
  })
})

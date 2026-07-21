import type { CreateUserInput, PublicUser } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateUserInput>(event)

  return backendFetch<PublicUser>(event, '/api/users', {
    method: 'POST',
    body
  })
})

import type { PublicUser, UpdateUserInput } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User id is required' })
  }

  const body = await readBody<UpdateUserInput>(event)

  return backendFetch<PublicUser>(event, `/api/users/${id}`, {
    method: 'PATCH',
    body
  })
})

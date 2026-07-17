import type { SearchProfile, UpdateProfileInput } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Profile id is required' })
  }

  const body = await readBody<UpdateProfileInput>(event)

  return backendFetch<SearchProfile>(event, `/api/profiles/${id}`, {
    method: 'PATCH',
    body
  })
})

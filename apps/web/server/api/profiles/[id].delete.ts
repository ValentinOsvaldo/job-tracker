import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Profile id is required' })
  }

  return backendFetch<{ ok: true }>(`/api/profiles/${id}`, {
    method: 'DELETE'
  })
})

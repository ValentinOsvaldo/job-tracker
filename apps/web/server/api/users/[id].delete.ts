import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'User id is required' })
  }

  return backendFetch<{ ok: true }>(event, `/api/users/${id}`, {
    method: 'DELETE'
  })
})

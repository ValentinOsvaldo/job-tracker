import { backendFetch } from '../../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const { profile_id: profileId } = getQuery(event)
  if (typeof profileId !== 'string' || !profileId) {
    throw createError({ statusCode: 400, statusMessage: 'profile_id is required' })
  }

  return backendFetch<{ prompt: string }>(event, `/api/jobs/${id}/analyses/prompt`, {
    query: { profile_id: profileId }
  })
})

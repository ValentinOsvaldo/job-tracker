import type { TailoredResume, TailoredResumeContent } from '../../../../../app/types/api'
import { backendFetch } from '../../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const body = await readBody<{ generated_content?: TailoredResumeContent }>(event)

  return backendFetch<TailoredResume>(`/api/jobs/${id}/tailor-resume/validate`, {
    method: 'POST',
    body: body ?? {}
  })
})

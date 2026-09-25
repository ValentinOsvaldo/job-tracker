import { backendFetch } from '../../../../utils/backend'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Job id is required' })
  }

  const query = getQuery(event)
  const template = typeof query.template === 'string' ? query.template : 'classic'

  const buffer = await backendFetch<ArrayBuffer>(`/api/jobs/${id}/tailor-resume/pdf`, {
    query: { template },
    responseType: 'arrayBuffer'
  })

  setHeader(event, 'Content-Type', 'application/pdf')
  setHeader(event, 'Content-Disposition', `attachment; filename="cv-${id}.pdf"`)
  return send(event, Buffer.from(buffer))
})

import type { CvUploadResult } from '../../../../app/types/api'
import { backendFetch } from '../../../utils/backend'

export default defineEventHandler(async (event) => {
  const form = await readMultipartFormData(event)
  if (!form?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const filePart = form.find(part => part.name === 'file')
  if (!filePart?.data) {
    throw createError({ statusCode: 400, statusMessage: 'File field is required' })
  }

  const bytes = Uint8Array.from(filePart.data)
  const blob = new Blob([bytes], {
    type: filePart.type || 'application/pdf'
  })

  const body = new FormData()
  body.append('file', blob, filePart.filename || 'cv.pdf')

  return backendFetch<CvUploadResult>('/api/users/me/cv', {
    method: 'POST',
    body
  })
})

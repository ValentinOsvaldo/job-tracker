import type { CreateProfileInput, SearchProfile } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const body = await readBody<CreateProfileInput>(event)

  return backendFetch<SearchProfile>(event, '/api/profiles', {
    method: 'POST',
    body
  })
})

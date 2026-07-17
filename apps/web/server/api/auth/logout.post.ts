import { backendLogout } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  await backendLogout(event)
  return { ok: true }
})

import type { PublicUser } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const user = await backendFetch<PublicUser>(event, '/api/auth/me')

  const normalized: PublicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    cv_text: user.cv_text,
    cv_filename: user.cv_filename,
    cv_uploaded_at: user.cv_uploaded_at ? String(user.cv_uploaded_at) : null,
    created_at: String(user.created_at)
  }

  // Cast: nuxt-auth-utils vs Nitro h3 v1/v2 event type mismatch
  const session = await getUserSession(event as never)
  await setUserSession(event as never, {
    user: normalized,
    secure: session.secure
  })

  return normalized
})

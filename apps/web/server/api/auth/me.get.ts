import type { PublicUser } from '../../../app/types/api'
import { backendFetch } from '../../utils/backend'

export default defineEventHandler(async (event) => {
  const user = await backendFetch<PublicUser>(event, '/api/auth/me')

  const normalized: PublicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    cv_text: user.cv_text,
    cv_filename: user.cv_filename,
    cv_uploaded_at: user.cv_uploaded_at ? String(user.cv_uploaded_at) : null,
    home_city: user.home_city,
    home_country: user.home_country,
    created_at: String(user.created_at)
  }

  // Cast: nuxt-auth-utils vs Nitro h3 v1/v2 event type mismatch
  const session = await getUserSession(event as never)
  // Keep the session cookie minimal — cv_text can be tens of KB and
  // would push the sealed cookie past the browser's 4096-byte limit.
  // Use replace (not set) so a previously bloated session doesn't merge
  // its stale fields back in via defu.
  await replaceUserSession(event as never, {
    user: {
      id: normalized.id,
      name: normalized.name,
      email: normalized.email,
      role: normalized.role,
      created_at: normalized.created_at
    },
    secure: session.secure
  })

  return normalized
})

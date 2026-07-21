import type { SeedResult } from '../../app/types/api'
import { backendFetch } from '../utils/backend'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin role required' })
  }

  const config = useRuntimeConfig(event)
  const seedSecret = config.seedSecret as string

  if (!seedSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'NUXT_SEED_SECRET is not configured'
    })
  }

  return backendFetch<SeedResult>(event, '/api/seed', {
    method: 'POST',
    body: {},
    requireAuth: false,
    headers: {
      'X-Seed-Secret': seedSecret
    }
  })
})

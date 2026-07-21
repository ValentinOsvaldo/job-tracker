import type {
  AuthTokensResponse,
  LoginResponse,
  PublicUser
} from '../../app/types/api'

type AuthEvent = any // eslint-disable-line @typescript-eslint/no-explicit-any

function getApiBaseUrl() {
  const config = useRuntimeConfig()
  return config.apiBaseUrl as string
}

function toFetchError(error: unknown) {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error as { statusCode: number, data?: unknown, statusMessage?: string }
  }
  return null
}

async function refreshSession(event: AuthEvent): Promise<boolean> {
  const session = await getUserSession(event)
  const refreshToken = session.secure?.refreshToken
  if (!refreshToken) {
    return false
  }

  try {
    const tokens = await $fetch<AuthTokensResponse>(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      body: { refreshToken }
    })

    // Replace (not merge) so stale fields from an old, oversized session
    // — e.g. a cv_text that leaked in before it was excluded — don't
    // survive forever via defu's fallback-to-existing-data merge.
    await replaceUserSession(event, {
      user: session.user,
      secure: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    })
    return true
  } catch {
    await clearUserSession(event)
    return false
  }
}

export async function setAuthSession(event: AuthEvent, login: LoginResponse) {
  const user: PublicUser = {
    id: login.user.id,
    name: login.user.name,
    email: login.user.email,
    role: login.user.role,
    cv_text: login.user.cv_text,
    cv_filename: login.user.cv_filename,
    cv_uploaded_at: login.user.cv_uploaded_at
      ? String(login.user.cv_uploaded_at)
      : null,
    created_at: String(login.user.created_at)
  }

  // Only minimal identity fields go in the session cookie. cv_text can be
  // tens of KB and pushes the sealed cookie past the browser's 4096-byte
  // Set-Cookie limit, which makes the browser silently drop it — the user
  // looks logged in but the cookie never actually updates. Use replace
  // (not set) so a previously bloated session doesn't merge its stale
  // fields back in via defu.
  await replaceUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at
    },
    secure: {
      accessToken: login.accessToken,
      refreshToken: login.refreshToken
    }
  })

  return user
}

export async function backendFetch<T>(
  event: AuthEvent,
  path: string,
  options: {
    method?: string
    body?: BodyInit | Record<string, unknown> | object | null
    query?: Record<string, string | number | boolean | undefined | null>
    headers?: Record<string, string>
    requireAuth?: boolean
    timeout?: number
  } = {}
): Promise<T> {
  const {
    requireAuth = true,
    method = 'GET',
    body,
    query,
    headers = {},
    timeout
  } = options
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`

  const doFetch = async (accessToken?: string) => {
    const requestHeaders: Record<string, string> = { ...headers }
    if (accessToken) {
      requestHeaders.Authorization = `Bearer ${accessToken}`
    }

    return $fetch<T>(url, {
      method,
      body,
      query,
      headers: requestHeaders,
      ...(timeout !== undefined ? { timeout } : {})
    })
  }

  if (!requireAuth) {
    return doFetch()
  }

  const session = await requireUserSession(event)
  const accessToken = session.secure?.accessToken
  if (!accessToken) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  try {
    return await doFetch(accessToken)
  } catch (error) {
    const fetchError = toFetchError(error)
    if (fetchError?.statusCode !== 401) {
      throw createError({
        statusCode: fetchError?.statusCode ?? 502,
        statusMessage: fetchError?.statusMessage ?? 'Upstream API error',
        data: fetchError?.data
      })
    }

    const refreshed = await refreshSession(event)
    if (!refreshed) {
      throw createError({ statusCode: 401, statusMessage: 'Session expired' })
    }

    const nextSession = await getUserSession(event)
    const nextToken = nextSession.secure?.accessToken
    if (!nextToken) {
      throw createError({ statusCode: 401, statusMessage: 'Session expired' })
    }

    try {
      return await doFetch(nextToken)
    } catch (retryError) {
      const retryFetchError = toFetchError(retryError)
      throw createError({
        statusCode: retryFetchError?.statusCode ?? 502,
        statusMessage: retryFetchError?.statusMessage ?? 'Upstream API error',
        data: retryFetchError?.data
      })
    }
  }
}

export async function backendLogin(event: AuthEvent, email: string, password: string) {
  try {
    const login = await $fetch<LoginResponse>(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      body: { email, password }
    })
    return setAuthSession(event, login)
  } catch (error) {
    const fetchError = toFetchError(error)
    throw createError({
      statusCode: fetchError?.statusCode ?? 401,
      statusMessage: fetchError?.statusMessage ?? 'Invalid credentials',
      data: fetchError?.data
    })
  }
}

export async function backendLogout(event: AuthEvent) {
  const session = await getUserSession(event)
  const refreshToken = session.secure?.refreshToken

  if (refreshToken) {
    try {
      await $fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        body: { refreshToken }
      })
    } catch {
      // Best-effort logout against Nest; always clear local session
    }
  }

  await clearUserSession(event)
}

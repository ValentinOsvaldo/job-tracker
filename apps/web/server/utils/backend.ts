function toFetchError(error: unknown) {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    return error as { statusCode: number, data?: unknown, statusMessage?: string }
  }
  return null
}

export async function backendFetch<T>(
  path: string,
  options: {
    method?: string
    body?: BodyInit | Record<string, unknown> | object | null
    query?: Record<string, string | number | boolean | undefined | null>
    headers?: Record<string, string>
    timeout?: number
    responseType?: 'json' | 'arrayBuffer'
  } = {}
): Promise<T> {
  const { method = 'GET', body, query, headers, timeout, responseType } = options
  const apiBaseUrl = useRuntimeConfig().apiBaseUrl as string
  const url = `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`

  try {
    return await $fetch<T>(url, {
      method,
      ...(responseType ? { responseType } : {}),
      body,
      query,
      headers,
      ...(timeout !== undefined ? { timeout } : {})
    })
  } catch (error) {
    const fetchError = toFetchError(error)
    throw createError({
      statusCode: fetchError?.statusCode ?? 502,
      statusMessage: fetchError?.statusMessage ?? 'Upstream API error',
      data: fetchError?.data
    })
  }
}

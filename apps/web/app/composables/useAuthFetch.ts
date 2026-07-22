/**
 * useRequestFetch wrapper that auto-logs-out on a 401. Nitro already clears
 * the session cookie when token refresh fails (see server/utils/backend.ts),
 * so a 401 reaching the client always means "not authenticated anymore" —
 * handle that here once instead of in every call site's catch block.
 */
export function useAuthFetch(): ReturnType<typeof useRequestFetch> {
  const requestFetch = useRequestFetch()

  const wrapped = (request: unknown, options?: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (requestFetch as any)(request, options).catch((error: unknown) => {
      if (import.meta.client && (error as { statusCode?: number })?.statusCode === 401) {
        const { clear } = useUserSession()
        clear().finally(() => navigateTo('/login'))
      }
      throw error
    })
  }

  return wrapped as ReturnType<typeof useRequestFetch>
}

import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const { loggedIn, user, fetch: fetchSession, clear } = useUserSession()

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })
      await fetchSession()
      await navigateTo('/')
    } catch (err: unknown) {
      const statusMessage = (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Invalid credentials'
      error.value = statusMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Always clear local session
    } finally {
      await clear()
      loading.value = false
      await navigateTo('/login')
    }
  }

  async function refreshUser() {
    const requestFetch = useRequestFetch()
    const me = await requestFetch('/api/auth/me')
    await fetchSession()
    return me
  }

  return {
    loggedIn,
    user,
    loading,
    error,
    login,
    logout,
    refreshUser,
    fetchSession
  }
})

<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const isAuthError = computed(() => props.error.statusCode === 401)
const isNotFound = computed(() => props.error.statusCode === 404)

const title = computed(() => {
  if (isNotFound.value) return 'Page not found'
  if (props.error.statusCode === 403) return 'Access denied'
  return 'Something went wrong'
})

const description = computed(() => {
  if (isNotFound.value) return 'The page you\'re looking for doesn\'t exist or has moved.'
  if (props.error.statusCode === 403) return 'You don\'t have permission to view this page.'
  return props.error.statusMessage || props.error.message || 'An unexpected error occurred.'
})

const icon = computed(() => {
  if (isNotFound.value) return 'i-lucide-file-question'
  if (props.error.statusCode === 403) return 'i-lucide-shield-alert'
  return 'i-lucide-circle-alert'
})

// A 401 means the session/token is no longer valid server-side — bounce to
// login instead of showing a dead-end error screen.
onMounted(async () => {
  if (isAuthError.value) {
    const { clear } = useUserSession()
    await clear()
    await clearError({ redirect: '/login' })
  }
})

function goHome() {
  clearError({ redirect: '/' })
}

function reload() {
  window.location.reload()
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-default">
      <template v-if="isAuthError">
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 text-muted animate-spin"
        />
        <p class="text-sm text-muted">
          Redirecting to sign in…
        </p>
      </template>
      <template v-else>
        <UIcon
          :name="icon"
          class="size-10 text-muted"
        />
        <div class="space-y-1">
          <h1 class="text-xl font-semibold text-highlighted">
            {{ title }}
          </h1>
          <p class="text-sm text-muted max-w-sm">
            {{ description }}
          </p>
        </div>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-house"
            color="neutral"
            variant="subtle"
            @click="goHome"
          >
            Go home
          </UButton>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            @click="reload"
          >
            Try again
          </UButton>
        </div>
      </template>
    </div>
  </UApp>
</template>

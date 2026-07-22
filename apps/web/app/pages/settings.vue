<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const api = useApiClient()
const auth = useAuthStore()
const seeding = ref(false)

async function onSeed() {
  seeding.value = true
  try {
    const result = await api.runSeed()
    const created = result.created?.length ?? 0
    const skipped = result.skipped?.length ?? 0
    toast.add({
      title: 'Seed completed',
      description: created
        ? `Created ${created}: ${result.created.join(', ')}${skipped ? ` · skipped ${skipped}` : ''}`
        : skipped
          ? `All users already exist (skipped ${skipped})`
          : 'No changes',
      color: 'success'
    })
  } catch (err: unknown) {
    toast.add({
      title: 'Seed failed',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Check NUXT_SEED_SECRET and Nest SEED_SECRET',
      color: 'error'
    })
  } finally {
    seeding.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-xl">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Settings
      </h1>
      <p class="text-sm text-muted">
        Local development helpers
      </p>
    </div>

    <UCard v-if="auth.isAdmin">
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Database seed
        </h2>
      </template>

      <p class="text-sm text-muted mb-4">
        Creates the default users if they do not exist. Safe to run more than once.
      </p>

      <UButton
        icon="i-lucide-database"
        color="neutral"
        :loading="seeding"
        @click="onSeed"
      >
        Run seed
      </UButton>
    </UCard>

    <p
      v-if="!auth.isAdmin"
      class="text-sm text-muted"
    >
      Nothing to configure here — admin-only tools are hidden for your role.
    </p>

    <p class="text-sm text-muted">
      Looking to edit your name, email, or password? Head over to
      <NuxtLink
        to="/users"
        class="text-primary hover:underline"
      >
        Users
      </NuxtLink>.
    </p>
  </div>
</template>

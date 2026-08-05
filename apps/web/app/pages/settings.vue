<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const auth = useAuthStore()
const seeding = ref(false)

const { data: blockedCompanies, isPending: loadingBlocked } = useQuery({
  key: () => ['blocked-companies'],
  query: () => api.blockedCompaniesQuery.query()
})

const newCompany = ref('')
const newReason = ref('')
const purgeExisting = ref(true)
const addingCompany = ref(false)
const removingId = ref<string | null>(null)

async function onAddBlockedCompany() {
  const company = newCompany.value.trim()
  if (!company) return

  addingCompany.value = true
  try {
    const result = await api.createBlockedCompany({
      company,
      reason: newReason.value.trim() || undefined,
      purge_existing: purgeExisting.value
    })
    toast.add({
      title: `"${result.blocked_company.company}" bloqueada`,
      description: result.purged > 0 ? `Se eliminaron ${result.purged} oferta(s) existentes` : undefined,
      color: 'success'
    })
    newCompany.value = ''
    newReason.value = ''
    await queryCache.invalidateQueries({ key: ['blocked-companies'] })
    await queryCache.invalidateQueries({ key: ['jobs'] })
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo bloquear la empresa',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Try again',
      color: 'error'
    })
  } finally {
    addingCompany.value = false
  }
}

async function onRemoveBlockedCompany(id: string) {
  removingId.value = id
  try {
    await api.deleteBlockedCompany(id)
    toast.add({ title: 'Empresa desbloqueada', color: 'success' })
    await queryCache.invalidateQueries({ key: ['blocked-companies'] })
    await queryCache.invalidateQueries({ key: ['jobs'] })
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo desbloquear',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    removingId.value = null
  }
}

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

    <UCard v-if="auth.isAdmin">
      <template #header>
        <h2 class="font-semibold text-highlighted">
          Empresas bloqueadas
        </h2>
      </template>

      <p class="text-sm text-muted mb-4">
        Las ofertas de estas empresas se ocultan de las listas y no se vuelven a ingresar al hacer scraping.
      </p>

      <div
        v-if="blockedCompanies && blockedCompanies.length > 0"
        class="space-y-2 mb-4"
      >
        <div
          v-for="entry in blockedCompanies"
          :key="entry.id"
          class="flex items-center justify-between gap-3 rounded-lg border border-default px-3 py-2"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium text-highlighted truncate">
              {{ entry.company }}
            </p>
            <p
              v-if="entry.reason"
              class="text-xs text-muted truncate"
            >
              {{ entry.reason }}
            </p>
          </div>
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            :loading="removingId === entry.id"
            aria-label="Desbloquear"
            title="Desbloquear"
            @click="onRemoveBlockedCompany(entry.id)"
          />
        </div>
      </div>
      <p
        v-else-if="!loadingBlocked"
        class="text-sm text-muted mb-4"
      >
        No hay empresas bloqueadas.
      </p>

      <form
        class="flex flex-col gap-3 border-t border-default pt-4"
        @submit.prevent="onAddBlockedCompany"
      >
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField label="Empresa">
            <UInput
              v-model="newCompany"
              placeholder="e.g. BairesDev"
              class="w-full"
            />
          </UFormField>
          <UFormField label="Motivo (opcional)">
            <UInput
              v-model="newReason"
              placeholder="e.g. Rechazado varias veces"
              class="w-full"
            />
          </UFormField>
        </div>
        <UCheckbox
          v-model="purgeExisting"
          label="Eliminar también las ofertas existentes de esta empresa"
        />
        <UButton
          type="submit"
          icon="i-lucide-shield-ban"
          color="error"
          variant="subtle"
          class="self-start"
          :loading="addingCompany"
          :disabled="!newCompany.trim()"
        >
          Bloquear empresa
        </UButton>
      </form>
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

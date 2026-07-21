<script setup lang="ts">
import type { CreateProfileInput, SearchProfile } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()

const { data: profiles, isPending, error, refetch } = useQuery({
  key: () => ['profiles'],
  query: () => api.profilesQuery.query()
})

const modalOpen = ref(false)
const editing = ref<SearchProfile | null>(null)

function openCreate() {
  editing.value = null
  modalOpen.value = true
}

function openEdit(profile: SearchProfile) {
  editing.value = profile
  modalOpen.value = true
}

async function invalidateProfiles() {
  await queryCache.invalidateQueries({ key: ['profiles'] })
}

async function onSave(payload: CreateProfileInput) {
  try {
    if (editing.value) {
      await api.updateProfile(editing.value.id, payload)
      toast.add({ title: 'Profile updated', color: 'success' })
    } else {
      await api.createProfile(payload)
      toast.add({ title: 'Profile created', color: 'success' })
    }
    modalOpen.value = false
    await invalidateProfiles()
  } catch (err: unknown) {
    toast.add({
      title: 'Could not save profile',
      description: (err as { statusMessage?: string })?.statusMessage,
      color: 'error'
    })
  }
}

async function onToggleActive(profile: SearchProfile) {
  try {
    await api.updateProfile(profile.id, { is_active: !profile.is_active })
    await invalidateProfiles()
  } catch {
    toast.add({ title: 'Could not update profile', color: 'error' })
  }
}

async function onDelete(profile: SearchProfile) {
  if (!confirm(`Delete profile “${profile.name}”?`)) return
  try {
    await api.deleteProfile(profile.id)
    toast.add({ title: 'Profile deleted', color: 'success' })
    await invalidateProfiles()
  } catch {
    toast.add({ title: 'Could not delete profile', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Search profiles
        </h1>
        <p class="text-sm text-muted">
          Create and manage the roles used to score job offers
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        New profile
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Failed to load profiles"
      :actions="[{ label: 'Retry', onClick: () => { void refetch() } }]"
    />

    <div
      v-if="isPending"
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="!profiles?.length"
      class="rounded-lg border border-dashed border-default p-10 text-center text-muted"
    >
      No profiles yet. Create one to start matching jobs.
    </div>

    <div
      v-else
      class="grid gap-4 md:grid-cols-2"
    >
      <UCard
        v-for="profile in profiles"
        :key="profile.id"
      >
        <template #header>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold text-highlighted">
                {{ profile.name }}
              </h2>
              <p class="text-xs text-muted capitalize">
                {{ profile.role }}
              </p>
            </div>
            <UBadge
              :color="profile.is_active ? 'success' : 'neutral'"
              variant="subtle"
            >
              {{ profile.is_active ? 'Active' : 'Inactive' }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <div>
            <p class="text-xs text-muted mb-1">
              Keywords
            </p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="keyword in profile.keywords"
                :key="keyword"
                color="neutral"
                variant="subtle"
                size="sm"
              >
                {{ keyword }}
              </UBadge>
            </div>
          </div>
          <div>
            <p class="text-xs text-muted mb-1">
              Locations
            </p>
            <div class="flex flex-wrap gap-1.5">
              <UBadge
                v-for="location in profile.locations"
                :key="location"
                color="neutral"
                variant="outline"
                size="sm"
              >
                {{ location }}
              </UBadge>
            </div>
          </div>

          <div v-if="formatProfileSalaryRanges(profile).length">
            <p class="text-xs text-muted mb-1">
              Target salary
            </p>
            <p
              v-for="range in formatProfileSalaryRanges(profile)"
              :key="range"
              class="text-default"
            >
              {{ range }}
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex flex-wrap gap-2">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              icon="i-lucide-pencil"
              @click="openEdit(profile)"
            >
              Edit
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="ghost"
              @click="onToggleActive(profile)"
            >
              {{ profile.is_active ? 'Deactivate' : 'Activate' }}
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="onDelete(profile)"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <ProfileFormModal
      v-model:open="modalOpen"
      :profile="editing"
      @save="onSave"
    />
  </div>
</template>

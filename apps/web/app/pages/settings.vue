<script setup lang="ts">
import type { UserRole } from '~/types/api'

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

const roleItems: { label: string, value: UserRole }[] = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' }
]

const newUser = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole
})

const creatingUser = ref(false)

async function onCreateUser() {
  creatingUser.value = true
  try {
    const created = await api.createUser({ ...newUser })
    toast.add({
      title: 'User created',
      description: `${created.name} (${created.email}) · ${created.role}`,
      color: 'success'
    })
    newUser.name = ''
    newUser.email = ''
    newUser.password = ''
    newUser.role = 'user'
  } catch (err: unknown) {
    toast.add({
      title: 'Could not create user',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Try again',
      color: 'error'
    })
  } finally {
    creatingUser.value = false
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
          Create user
        </h2>
      </template>

      <UForm
        :state="newUser"
        class="space-y-4"
        @submit="onCreateUser"
      >
        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="newUser.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="newUser.email"
            type="email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
          hint="Min 8 characters"
          required
        >
          <UInput
            v-model="newUser.password"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Role"
          name="role"
        >
          <USelect
            v-model="newUser.role"
            :items="roleItems"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          icon="i-lucide-user-plus"
          :loading="creatingUser"
        >
          Create user
        </UButton>
      </UForm>
    </UCard>

    <p
      v-if="!auth.isAdmin"
      class="text-sm text-muted"
    >
      Nothing to configure here — admin-only tools are hidden for your role.
    </p>
  </div>
</template>

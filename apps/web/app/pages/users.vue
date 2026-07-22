<script setup lang="ts">
import type { CreateUserInput, PublicUser, UpdateUserInput } from '~/types/api'
import { h, resolveComponent } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const auth = useAuthStore()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

function errorMessage(err: unknown, fallback: string) {
  return (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
    || (err as { data?: { message?: string } })?.data?.message
    || fallback
}

// --- My account ---
const accountState = reactive({ name: '', email: '' })
const savingAccount = ref(false)

watch(
  () => auth.user,
  (user) => {
    if (!user) return
    accountState.name = user.name
    accountState.email = user.email
  },
  { immediate: true }
)

async function onSaveAccount() {
  savingAccount.value = true
  try {
    await api.updateMe({
      name: accountState.name.trim(),
      email: accountState.email.trim()
    })
    await auth.refreshUser()
    toast.add({ title: 'Account updated', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not update account',
      description: errorMessage(err, 'Try again'),
      color: 'error'
    })
  } finally {
    savingAccount.value = false
  }
}

const passwordState = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const changingPassword = ref(false)

async function onChangePassword() {
  if (passwordState.newPassword !== passwordState.confirmPassword) {
    toast.add({ title: 'Passwords do not match', color: 'error' })
    return
  }

  changingPassword.value = true
  try {
    await api.changePassword({
      currentPassword: passwordState.currentPassword,
      newPassword: passwordState.newPassword
    })
    toast.add({ title: 'Password updated', color: 'success' })
    passwordState.currentPassword = ''
    passwordState.newPassword = ''
    passwordState.confirmPassword = ''
  } catch (err: unknown) {
    toast.add({
      title: 'Could not change password',
      description: errorMessage(err, 'Check your current password'),
      color: 'error'
    })
  } finally {
    changingPassword.value = false
  }
}

// --- All users (admin) ---
const { data: users, isPending: usersPending, error: usersError, refetch: refetchUsers } = useQuery({
  key: () => ['users'],
  query: () => api.usersQuery.query(),
  enabled: () => auth.isAdmin
})

const modalOpen = ref(false)
const editingUser = ref<PublicUser | null>(null)

function openCreateUser() {
  editingUser.value = null
  modalOpen.value = true
}

function openEditUser(user: PublicUser) {
  editingUser.value = user
  modalOpen.value = true
}

async function invalidateUsers() {
  await queryCache.invalidateQueries({ key: ['users'] })
}

async function onSaveUser(payload: CreateUserInput | UpdateUserInput) {
  try {
    if (editingUser.value) {
      await api.updateUser(editingUser.value.id, payload as UpdateUserInput)
      toast.add({ title: 'User updated', color: 'success' })
    } else {
      await api.createUser(payload as CreateUserInput)
      toast.add({ title: 'User created', color: 'success' })
    }
    modalOpen.value = false
    await invalidateUsers()
  } catch (err: unknown) {
    toast.add({
      title: 'Could not save user',
      description: errorMessage(err, 'Try again'),
      color: 'error'
    })
  }
}

const deletingId = ref<string | null>(null)

async function onDeleteUser(user: PublicUser) {
  if (!confirm(`Delete "${user.name}"? This can't be undone.`)) return

  deletingId.value = user.id
  try {
    await api.deleteUser(user.id)
    toast.add({ title: 'User deleted', color: 'success' })
    await invalidateUsers()
  } catch (err: unknown) {
    toast.add({
      title: 'Could not delete user',
      description: errorMessage(err, 'Try again'),
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

const columns = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }: { row: { original: PublicUser } }) =>
      h(UBadge, {
        color: row.original.role === 'admin' ? 'primary' : 'neutral',
        variant: 'subtle',
        size: 'sm',
        class: 'capitalize'
      }, () => row.original.role)
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }: { row: { original: PublicUser } }) => formatDate(row.original.created_at)
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: { row: { original: PublicUser } }) => {
      const isSelf = row.original.id === auth.user?.id
      return h('div', { class: 'flex justify-end' }, [
        h(UDropdownMenu, {
          items: [
            [{ label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => openEditUser(row.original) }],
            [{
              label: 'Delete',
              icon: 'i-lucide-trash-2',
              color: 'error' as const,
              disabled: isSelf,
              onSelect: () => onDeleteUser(row.original)
            }]
          ]
        }, () => h(UButton, {
          'icon': 'i-lucide-ellipsis',
          'color': 'neutral',
          'variant': 'ghost',
          'size': 'xs',
          'loading': deletingId.value === row.original.id,
          'aria-label': 'User actions'
        }))
      ])
    }
  }
]
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Users
      </h1>
      <p class="text-sm text-muted">
        Manage your account{{ auth.isAdmin ? ', and everyone else’s' : '' }}
      </p>
    </div>

    <section class="space-y-6 max-w-xl">
      <h2 class="text-lg font-semibold text-highlighted">
        My account
      </h2>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Profile
          </h3>
        </template>

        <UForm
          :state="accountState"
          class="space-y-4"
          @submit="onSaveAccount"
        >
          <UFormField
            label="Name"
            name="name"
            required
          >
            <UInput
              v-model="accountState.name"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Email"
            name="email"
            required
          >
            <UInput
              v-model="accountState.email"
              type="email"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            icon="i-lucide-save"
            :loading="savingAccount"
          >
            Save changes
          </UButton>
        </UForm>
      </UCard>

      <UCard>
        <template #header>
          <h3 class="font-semibold text-highlighted">
            Change password
          </h3>
        </template>

        <UForm
          :state="passwordState"
          class="space-y-4"
          @submit="onChangePassword"
        >
          <UFormField
            label="Current password"
            name="currentPassword"
            required
          >
            <UInput
              v-model="passwordState.currentPassword"
              type="password"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="New password"
            name="newPassword"
            hint="Min 8 characters"
            required
          >
            <UInput
              v-model="passwordState.newPassword"
              type="password"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Confirm new password"
            name="confirmPassword"
            required
          >
            <UInput
              v-model="passwordState.confirmPassword"
              type="password"
              class="w-full"
            />
          </UFormField>

          <UButton
            type="submit"
            icon="i-lucide-key-round"
            :loading="changingPassword"
          >
            Update password
          </UButton>
        </UForm>
      </UCard>
    </section>

    <section
      v-if="auth.isAdmin"
      class="space-y-4"
    >
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-highlighted">
          All users
        </h2>
        <UButton
          icon="i-lucide-user-plus"
          @click="openCreateUser"
        >
          New user
        </UButton>
      </div>

      <UAlert
        v-if="usersError"
        color="error"
        title="Failed to load users"
        :actions="[{ label: 'Retry', onClick: () => { void refetchUsers() } }]"
      />

      <UCard :ui="{ body: 'p-0 sm:p-0' }">
        <UTable
          :data="users ?? []"
          :columns="columns"
          :loading="usersPending"
          class="w-full"
        />
      </UCard>
    </section>

    <UserFormModal
      v-model:open="modalOpen"
      :user="editingUser"
      @save="onSaveUser"
    />
  </div>
</template>

<script setup lang="ts">
import type { CreateUserInput, PublicUser, UpdateUserInput, UserRole } from '~/types/api'

const props = defineProps<{
  user?: PublicUser | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [value: CreateUserInput | UpdateUserInput]
}>()

const roleItems: { label: string, value: UserRole }[] = [
  { label: 'User', value: 'user' },
  { label: 'Admin', value: 'admin' }
]

const state = reactive({
  name: '',
  email: '',
  password: '',
  role: 'user' as UserRole
})

watch(
  () => [props.open, props.user] as const,
  ([open, user]) => {
    if (!open) return
    if (user) {
      state.name = user.name
      state.email = user.email
      state.password = ''
      state.role = user.role
    } else {
      state.name = ''
      state.email = ''
      state.password = ''
      state.role = 'user'
    }
  },
  { immediate: true }
)

function onSubmit() {
  if (props.user) {
    const payload: UpdateUserInput = {
      name: state.name.trim(),
      email: state.email.trim(),
      role: state.role
    }
    if (state.password) {
      payload.password = state.password
    }
    emit('save', payload)
    return
  }

  emit('save', {
    name: state.name.trim(),
    email: state.email.trim(),
    password: state.password,
    role: state.role
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="user ? 'Edit user' : 'New user'"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="state.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
          :hint="user ? 'Leave empty to keep the current password' : 'Min 8 characters'"
          :required="!user"
        >
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Role"
          name="role"
        >
          <USelect
            v-model="state.role"
            :items="roleItems"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="emit('update:open', false)"
          >
            Cancel
          </UButton>
          <UButton type="submit">
            Save
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

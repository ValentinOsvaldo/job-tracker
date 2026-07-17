<script setup lang="ts">
import type { CreateProfileInput, ProfileRole, SearchProfile } from '~/types/api'

const props = defineProps<{
  profile?: SearchProfile | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'save': [value: CreateProfileInput]
}>()

const roleItems = [
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Fullstack', value: 'fullstack' },
  { label: 'Mobile', value: 'mobile' }
]

const state = reactive({
  name: '',
  role: 'frontend' as ProfileRole,
  keywordsText: '',
  locationsText: '',
  is_active: true
})

watch(
  () => [props.open, props.profile] as const,
  ([open, profile]) => {
    if (!open) return
    if (profile) {
      state.name = profile.name
      state.role = profile.role
      state.keywordsText = profile.keywords.join(', ')
      state.locationsText = profile.locations.join(', ')
      state.is_active = profile.is_active
    } else {
      state.name = ''
      state.role = 'frontend'
      state.keywordsText = ''
      state.locationsText = ''
      state.is_active = true
    }
  },
  { immediate: true }
)

function parseList(value: string) {
  return value
    .split(/[,;\n]/)
    .map(part => part.trim())
    .filter(Boolean)
}

function onSubmit() {
  emit('save', {
    name: state.name.trim(),
    role: state.role,
    keywords: parseList(state.keywordsText),
    locations: parseList(state.locationsText),
    is_active: state.is_active
  })
}
</script>

<template>
  <UModal
    :open="open"
    :title="profile ? 'Edit profile' : 'New profile'"
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
            placeholder="Frontend Remote MX"
          />
        </UFormField>

        <UFormField
          label="Role"
          name="role"
          required
        >
          <USelect
            v-model="state.role"
            :items="roleItems"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Keywords"
          name="keywords"
          hint="Comma-separated"
          required
        >
          <UTextarea
            v-model="state.keywordsText"
            class="w-full"
            placeholder="vue, typescript, nuxt"
          />
        </UFormField>

        <UFormField
          label="Locations"
          name="locations"
          hint="Comma-separated"
          required
        >
          <UTextarea
            v-model="state.locationsText"
            class="w-full"
            placeholder="Mexico, Remote"
          />
        </UFormField>

        <UFormField
          label="Active"
          name="is_active"
        >
          <USwitch v-model="state.is_active" />
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

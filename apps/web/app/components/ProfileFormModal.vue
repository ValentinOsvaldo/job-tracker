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
  is_active: true,
  salary_min_mxn: undefined as number | undefined,
  salary_max_mxn: undefined as number | undefined,
  salary_min_usd: undefined as number | undefined,
  salary_max_usd: undefined as number | undefined
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
      state.salary_min_mxn = profile.salary_min_mxn ?? undefined
      state.salary_max_mxn = profile.salary_max_mxn ?? undefined
      state.salary_min_usd = profile.salary_min_usd ?? undefined
      state.salary_max_usd = profile.salary_max_usd ?? undefined
    } else {
      state.name = ''
      state.role = 'frontend'
      state.keywordsText = ''
      state.locationsText = ''
      state.is_active = true
      state.salary_min_mxn = undefined
      state.salary_max_mxn = undefined
      state.salary_min_usd = undefined
      state.salary_max_usd = undefined
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
    is_active: state.is_active,
    salary_min_mxn: state.salary_min_mxn,
    salary_max_mxn: state.salary_max_mxn,
    salary_min_usd: state.salary_min_usd,
    salary_max_usd: state.salary_max_usd
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

        <div class="space-y-2">
          <p class="text-sm font-medium">
            Desired salary range
          </p>
          <p class="text-xs text-muted">
            Optional — fill whichever currency(ies) apply. No conversion is done between them.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Min (MXN)"
              name="salary_min_mxn"
            >
              <UInput
                v-model.number="state.salary_min_mxn"
                type="number"
                min="0"
                class="w-full"
                placeholder="40000"
              />
            </UFormField>

            <UFormField
              label="Max (MXN)"
              name="salary_max_mxn"
            >
              <UInput
                v-model.number="state.salary_max_mxn"
                type="number"
                min="0"
                class="w-full"
                placeholder="80000"
              />
            </UFormField>

            <UFormField
              label="Min (USD)"
              name="salary_min_usd"
            >
              <UInput
                v-model.number="state.salary_min_usd"
                type="number"
                min="0"
                class="w-full"
                placeholder="2000"
              />
            </UFormField>

            <UFormField
              label="Max (USD)"
              name="salary_max_usd"
            >
              <UInput
                v-model.number="state.salary_max_usd"
                type="number"
                min="0"
                class="w-full"
                placeholder="4500"
              />
            </UFormField>
          </div>
        </div>

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

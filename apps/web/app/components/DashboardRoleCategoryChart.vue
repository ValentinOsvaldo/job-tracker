<script setup lang="ts">
import type { RoleCategoryCount } from '~/types/api'

const props = defineProps<{
  categories: RoleCategoryCount[]
}>()

const colorMode = useColorMode()

// Categorical identity colors, validated separately for light/dark surfaces
// (dataviz palette check) rather than an automatic light->dark flip.
const PALETTE = {
  light: { frontend: '#3B82F6', backend: '#00C16A', fullstack: '#F59E0B', mobile: '#8B5CF6', other: '#9CA3AF' },
  dark: { frontend: '#2563EB', backend: '#007F45', fullstack: '#D97706', mobile: '#7C3AED', other: '#71717A' }
} as const

const LABELS: Record<RoleCategoryCount['role_category'], string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  mobile: 'Mobile',
  other: 'Otro'
}

const palette = computed(() => PALETTE[colorMode.value === 'dark' ? 'dark' : 'light'])

const categories = computed(() =>
  Object.fromEntries(
    props.categories.map(c => [c.role_category, { name: LABELS[c.role_category], color: palette.value[c.role_category] }])
  )
)

const data = computed(() => props.categories.map(c => c.count))
const total = computed(() => props.categories.reduce((sum, c) => sum + c.count, 0))
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Tipos de trabajo
      </h3>
      <p class="text-xs text-muted mt-0.5">
        {{ total }} ofertas categorizadas
      </p>
    </template>

    <div
      v-if="!total"
      class="flex items-center justify-center h-[160px] text-sm text-muted"
    >
      Aún no hay ofertas categorizadas.
    </div>
    <ClientOnly v-else>
      <div class="flex items-center justify-center">
        <DonutChart
          :data="data"
          :categories="categories"
          :radius="60"
          :arc-width="18"
          :height="160"
        />
      </div>
      <template #fallback>
        <USkeleton class="h-[160px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

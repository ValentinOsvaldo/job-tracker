<script setup lang="ts">
import type { WorkModeCount } from '~/types/api'

const props = defineProps<{
  modes: WorkModeCount[]
}>()

const colorMode = useColorMode()

// Categorical identity colors, validated separately for light/dark surfaces
// (dataviz palette check) rather than an automatic light->dark flip.
const PALETTE = {
  light: { remote: '#00C16A', hybrid: '#3B82F6', onsite: '#F59E0B', unknown: '#9CA3AF' },
  dark: { remote: '#007F45', hybrid: '#2563EB', onsite: '#D97706', unknown: '#71717A' }
} as const

const LABELS: Record<WorkModeCount['work_mode'], string> = {
  remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
  unknown: 'Sin especificar'
}

const palette = computed(() => PALETTE[colorMode.value === 'dark' ? 'dark' : 'light'])

const categories = computed(() =>
  Object.fromEntries(
    props.modes.map(m => [m.work_mode, { name: LABELS[m.work_mode], color: palette.value[m.work_mode] }])
  )
)

const data = computed(() => props.modes.map(m => m.count))
const total = computed(() => props.modes.reduce((sum, m) => sum + m.count, 0))
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Modalidad de trabajo
      </h3>
      <p class="text-xs text-muted mt-0.5">
        {{ total }} ofertas clasificadas
      </p>
    </template>

    <div
      v-if="!total"
      class="flex items-center justify-center h-[160px] text-sm text-muted"
    >
      Aún no hay ofertas clasificadas.
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

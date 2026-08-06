<script setup lang="ts">
import type { PipelineStats } from '~/types/api'

const props = defineProps<{
  stats: PipelineStats
}>()

const rejectionRateLabel = computed(() => {
  if (props.stats.rejection_rate === null) return '—'
  return `${Math.round(props.stats.rejection_rate * 100)}%`
})

const avgDaysLabel = computed(() => {
  if (props.stats.avg_days_to_reject === null) return '—'
  return props.stats.avg_days_to_reject.toFixed(1)
})

const COLOR_CLASSES = {
  primary: 'text-primary',
  error: 'text-error',
  warning: 'text-warning',
  neutral: 'text-muted'
} as const

const tiles = computed(() => [
  {
    key: 'pending',
    label: 'En proceso',
    value: String(props.stats.pending),
    icon: 'i-lucide-clock',
    colorClass: COLOR_CLASSES.primary
  },
  {
    key: 'rejected',
    label: 'Rechazadas',
    value: String(props.stats.rejected),
    icon: 'i-lucide-x-circle',
    colorClass: COLOR_CLASSES.error
  },
  {
    key: 'rate',
    label: 'Tasa de rechazo',
    value: rejectionRateLabel.value,
    icon: 'i-lucide-percent',
    colorClass: COLOR_CLASSES.warning
  },
  {
    key: 'avg-days',
    label: 'Días promedio a rechazo',
    value: avgDaysLabel.value,
    icon: 'i-lucide-calendar-clock',
    colorClass: COLOR_CLASSES.neutral
  }
])
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Pipeline de postulaciones
      </h3>
      <p class="text-xs text-muted mt-0.5">
        {{ stats.total_applied }} postulaciones enviadas
      </p>
    </template>

    <div
      v-if="stats.total_applied === 0"
      class="flex items-center justify-center h-[100px] text-sm text-muted"
    >
      Todavía no marcaste ninguna oferta como postulada.
    </div>

    <div
      v-else
      class="grid grid-cols-2 sm:grid-cols-4 gap-4"
    >
      <div
        v-for="tile in tiles"
        :key="tile.key"
        class="flex flex-col gap-1"
      >
        <div class="flex items-center gap-1.5 text-muted">
          <UIcon
            :name="tile.icon"
            class="size-3.5"
            :class="tile.colorClass"
          />
          <span class="text-xs">{{ tile.label }}</span>
        </div>
        <span class="text-2xl font-semibold text-highlighted tabular-nums">
          {{ tile.value }}
        </span>
      </div>
    </div>

    <p
      v-if="stats.total_applied > 0 && stats.avg_days_to_reject === null && stats.rejected > 0"
      class="text-xs text-muted mt-3"
    >
      El tiempo promedio aparecerá cuando haya rechazos con fecha de postulación registrada.
    </p>
  </UCard>
</template>

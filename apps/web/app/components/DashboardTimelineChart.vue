<script setup lang="ts">
import type { DayCount } from '~/types/api'

const props = defineProps<{
  days: DayCount[]
}>()

const data = computed(() => props.days.map(d => ({ count: d.count })))

const categories = {
  count: { name: 'Ofertas', color: 'var(--ui-primary)' }
}

const shortDateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' })

function xFormatter(tick: number) {
  const day = props.days[Math.round(tick)]
  return day ? shortDateFormatter.format(new Date(`${day.date}T00:00:00`)) : ''
}

const total = computed(() => props.days.reduce((sum, d) => sum + d.count, 0))
const hasData = computed(() => total.value > 0)
</script>

<template>
  <UCard>
    <template #header>
      <div>
        <h3 class="font-semibold text-highlighted">
          Ofertas capturadas por día
        </h3>
        <p class="text-xs text-muted mt-0.5">
          {{ total }} ofertas en los últimos {{ days.length }} días
        </p>
      </div>
    </template>

    <div
      v-if="!hasData"
      class="flex items-center justify-center h-[180px] text-sm text-muted"
    >
      Aún no hay suficientes datos para esta gráfica.
    </div>
    <ClientOnly v-else>
      <AreaChart
        :data="data"
        :categories="categories"
        :height="180"
        :x-formatter="xFormatter"
        :x-num-ticks="6"
        hide-legend
        :curve-type="CurveType.MonotoneX"
      />
      <template #fallback>
        <USkeleton class="h-[180px] w-full" />
      </template>
    </ClientOnly>
  </UCard>
</template>

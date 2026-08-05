<script setup lang="ts">
import type { KeywordStat } from '~/types/api'

const props = defineProps<{
  skills: KeywordStat[]
}>()

const data = computed(() => [...props.skills].slice(0, 8).reverse())

const categories = {
  count: { name: 'Ofertas', color: 'var(--ui-primary)' }
}

const chartHeight = computed(() => Math.max(160, data.value.length * 34))
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="font-semibold text-highlighted">
        Skills más pedidos
      </h3>
      <p class="text-xs text-muted mt-0.5">
        Según el análisis de ofertas con IA
      </p>
    </template>

    <div
      v-if="!data.length"
      class="flex items-center justify-center h-[160px] text-sm text-muted"
    >
      Aún no hay suficientes ofertas analizadas.
    </div>
    <ClientOnly v-else>
      <BarChart
        :data="data"
        :categories="categories"
        :height="chartHeight"
        x-axis="term"
        :y-axis="['count']"
        :orientation="Orientation.Horizontal"
        :radius="4"
        :bar-padding="0.35"
        hide-legend
      />
      <template #fallback>
        <USkeleton
          class="w-full"
          :style="{ height: `${chartHeight}px` }"
        />
      </template>
    </ClientOnly>
  </UCard>
</template>

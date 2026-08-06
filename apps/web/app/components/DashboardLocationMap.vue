<script setup lang="ts">
import type { GeoCount, LocationInsights } from '~/types/api'

const props = defineProps<{
  locations: LocationInsights
}>()

const view = ref<'mexico' | 'world'>('mexico')

const viewTabs = [
  { label: 'México', value: 'mexico' },
  { label: 'Mundo', value: 'world' }
]

const activeList = computed<GeoCount[]>(() =>
  view.value === 'mexico' ? props.locations.mexico_by_region : props.locations.by_country
)

const geocoded = computed(() => activeList.value.filter(item => item.lat != null && item.lon != null))
const counts = computed(() => activeList.value.map(item => item.count))
const maxCount = computed(() => (counts.value.length ? Math.max(...counts.value) : 1))
const minCount = computed(() => (counts.value.length ? Math.min(...counts.value) : 0))

const mexicoBounds: MapRegion = { lat: { min: 14, max: 33 }, lng: { min: -119, max: -86 } }

const pins = computed<MapPin[]>(() =>
  geocoded.value.map(item => ({
    id: item.label,
    lat: item.lat as number,
    lng: item.lon as number,
    svgOptions: {
      radius: sequentialSize(item.count, minCount.value, maxCount.value),
      color: sequentialColor(item.count, minCount.value, maxCount.value),
      strokeColor: 'var(--ui-bg)',
      strokeWidth: 0.15,
      strokeOpacity: 0.9
    },
    data: { label: item.label, count: item.count }
  }))
)

const mapWrapperRef = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null
let isReordering = false

function bringPinsToFront() {
  if (isReordering) return
  const container = mapWrapperRef.value
  const svg = container?.querySelector('svg')
  if (!svg) return
  const hexCircles = Array.from(svg.querySelectorAll('circle')).filter(circle =>
    (circle.getAttribute('fill') || '').startsWith('#')
  )
  if (!hexCircles.length) return

  isReordering = true
  hexCircles.forEach(circle => svg.appendChild(circle))
  setTimeout(() => {
    isReordering = false
  }, 0)
}

watch(mapWrapperRef, (container) => {
  observer?.disconnect()
  if (!container) return
  observer = new MutationObserver(() => bringPinsToFront())
  observer.observe(container, { childList: true, subtree: true })
  nextTick(bringPinsToFront)
}, { immediate: true })

onBeforeUnmount(() => observer?.disconnect())

watch([view, pins], () => nextTick(bringPinsToFront))

const rankedList = computed(() => activeList.value.slice(0, 8))
const listMax = computed(() => (rankedList.value.length ? Math.max(...rankedList.value.map(i => i.count)) : 1))

const totalLabel = computed(() => {
  const { total_with_location, total_mexico } = props.locations
  if (!total_with_location) return 'No hay ofertas con ubicación clasificada todavía.'
  if (view.value === 'mexico') {
    return `${total_mexico} de ${total_with_location} ofertas con ubicación son de México`
  }
  return `${total_with_location} ofertas con ubicación conocida`
})
</script>

<template>
  <UCard :ui="{ root: 'h-full flex flex-col', body: 'p-0 sm:p-0 flex-1 min-h-0 flex flex-col' }">
    <template #header>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-highlighted">
            De dónde salen las ofertas
          </h3>
          <p class="text-xs text-muted mt-0.5">
            {{ totalLabel }}
          </p>
        </div>
        <UTabs
          v-model="view"
          :items="viewTabs"
          size="xs"
          class="w-fit"
        />
      </div>
    </template>

    <div
      v-if="!activeList.length"
      class="flex-1 flex flex-col items-center justify-center gap-1 py-16 text-center"
    >
      <UIcon
        name="i-lucide-map-pin-off"
        class="size-6 text-muted mb-1"
      />
      <p class="text-sm text-muted">
        {{ view === 'mexico' ? 'Aún no hay ofertas de México con estado identificado.' : 'Aún no hay suficientes ofertas con país identificado.' }}
      </p>
    </div>

    <div
      v-else
      class="grid lg:grid-cols-[1fr_260px] flex-1 min-h-0"
    >
      <ClientOnly>
        <div
          v-if="geocoded.length"
          ref="mapWrapperRef"
          class="p-2 sm:p-4 h-full min-h-[220px]"
        >
          <DottedMap
            v-if="view === 'world'"
            :key="'world'"
            :pins="pins"
            region-name="world"
            :show-controls="false"
            :dot-size="0.34"
          />
          <DottedMap
            v-else
            :key="'mexico'"
            :pins="pins"
            :countries="['MEX']"
            :region="mexicoBounds"
            :show-controls="false"
            :dot-size="0.6"
          />
        </div>
        <div
          v-else
          class="flex items-center justify-center h-full min-h-[220px] text-sm text-muted px-4 text-center"
        >
          No se pudieron ubicar estas ofertas en el mapa, pero aquí está el desglose.
        </div>
        <template #fallback>
          <div class="p-4 h-full min-h-[220px]">
            <USkeleton class="h-full min-h-[220px] w-full rounded-lg" />
          </div>
        </template>
      </ClientOnly>

      <ul class="flex flex-col gap-3 p-4 border-t lg:border-t-0 lg:border-l border-default justify-center">
        <li
          v-for="(item, index) in rankedList"
          :key="item.label"
          class="flex items-center gap-3"
        >
          <span class="text-xs tabular-nums text-muted w-3.5 text-right shrink-0">{{ index + 1 }}</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline justify-between gap-2">
              <span class="text-sm font-medium text-highlighted truncate">{{ item.label }}</span>
              <span class="text-sm font-semibold text-highlighted tabular-nums shrink-0">{{ item.count }}</span>
            </div>
            <div class="mt-1 h-1.5 rounded-full bg-elevated overflow-hidden">
              <div
                class="h-full rounded-full"
                :style="{
                  width: `${(item.count / listMax) * 100}%`,
                  backgroundColor: sequentialColor(item.count, minCount, maxCount)
                }"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>
  </UCard>
</template>

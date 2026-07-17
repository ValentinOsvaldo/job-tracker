<script setup lang="ts">
import type { JobSource, ListJobsQuery } from '~/types/api'
import { h, resolveComponent } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const ScoreBadge = resolveComponent('ScoreBadge')

const scraping = ref(false)

const filters = reactive<{
  source: JobSource | 'all'
  profile_id: string | 'all'
  min_score: number | undefined
  page: number
  limit: number
}>({
  source: 'all',
  profile_id: 'all',
  min_score: undefined,
  page: 1,
  limit: 20
})

const queryFilters = computed<ListJobsQuery>(() => ({
  source: filters.source === 'all' ? undefined : filters.source,
  profile_id: filters.profile_id === 'all' ? undefined : filters.profile_id,
  min_score: typeof filters.min_score === 'number' && !Number.isNaN(filters.min_score)
    ? filters.min_score
    : undefined,
  page: filters.page,
  limit: filters.limit
}))

const { data: profiles } = useQuery({
  key: () => ['profiles'],
  query: () => api.profilesQuery.query()
})

const { data: jobsResponse, isPending, error, refetch } = useQuery({
  key: () => ['jobs', { ...queryFilters.value }],
  query: () => api.jobsQuery(queryFilters.value).query()
})

const sourceItems = [
  { label: 'All sources', value: 'all' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Indeed', value: 'indeed' }
]

const profileItems = computed(() => [
  { label: 'All profiles', value: 'all' },
  ...(profiles.value ?? []).map(p => ({
    label: p.name,
    value: p.id
  }))
])

const totalPages = computed(() => {
  const total = jobsResponse.value?.total ?? 0
  const limit = jobsResponse.value?.limit ?? filters.limit
  return Math.max(1, Math.ceil(total / limit))
})

watch(
  () => [filters.source, filters.profile_id, filters.min_score, filters.limit],
  () => {
    filters.page = 1
  }
)

const columns = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: { row: { original: { id: string, title: string, company: string | null } } }) => {
      return h('div', { class: 'min-w-0' }, [
        h(resolveComponent('NuxtLink'), {
          to: `/jobs/${row.original.id}`,
          class: 'font-medium text-highlighted hover:underline'
        }, () => row.original.title),
        row.original.company
          ? h('p', { class: 'text-xs text-muted truncate' }, row.original.company)
          : null
      ])
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
    cell: ({ row }: { row: { original: { source: string } } }) =>
      h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm', class: 'capitalize' }, () => row.original.source)
  },
  {
    id: 'score',
    header: 'Score',
    cell: ({ row }: { row: { original: { analyses: { fit_score: number }[] } } }) =>
      h(ScoreBadge, { score: bestFitScore(row.original.analyses) })
  },
  {
    id: 'salary',
    header: 'Salary',
    cell: ({ row }: { row: { original: { salary_min: number | null, salary_max: number | null, analyses: { salary_min: number | null, salary_max: number | null, salary_is_inferred: boolean, fit_score: number }[] } } }) => {
      const best = [...(row.original.analyses ?? [])].sort((a, b) => b.fit_score - a.fit_score)[0]
      return formatSalary(
        best?.salary_min ?? row.original.salary_min,
        best?.salary_max ?? row.original.salary_max,
        best?.salary_is_inferred
      )
    }
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }: { row: { original: { location: string | null } } }) => row.original.location || '—'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: { row: { original: { id: string } } }) =>
      h(UButton, {
        to: `/jobs/${row.original.id}`,
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-arrow-right'
      }, () => 'View')
  }
]

async function onScrape() {
  scraping.value = true
  try {
    const result = await api.triggerScrape()
    toast.add({
      title: 'Ofertas actualizadas',
      description: `Enviadas ${result.sent} · insertadas ${result.ingest?.inserted ?? 0} · omitidas ${result.ingest?.skipped ?? 0}`,
      color: 'success'
    })
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await refetch()
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo actualizar',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Revisa que el scraper esté en marcha',
      color: 'error'
    })
  } finally {
    scraping.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Job offers
        </h1>
        <p class="text-sm text-muted">
          Filter and browse analyzed opportunities
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        :loading="scraping"
        @click="onScrape"
      >
        Actualizar ofertas
      </UButton>
    </div>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <UFormField label="Source">
        <USelect
          v-model="filters.source"
          :items="sourceItems"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Profile">
        <USelect
          v-model="filters.profile_id"
          :items="profileItems"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Min score">
        <UInput
          v-model.number="filters.min_score"
          type="number"
          min="0"
          max="10"
          step="0.5"
          placeholder="e.g. 7"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Page size">
        <USelect
          v-model="filters.limit"
          :items="[
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '50', value: 50 }
          ]"
          class="w-full"
        />
      </UFormField>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Failed to load jobs"
      :actions="[{ label: 'Retry', onClick: () => { void refetch() } }]"
    />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="jobsResponse?.data ?? []"
        :columns="columns"
        :loading="isPending"
        class="w-full"
      />
    </UCard>

    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">
        {{ jobsResponse?.total ?? 0 }} jobs
      </p>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-left"
          :disabled="filters.page <= 1"
          @click="filters.page--"
        />
        <span class="text-sm text-muted">
          {{ filters.page }} / {{ totalPages }}
        </span>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-chevron-right"
          :disabled="filters.page >= totalPages"
          @click="filters.page++"
        />
      </div>
    </div>
  </div>
</template>

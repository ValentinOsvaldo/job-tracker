<script setup lang="ts">
import type { InterestStatus, Job, JobSortBy, JobSource, ListJobsQuery, SortDirection, WorkMode } from '~/types/api'
import { h, resolveComponent } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const ScoreBadge = resolveComponent('ScoreBadge')
const JobStatusControls = resolveComponent('JobStatusControls')

const scraping = ref(false)

type StatusFilter = 'all' | 'liked' | 'disliked' | 'applied' | 'rejected'

type Filters = {
  source: JobSource | 'all'
  profile_id: string | 'all'
  status: StatusFilter
  min_score: number | undefined
  work_mode: WorkMode[]
  location_city: string
  sort_by: JobSortBy | undefined
  sort_dir: SortDirection
  page: number
  limit: number
}

function readQueryString(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value
  return typeof raw === 'string' && raw.length > 0 ? raw : undefined
}

function readQueryNumber(value: unknown): number | undefined {
  const raw = readQueryString(value)
  if (raw === undefined) return undefined
  const num = Number(raw)
  return Number.isNaN(num) ? undefined : num
}

function readQueryArray(value: unknown): string[] {
  const raw = readQueryString(value)
  return raw ? raw.split(',').map(item => item.trim()).filter(Boolean) : []
}

function filtersFromQuery(query: Record<string, unknown>): Filters {
  return {
    source: (readQueryString(query.source) as JobSource | undefined) ?? 'all',
    profile_id: readQueryString(query.profile_id) ?? 'all',
    status: (readQueryString(query.status) as StatusFilter | undefined) ?? 'all',
    min_score: readQueryNumber(query.min_score),
    work_mode: readQueryArray(query.work_mode) as WorkMode[],
    location_city: readQueryString(query.location_city) ?? '',
    sort_by: readQueryString(query.sort_by) as JobSortBy | undefined,
    sort_dir: (readQueryString(query.sort_dir) as SortDirection | undefined) ?? 'asc',
    page: readQueryNumber(query.page) ?? 1,
    limit: readQueryNumber(query.limit) ?? 20
  }
}

function queryFromFilters(source: Filters): Record<string, string> {
  const query: Record<string, string> = {}
  if (source.source !== 'all') query.source = source.source
  if (source.profile_id !== 'all') query.profile_id = source.profile_id
  if (source.status !== 'all') query.status = source.status
  if (source.min_score !== undefined) query.min_score = String(source.min_score)
  if (source.work_mode.length > 0) query.work_mode = source.work_mode.join(',')
  if (source.location_city) query.location_city = source.location_city
  if (source.sort_by) {
    query.sort_by = source.sort_by
    query.sort_dir = source.sort_dir
  }
  if (source.page !== 1) query.page = String(source.page)
  if (source.limit !== 20) query.limit = String(source.limit)
  return query
}

const filters = reactive<Filters>(filtersFromQuery(route.query))

// Guards the two watchers below from feeding into each other while a URL
// (browser back/forward, pasted link) is being applied back onto `filters`.
let syncingFromRoute = false

const queryFilters = computed<ListJobsQuery>(() => ({
  source: filters.source === 'all' ? undefined : filters.source,
  profile_id: filters.profile_id === 'all' ? undefined : filters.profile_id,
  interest: filters.status === 'liked' || filters.status === 'disliked' ? filters.status : undefined,
  applied: filters.status === 'applied' ? true : undefined,
  rejected: filters.status === 'rejected' ? true : undefined,
  min_score: typeof filters.min_score === 'number' && !Number.isNaN(filters.min_score)
    ? filters.min_score
    : undefined,
  work_mode: filters.work_mode.length > 0 ? filters.work_mode.join(',') : undefined,
  location_city: filters.location_city || undefined,
  sort_by: filters.sort_by,
  sort_dir: filters.sort_by ? filters.sort_dir : undefined,
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

const statusItems: { label: string, value: StatusFilter }[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Liked', value: 'liked' },
  { label: 'Disliked', value: 'disliked' },
  { label: 'Applied', value: 'applied' },
  { label: 'Rejected', value: 'rejected' }
]

const workModeItems: { label: string, value: WorkMode }[] = [
  { label: 'Remote', value: 'remote' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Onsite', value: 'onsite' },
  { label: 'Unknown', value: 'unknown' }
]

const WORK_MODE_COLORS: Record<WorkMode, 'success' | 'warning' | 'neutral'> = {
  remote: 'success',
  hybrid: 'warning',
  onsite: 'neutral',
  unknown: 'neutral'
}

const totalPages = computed(() => {
  const total = jobsResponse.value?.total ?? 0
  const limit = jobsResponse.value?.limit ?? filters.limit
  return Math.max(1, Math.ceil(total / limit))
})

watch(
  () => [
    filters.source,
    filters.profile_id,
    filters.status,
    filters.min_score,
    filters.work_mode,
    filters.location_city,
    filters.limit,
    filters.sort_by,
    filters.sort_dir
  ],
  () => {
    if (!syncingFromRoute) filters.page = 1
  }
)

watch(
  filters,
  () => {
    if (syncingFromRoute) return
    router.replace({ query: queryFromFilters(filters) })
  },
  { deep: true }
)

watch(
  () => route.query,
  (query) => {
    const next = filtersFromQuery(query)
    const changed = (Object.keys(next) as (keyof Filters)[]).some(key => next[key] !== filters[key])
    if (!changed) return

    syncingFromRoute = true
    Object.assign(filters, next)
    nextTick(() => {
      syncingFromRoute = false
    })
  }
)

function toggleSort(field: JobSortBy) {
  if (filters.sort_by !== field) {
    filters.sort_by = field
    filters.sort_dir = 'asc'
  } else if (filters.sort_dir === 'asc') {
    filters.sort_dir = 'desc'
  } else {
    filters.sort_by = undefined
  }
}

function sortIcon(field: JobSortBy) {
  if (filters.sort_by !== field) return 'i-lucide-arrow-up-down'
  return filters.sort_dir === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

function sortableHeader(label: string, field: JobSortBy) {
  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    size: 'xs',
    trailingIcon: sortIcon(field),
    class: '-mx-2.5',
    onClick: () => toggleSort(field)
  }, () => label)
}

function onStatusUpdated(job: Job, result: { interest: InterestStatus | null, applied: boolean, rejected: boolean }) {
  job.user_interest = result.interest
  job.user_applied = result.applied
  job.user_rejected = result.rejected
}

const deletingId = ref<string | null>(null)

async function onDelete(job: { id: string, title: string }) {
  if (!confirm(`Delete “${job.title}”? This can't be undone.`)) return
  deletingId.value = job.id
  try {
    await api.deleteJob(job.id)
    toast.add({ title: 'Job deleted', color: 'success' })
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await refetch()
  } catch (err: unknown) {
    toast.add({
      title: 'Could not delete job',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}

const columns = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: { row: { original: { id: string, title: string, company: string | null } } }) => {
      return h('div', { class: 'min-w-0' }, [
        h(UTooltip, { text: row.original.title }, () => h(resolveComponent('NuxtLink'), {
          to: `/jobs/${row.original.id}`,
          class: 'block max-w-[220px] truncate font-medium text-highlighted hover:underline'
        }, () => row.original.title)),
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
    accessorKey: 'work_mode',
    header: 'Mode',
    cell: ({ row }: { row: { original: { work_mode: WorkMode } } }) =>
      h(UBadge, {
        color: WORK_MODE_COLORS[row.original.work_mode] ?? 'neutral',
        variant: 'subtle',
        size: 'sm',
        class: 'capitalize'
      }, () => row.original.work_mode)
  },
  {
    id: 'score',
    header: () => sortableHeader('Score', 'score'),
    cell: ({ row }: { row: { original: { analyses: { fit_score: number }[] } } }) =>
      h(ScoreBadge, { score: bestFitScore(row.original.analyses) })
  },
  {
    id: 'salary',
    header: () => sortableHeader('Salary', 'salary'),
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
    header: () => sortableHeader('Location', 'location'),
    cell: ({ row }: { row: { original: { location: string | null } } }) => row.original.location || '—'
  },
  {
    accessorKey: 'date_posted',
    header: 'Posted',
    cell: ({ row }: { row: { original: { date_posted: string | null } } }) => formatDate(row.original.date_posted)
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }: { row: { original: Job } }) =>
      h(JobStatusControls, {
        jobId: row.original.id,
        interest: row.original.user_interest ?? null,
        applied: row.original.user_applied ?? false,
        rejected: row.original.user_rejected ?? false,
        onUpdated: (result: { interest: InterestStatus | null, applied: boolean, rejected: boolean }) => onStatusUpdated(row.original, result)
      })
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }: { row: { original: { id: string, title: string } } }) =>
      h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(UButton, {
          to: `/jobs/${row.original.id}`,
          size: 'xs',
          color: 'neutral',
          variant: 'subtle',
          icon: 'i-lucide-arrow-right'
        }, () => 'View'),
        auth.isAdmin
          ? h('div', { class: 'h-4 w-px shrink-0 bg-default mx-1' })
          : null,
        auth.isAdmin
          ? h(UButton, {
              'size': 'xs',
              'color': 'error',
              'variant': 'ghost',
              'icon': 'i-lucide-trash-2',
              'loading': deletingId.value === row.original.id,
              'disabled': deletingId.value !== null,
              'aria-label': 'Delete job',
              'title': 'Delete job',
              'onClick': () => onDelete(row.original)
            })
          : null
      ])
  }
]

async function onScrape() {
  scraping.value = true
  try {
    const result = await api.triggerScrape()
    toast.add({
      title: 'Ofertas actualizadas',
      description: `Enviadas ${result.sent} · insertadas ${result.ingest?.inserted ?? 0} · omitidas ${result.ingest?.skipped ?? 0}${result.filtered_out ? ` · filtradas ${result.filtered_out}` : ''}`,
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

      <UFormField label="Status">
        <USelect
          v-model="filters.status"
          :items="statusItems"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Work mode">
        <USelectMenu
          v-model="filters.work_mode"
          :items="workModeItems"
          value-key="value"
          multiple
          placeholder="All modes"
          class="w-full"
        />
      </UFormField>

      <UFormField label="City">
        <UInput
          v-model="filters.location_city"
          placeholder="e.g. Guadalajara"
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

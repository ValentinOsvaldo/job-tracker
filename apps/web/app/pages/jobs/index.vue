<script setup lang="ts">
import type { AddedWithin, InterestStatus, Job, JobRelevance, JobRoleCategory, JobSortBy, JobSource, ListJobsQuery, SortDirection, WorkMode } from '~/types/api'
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
const UCheckbox = resolveComponent('UCheckbox')
const UTooltip = resolveComponent('UTooltip')
const ScoreBadge = resolveComponent('ScoreBadge')
const JobStatusControls = resolveComponent('JobStatusControls')

const scraping = ref(false)
const scanningRelevance = ref(false)
const bulkDeleting = ref(false)
const rowSelection = ref<Record<string, boolean>>({})

type StatusFilter = 'all' | 'liked' | 'disliked' | 'applied' | 'rejected'
type RelevanceFilter = 'all' | JobRelevance
type AddedFilter = 'all' | AddedWithin

type Filters = {
  source: JobSource | 'all'
  profile_id: string | 'all'
  status: StatusFilter
  min_score: number | undefined
  work_mode: WorkMode[]
  relevance: RelevanceFilter
  role_category: JobRoleCategory[]
  location_city: string
  added: AddedFilter
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
    relevance: (readQueryString(query.relevance) as RelevanceFilter | undefined) ?? 'all',
    role_category: readQueryArray(query.role_category) as JobRoleCategory[],
    location_city: readQueryString(query.location_city) ?? '',
    added: (readQueryString(query.added) as AddedFilter | undefined) ?? 'all',
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
  if (source.relevance !== 'all') query.relevance = source.relevance
  if (source.role_category.length > 0) query.role_category = source.role_category.join(',')
  if (source.location_city) query.location_city = source.location_city
  if (source.added !== 'all') query.added = source.added
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
  relevance: filters.relevance === 'all' ? undefined : filters.relevance,
  role_category: filters.role_category.length > 0 ? filters.role_category.join(',') : undefined,
  location_city: filters.location_city || undefined,
  added_within: filters.added === 'all' ? undefined : filters.added,
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

watch(queryFilters, () => {
  rowSelection.value = {}
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

const roleCategoryItems: { label: string, value: JobRoleCategory }[] = [
  { label: 'Frontend', value: 'frontend' },
  { label: 'Backend', value: 'backend' },
  { label: 'Fullstack', value: 'fullstack' },
  { label: 'Mobile', value: 'mobile' },
  { label: 'Otro', value: 'other' }
]

const ROLE_CATEGORY_LABELS: Record<JobRoleCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  mobile: 'Mobile',
  other: 'Otro'
}

// Neutral + icon (not color) for identity here — success/warning are already
// spoken for by the Mode column (remote/hybrid), so reusing them for an
// unrelated dimension would make color mean two different things.
const ROLE_CATEGORY_ICONS: Record<JobRoleCategory, string> = {
  frontend: 'i-lucide-layout-panel-left',
  backend: 'i-lucide-server',
  fullstack: 'i-lucide-layers',
  mobile: 'i-lucide-smartphone',
  other: 'i-lucide-circle-dashed'
}

const relevanceItems: { label: string, value: RelevanceFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not checked', value: 'unknown' },
  { label: 'Related', value: 'relevant' },
  { label: 'Not related', value: 'irrelevant' }
]

const RELEVANCE_BADGE: Record<JobRelevance, { label: string, color: 'neutral' | 'success' | 'error' }> = {
  unknown: { label: 'Not checked', color: 'neutral' },
  relevant: { label: 'Related', color: 'success' },
  irrelevant: { label: 'Not related', color: 'error' }
}

const addedItems: { label: string, value: AddedFilter }[] = [
  { label: 'Todo (histórico)', value: 'all' },
  { label: 'Últimas 24h', value: 'day' },
  { label: 'Últimos 7 días', value: 'week' }
]

const totalPages = computed(() => {
  const total = jobsResponse.value?.total ?? 0
  const limit = jobsResponse.value?.limit ?? filters.limit
  return Math.max(1, Math.ceil(total / limit))
})

// Toolbar filters (status/category/work mode/relevance) stay visible;
// everything else lives behind "More filters" — this count is what tells
// someone something's set back there without opening the popover.
const advancedActiveCount = computed(() =>
  (filters.source !== 'all' ? 1 : 0)
  + (filters.profile_id !== 'all' ? 1 : 0)
  + (filters.location_city ? 1 : 0)
  + (filters.min_score !== undefined ? 1 : 0)
  + (filters.added !== 'all' ? 1 : 0)
  + (filters.limit !== 20 ? 1 : 0)
)

const activeFilterCount = computed(() =>
  (filters.status !== 'all' ? 1 : 0)
  + filters.role_category.length
  + filters.work_mode.length
  + (filters.relevance !== 'all' ? 1 : 0)
  + advancedActiveCount.value
)

function clearFilters() {
  filters.source = 'all'
  filters.profile_id = 'all'
  filters.status = 'all'
  filters.min_score = undefined
  filters.work_mode = []
  filters.relevance = 'all'
  filters.role_category = []
  filters.location_city = ''
  filters.added = 'all'
  filters.limit = 20
}

watch(
  () => [
    filters.source,
    filters.profile_id,
    filters.status,
    filters.min_score,
    filters.work_mode,
    filters.relevance,
    filters.role_category,
    filters.location_city,
    filters.added,
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
const blockingCompany = ref<string | null>(null)

async function onBlockCompany(job: { company: string | null }) {
  const company = job.company?.trim()
  if (!company) return
  if (!confirm(`Bloquear "${company}"? Se ocultarán todas sus ofertas y se eliminarán las existentes.`)) return

  blockingCompany.value = company
  try {
    const result = await api.createBlockedCompany({ company, purge_existing: true })
    toast.add({
      title: `"${result.blocked_company.company}" bloqueada`,
      description: result.purged > 0 ? `Se eliminaron ${result.purged} oferta(s)` : undefined,
      color: 'success'
    })
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await refetch()
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo bloquear la empresa',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Try again',
      color: 'error'
    })
  } finally {
    blockingCompany.value = null
  }
}

async function copyEmail(email: string) {
  try {
    await navigator.clipboard.writeText(email)
    toast.add({ title: `Copiado: ${email}`, color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar', color: 'error' })
  }
}

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

const selectedIds = computed(() => Object.keys(rowSelection.value).filter(id => rowSelection.value[id]))

function onSelectAllIrrelevant() {
  const next: Record<string, boolean> = {}
  for (const job of jobsResponse.value?.data ?? []) {
    if (job.relevance === 'irrelevant') next[job.id] = true
  }
  rowSelection.value = next
}

async function onBulkDelete() {
  const ids = selectedIds.value
  if (ids.length === 0) return
  if (!confirm(`Delete ${ids.length} job(s)? This can't be undone.`)) return

  bulkDeleting.value = true
  try {
    const result = await api.bulkDeleteJobs(ids)
    toast.add({ title: `Deleted ${result.deleted} job(s)`, color: 'success' })
    rowSelection.value = {}
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await refetch()
  } catch (err: unknown) {
    toast.add({
      title: 'Could not delete selected jobs',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    bulkDeleting.value = false
  }
}

async function onScanRelevance() {
  scanningRelevance.value = true
  try {
    const result = await api.scanRelevance()
    toast.add({
      title: result.queued > 0 ? `Revisando ${result.queued} oferta(s)` : 'Nada que revisar',
      description: result.queued > 0 ? 'Esto corre en segundo plano, la tabla se actualizará sola en unos segundos.' : undefined,
      color: 'success'
    })
    if (result.queued > 0) {
      setTimeout(() => {
        void queryCache.invalidateQueries({ key: ['jobs'] })
        void refetch()
      }, 8000)
    }
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo iniciar la revisión',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    scanningRelevance.value = false
  }
}

const selectColumn = {
  id: 'select',
  header: ({ table }: { table: {
    getIsAllPageRowsSelected: () => boolean
    getIsSomePageRowsSelected: () => boolean
    toggleAllPageRowsSelected: (value: boolean) => void
  } }) =>
    h(UCheckbox, {
      'modelValue': table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
      'aria-label': 'Select all'
    }),
  cell: ({ row }: { row: {
    getIsSelected: () => boolean
    toggleSelected: (value: boolean) => void
  } }) =>
    h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'aria-label': 'Select row'
    })
}

const baseColumns = [
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }: { row: { original: { id: string, title: string, company: string | null, scraped_at: string } } }) => {
      return h('div', { class: 'min-w-0' }, [
        h('div', { class: 'flex items-center gap-1.5' }, [
          h(UTooltip, { text: row.original.title }, () => h(resolveComponent('NuxtLink'), {
            to: `/jobs/${row.original.id}`,
            class: 'block max-w-[190px] truncate font-medium text-highlighted hover:underline'
          }, () => row.original.title)),
          isRecentlyAdded(row.original.scraped_at)
            ? h(UBadge, { color: 'success', variant: 'subtle', size: 'sm', class: 'shrink-0' }, () => 'Nuevo')
            : null
        ]),
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
    id: 'role_category',
    header: 'Category',
    cell: ({ row }: { row: { original: { role_category: JobRoleCategory } } }) =>
      row.original.role_category === 'other'
        ? h('span', { class: 'text-muted' }, '—')
        : h(UBadge, {
            color: 'neutral',
            variant: 'subtle',
            size: 'sm',
            icon: ROLE_CATEGORY_ICONS[row.original.role_category]
          }, () => ROLE_CATEGORY_LABELS[row.original.role_category])
  },
  {
    id: 'relevance',
    header: 'Relevance',
    cell: ({ row }: { row: { original: { relevance: JobRelevance, relevance_reason: string | null } } }) => {
      if (row.original.relevance === 'relevant') return null
      const badge = RELEVANCE_BADGE[row.original.relevance]
      const content = h(UBadge, { color: badge.color, variant: 'subtle', size: 'sm' }, () => badge.label)
      return row.original.relevance_reason
        ? h(UTooltip, { text: row.original.relevance_reason }, () => content)
        : content
    }
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
    accessorKey: 'scraped_at',
    header: 'Agregado',
    cell: ({ row }: { row: { original: { scraped_at: string } } }) => {
      const text = formatRelativeDate(row.original.scraped_at)
      return h(UTooltip, { text: formatDate(row.original.scraped_at) }, () => h('span', { class: 'whitespace-nowrap' }, text))
    }
  },
  {
    id: 'email',
    header: 'Email',
    cell: ({ row }: { row: { original: { description: string | null } } }) => {
      const emails = extractEmails(row.original.description)
      if (emails.length === 0) {
        return h('span', { class: 'text-muted' }, '—')
      }
      return h(UTooltip, { text: emails.join(', ') }, () =>
        h('div', { class: 'flex items-center gap-1' }, [
          h(UButton, {
            'size': 'xs',
            'color': 'neutral',
            'variant': 'subtle',
            'icon': 'i-lucide-mail',
            'aria-label': `Copiar ${emails[0]}`,
            'onClick': () => copyEmail(emails[0] as string)
          }),
          emails.length > 1
            ? h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => `+${emails.length - 1}`)
            : null
        ]))
    }
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
    cell: ({ row }: { row: { original: { id: string, title: string, company: string | null } } }) =>
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
        auth.isAdmin && row.original.company
          ? h(UButton, {
              'size': 'xs',
              'color': 'warning',
              'variant': 'ghost',
              'icon': 'i-lucide-shield-ban',
              'loading': blockingCompany.value === row.original.company,
              'disabled': blockingCompany.value !== null,
              'aria-label': 'Bloquear empresa',
              'title': 'Bloquear empresa',
              'onClick': () => onBlockCompany(row.original)
            })
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

const columns = computed(() => (auth.isAdmin ? [selectColumn, ...baseColumns] : baseColumns))

async function onScrape() {
  scraping.value = true
  try {
    const result = await api.triggerScrape()
    toast.add({
      title: 'Ofertas actualizadas',
      description: `Enviadas ${result.sent} · insertadas ${result.ingest?.inserted ?? 0} · omitidas ${result.ingest?.skipped ?? 0}${result.filtered_out ? ` · filtradas ${result.filtered_out}` : ''}${result.ingest?.blocked ? ` · bloqueadas ${result.ingest.blocked}` : ''}`,
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
      <div class="flex items-center gap-2">
        <UButton
          v-if="auth.isAdmin"
          icon="i-lucide-sparkles"
          color="neutral"
          variant="subtle"
          :loading="scanningRelevance"
          @click="onScanRelevance"
        >
          Revisar relevancia
        </UButton>
        <UButton
          icon="i-lucide-refresh-cw"
          :loading="scraping"
          @click="onScrape"
        >
          Actualizar ofertas
        </UButton>
      </div>
    </div>

    <div class="space-y-2">
      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="filters.status"
          :items="statusItems"
          size="sm"
          class="w-full sm:w-36"
        />
        <USelectMenu
          v-model="filters.role_category"
          :items="roleCategoryItems"
          value-key="value"
          multiple
          placeholder="Category"
          size="sm"
          class="w-full sm:w-40"
        />
        <USelectMenu
          v-model="filters.work_mode"
          :items="workModeItems"
          value-key="value"
          multiple
          placeholder="Work mode"
          size="sm"
          class="w-full sm:w-40"
        />
        <USelect
          v-model="filters.relevance"
          :items="relevanceItems"
          size="sm"
          class="w-full sm:w-36"
        />

        <UPopover>
          <UChip
            :text="advancedActiveCount"
            :show="advancedActiveCount > 0"
            size="sm"
            color="primary"
          >
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-sliders-horizontal"
              trailing-icon="i-lucide-chevron-down"
            >
              More filters
            </UButton>
          </UChip>

          <template #content>
            <div class="w-72 space-y-3 p-4">
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

              <UFormField label="Agregado">
                <USelect
                  v-model="filters.added"
                  :items="addedItems"
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
          </template>
        </UPopover>

        <UButton
          v-if="activeFilterCount > 0"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-x"
          @click="clearFilters"
        >
          Limpiar
        </UButton>
      </div>

      <p class="text-xs text-muted tabular-nums">
        {{ jobsResponse?.total ?? 0 }} jobs{{ activeFilterCount > 0 ? ` · ${activeFilterCount} filtro${activeFilterCount > 1 ? 's' : ''} activo${activeFilterCount > 1 ? 's' : ''}` : '' }}
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Failed to load jobs"
      :actions="[{ label: 'Retry', onClick: () => { void refetch() } }]"
    />

    <div
      v-if="auth.isAdmin && selectedIds.length > 0"
      class="flex flex-wrap items-center gap-3 rounded-lg border border-default bg-elevated/50 px-3 py-2"
    >
      <p class="text-sm text-muted">
        {{ selectedIds.length }} selected
      </p>
      <UButton
        color="neutral"
        variant="subtle"
        size="xs"
        @click="onSelectAllIrrelevant"
      >
        Seleccionar no relacionados
      </UButton>
      <UButton
        color="error"
        variant="solid"
        size="xs"
        icon="i-lucide-trash-2"
        :loading="bulkDeleting"
        @click="onBulkDelete"
      >
        Eliminar seleccionados
      </UButton>
      <UButton
        color="neutral"
        variant="ghost"
        size="xs"
        @click="rowSelection = {}"
      >
        Clear
      </UButton>
    </div>

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        v-model:row-selection="rowSelection"
        :data="jobsResponse?.data ?? []"
        :columns="columns"
        :loading="isPending"
        :get-row-id="(row: Job) => row.id"
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

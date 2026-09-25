<script setup lang="ts">
import type { InterestStatus, Job, JobSource, ListJobsQuery, WorkMode } from '~/types/api'
import { h, resolveComponent } from 'vue'

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()

const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const ScoreBadge = resolveComponent('ScoreBadge')
const JobStatusControls = resolveComponent('JobStatusControls')

type OutcomeFilter = 'all' | 'pending' | 'rejected'

const filters = reactive({
  source: 'all' as JobSource | 'all',
  profile_id: 'all' as string | 'all',
  outcome: 'all' as OutcomeFilter,
  page: 1,
  limit: 20
})

const queryFilters = computed<ListJobsQuery>(() => ({
  source: filters.source === 'all' ? undefined : filters.source,
  profile_id: filters.profile_id === 'all' ? undefined : filters.profile_id,
  applied: true,
  rejected: filters.outcome === 'all' ? undefined : filters.outcome === 'rejected',
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

watch(() => [filters.source, filters.profile_id, filters.outcome, filters.limit], () => {
  filters.page = 1
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

const outcomeItems: { label: string, value: OutcomeFilter }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'En proceso', value: 'pending' },
  { label: 'Rechazadas', value: 'rejected' }
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

function onStatusUpdated(job: Job, result: { interest: InterestStatus | null, applied: boolean, rejected: boolean }) {
  job.user_interest = result.interest
  job.user_applied = result.applied
  job.user_rejected = result.rejected
  if (!result.applied) {
    void queryCache.invalidateQueries({ key: ['jobs'] })
    void refetch()
  }
}

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
    header: 'Score',
    cell: ({ row }: { row: { original: { analyses: { fit_score: number }[] } } }) =>
      h(ScoreBadge, { score: bestFitScore(row.original.analyses) })
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ row }: { row: { original: { location: string | null } } }) => row.original.location || '—'
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
    cell: ({ row }: { row: { original: { id: string, company: string | null } } }) =>
      h('div', { class: 'flex items-center justify-end gap-1' }, [
        h(UButton, {
          to: `/jobs/${row.original.id}`,
          size: 'xs',
          color: 'neutral',
          variant: 'subtle',
          icon: 'i-lucide-arrow-right'
        }, () => 'View'),
        row.original.company
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
          : null
      ])
  }
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Postulaciones
      </h1>
      <p class="text-sm text-muted">
        Ofertas a las que ya te postulaste
      </p>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
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

      <UFormField label="Resultado">
        <USelect
          v-model="filters.outcome"
          :items="outcomeItems"
          class="w-full"
        />
      </UFormField>
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="Failed to load applications"
      :actions="[{ label: 'Retry', onClick: () => { void refetch() } }]"
    />

    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <UTable
        :data="jobsResponse?.data ?? []"
        :columns="columns"
        :loading="isPending"
        :get-row-id="(row: Job) => row.id"
        class="w-full"
      />
    </UCard>

    <div
      v-if="!isPending && (jobsResponse?.data.length ?? 0) === 0"
      class="text-center text-sm text-muted py-8"
    >
      Todavía no marcaste ninguna oferta como postulada. Hazlo desde la lista de
      <NuxtLink
        to="/jobs"
        class="text-primary hover:underline"
      >
        Jobs
      </NuxtLink>.
    </div>

    <div class="flex items-center justify-between gap-3">
      <p class="text-sm text-muted">
        {{ jobsResponse?.total ?? 0 }} postulaciones
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

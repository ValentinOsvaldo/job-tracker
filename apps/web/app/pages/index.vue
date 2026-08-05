<script setup lang="ts">
import type { Job, SearchProfile } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const auth = useAuthStore()
const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const scraping = ref(false)

const { data: profiles, isPending: profilesPending } = useQuery({
  key: () => ['profiles'],
  query: () => api.profilesQuery.query()
})

const { data: trends, isPending: trendsPending, refetch: refetchTrends } = useQuery({
  key: () => ['trends', { days: 30, limit: 10 }],
  query: () => api.trendsQuery({ days: 30, limit: 10 }).query()
})

const activeProfiles = computed(() =>
  (profiles.value ?? []).filter(p => p.is_active)
)

const topByProfile = ref<Record<string, Job[]>>({})
const topLoading = ref(false)

async function loadTopJobs(list: SearchProfile[]) {
  if (!list.length) {
    topByProfile.value = {}
    return
  }

  topLoading.value = true
  try {
    const entries = await Promise.all(
      list.map(async (profile) => {
        const response = await api.jobsQuery({
          profile_id: profile.id,
          min_score: 0,
          added_within: 'week',
          sort_by: 'score',
          sort_dir: 'desc',
          limit: 5,
          page: 1
        }).query()

        return [profile.id, response.data] as const
      })
    )

    topByProfile.value = Object.fromEntries(entries)
  } finally {
    topLoading.value = false
  }
}

watch(
  activeProfiles,
  (list) => {
    loadTopJobs(list)
  },
  { immediate: true }
)

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
    await queryCache.invalidateQueries({ key: ['trends'] })
    await loadTopJobs(activeProfiles.value)
    await refetchTrends()
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
  <div class="space-y-8">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold text-highlighted">
          Dashboard
        </h1>
        <p class="text-sm text-muted">
          Welcome back{{ auth.user?.name ? `, ${auth.user.name}` : '' }}. Here are your best matches.
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

    <section class="space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-lg font-semibold text-highlighted">
          Top 5 by profile (this week)
        </h2>
        <UButton
          to="/jobs"
          color="neutral"
          variant="ghost"
          trailing-icon="i-lucide-arrow-right"
          size="sm"
        >
          All jobs
        </UButton>
      </div>

      <div
        v-if="profilesPending || topLoading"
        class="flex justify-center py-10"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="!activeProfiles.length"
        class="rounded-lg border border-dashed border-default p-8 text-center space-y-3"
      >
        <p class="text-muted">
          No active search profiles yet.
        </p>
        <UButton to="/profiles">
          Create a profile
        </UButton>
      </div>

      <div
        v-else
        class="grid gap-4 lg:grid-cols-2"
      >
        <TopProfileCard
          v-for="profile in activeProfiles"
          :key="profile.id"
          :profile="profile"
          :jobs="topByProfile[profile.id] ?? []"
        />
      </div>
    </section>

    <section class="space-y-4">
      <h2 class="text-lg font-semibold text-highlighted">
        Market trends
      </h2>

      <div
        v-if="trendsPending"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div
        v-else-if="trends"
        class="grid gap-4 md:grid-cols-3"
      >
        <UCard>
          <p class="text-xs text-muted">
            Jobs ({{ trends.period_days }}d)
          </p>
          <p class="text-2xl font-semibold text-highlighted mt-1">
            {{ trends.total_jobs }}
          </p>
          <p class="text-xs text-muted mt-1">
            {{ trends.jobs_with_description }} with description
          </p>
        </UCard>

        <UCard>
          <p class="text-xs text-muted mb-2">
            Top demanded skills
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="item in trends.top_demanded_skills.slice(0, 8)"
              :key="item.term"
              color="primary"
              variant="subtle"
              size="sm"
            >
              {{ item.term }} ({{ item.count }})
            </UBadge>
            <span
              v-if="!trends.top_demanded_skills.length"
              class="text-sm text-muted"
            >No data yet</span>
          </div>
        </UCard>

        <UCard>
          <p class="text-xs text-muted mb-2">
            AI insights
          </p>
          <p
            v-if="trends.ai_insights?.summary"
            class="text-sm text-default"
          >
            {{ trends.ai_insights.summary }}
          </p>
          <p
            v-else
            class="text-sm text-muted"
          >
            Insights will appear once enough jobs are analyzed.
          </p>
        </UCard>
      </div>
    </section>
  </div>
</template>

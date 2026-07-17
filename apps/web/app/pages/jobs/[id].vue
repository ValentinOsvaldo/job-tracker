<script setup lang="ts">
import type { JobInterestStatus } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const api = useApiClient()
const id = computed(() => String(route.params.id))

const { data: job, isPending, error, refetch } = useQuery({
  key: () => ['job', id.value],
  query: () => api.jobQuery(id.value).query()
})

const analyses = computed(() =>
  [...(job.value?.analyses ?? [])].sort((a, b) => b.fit_score - a.fit_score)
)

function onStatusUpdated(status: JobInterestStatus | null) {
  if (job.value) {
    job.value.user_status = status
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-2">
      <UButton
        to="/jobs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      >
        Back
      </UButton>
    </div>

    <div
      v-if="isPending"
      class="flex justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Failed to load job"
      :actions="[{ label: 'Retry', onClick: () => { void refetch() } }]"
    />

    <template v-else-if="job">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            color="neutral"
            variant="subtle"
            class="capitalize"
          >
            {{ job.source }}
          </UBadge>
          <UBadge
            v-if="job.job_type"
            color="neutral"
            variant="outline"
          >
            {{ job.job_type }}
          </UBadge>
          <ScoreBadge :score="bestFitScore(job.analyses)" />
        </div>

        <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted">
          {{ job.title }}
        </h1>
        <p class="text-muted">
          <span v-if="job.company">{{ job.company }}</span>
          <span v-if="job.company && job.location"> · </span>
          <span v-if="job.location">{{ job.location }}</span>
        </p>

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <UButton
            :to="job.url"
            target="_blank"
            icon="i-lucide-external-link"
          >
            Open original
          </UButton>
          <JobStatusControls
            :job-id="job.id"
            :status="job.user_status"
            size="sm"
            @updated="onStatusUpdated"
          />
          <span class="text-sm text-muted self-center">
            Salary:
            {{ formatSalary(job.salary_min, job.salary_max) }}
          </span>
        </div>
      </div>

      <UCard>
        <template #header>
          <h2 class="font-semibold text-highlighted">
            Description
          </h2>
        </template>
        <div class="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-default">
          {{ job.description || 'No description available.' }}
        </div>
      </UCard>

      <div class="space-y-3">
        <h2 class="text-lg font-semibold text-highlighted">
          Analyses
        </h2>
        <div
          v-if="!analyses.length"
          class="text-sm text-muted"
        >
          No analyses for your profiles yet.
        </div>
        <div
          v-else
          class="grid gap-4 lg:grid-cols-2"
        >
          <AnalysisCard
            v-for="analysis in analyses"
            :key="analysis.id"
            :analysis="analysis"
          />
        </div>
      </div>
    </template>
  </div>
</template>

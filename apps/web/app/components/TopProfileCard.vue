<script setup lang="ts">
import type { Job, SearchProfile } from '~/types/api'

defineProps<{
  profile: SearchProfile
  jobs: Job[]
}>()

function analysisFor(job: Job, profileId: string) {
  return job.analyses?.find(a => a.profile_id === profileId)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="font-semibold text-highlighted">
            {{ profile.name }}
          </h3>
          <p class="text-xs text-muted capitalize">
            {{ profile.role }} · Top 5 matches this week
          </p>
        </div>
        <UBadge
          :color="profile.is_active ? 'success' : 'neutral'"
          variant="subtle"
        >
          {{ profile.is_active ? 'Active' : 'Inactive' }}
        </UBadge>
      </div>
    </template>

    <div
      v-if="!jobs.length"
      class="text-sm text-muted py-4"
    >
      No analyzed jobs for this profile this week yet.
    </div>

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="job in jobs"
        :key="job.id"
        class="py-3 first:pt-0 last:pb-0"
      >
        <NuxtLink
          :to="`/jobs/${job.id}`"
          class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:opacity-80"
        >
          <div class="flex-1 min-w-0">
            <p class="font-medium text-highlighted truncate">
              {{ job.title }}
              <span
                v-if="job.company"
                class="text-muted font-normal"
              > @ {{ job.company }}</span>
            </p>
            <p class="text-xs text-muted truncate">
              {{ analysisFor(job, profile.id)?.matched_skills?.slice(0, 4).join(' · ') || job.location || job.source }}
            </p>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <ScoreBadge :score="analysisFor(job, profile.id)?.fit_score" />
            <span class="text-xs text-muted whitespace-nowrap">
              {{ formatSalary(
                analysisFor(job, profile.id)?.salary_min ?? job.salary_min,
                analysisFor(job, profile.id)?.salary_max ?? job.salary_max,
                analysisFor(job, profile.id)?.salary_is_inferred
              ) }}
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </UCard>
</template>

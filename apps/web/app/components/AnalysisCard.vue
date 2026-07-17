<script setup lang="ts">
import type { JobAnalysis } from '~/types/api'

defineProps<{
  analysis: JobAnalysis
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="font-medium text-highlighted">
            {{ analysis.profile?.name || 'Profile analysis' }}
          </p>
          <p
            v-if="analysis.profile"
            class="text-xs text-muted capitalize"
          >
            {{ analysis.profile.role }}
          </p>
        </div>
        <ScoreBadge :score="analysis.fit_score" />
      </div>
    </template>

    <div class="space-y-4 text-sm">
      <p class="text-default">
        {{ analysis.summary }}
      </p>

      <div>
        <p class="font-medium mb-1">
          Matched skills
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="skill in analysis.matched_skills"
            :key="skill"
            color="success"
            variant="subtle"
            size="sm"
          >
            {{ skill }}
          </UBadge>
          <span
            v-if="!analysis.matched_skills.length"
            class="text-muted"
          >None</span>
        </div>
      </div>

      <div>
        <p class="font-medium mb-1">
          Missing skills
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="skill in analysis.missing_skills"
            :key="skill"
            color="warning"
            variant="subtle"
            size="sm"
          >
            {{ skill }}
          </UBadge>
          <span
            v-if="!analysis.missing_skills.length"
            class="text-muted"
          >None</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-4 text-muted">
        <span>
          Salary:
          {{ formatSalary(analysis.salary_min, analysis.salary_max, analysis.salary_is_inferred) }}
          <UIcon
            v-if="analysis.salary_is_inferred"
            name="i-lucide-triangle-alert"
            class="inline size-3.5 ml-0.5"
          />
        </span>
      </div>

      <div v-if="analysis.benefits?.length">
        <p class="font-medium mb-1">
          Benefits
          <UIcon
            v-if="analysis.benefits_is_inferred"
            name="i-lucide-triangle-alert"
            class="inline size-3.5"
          />
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="benefit in analysis.benefits"
            :key="benefit"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ benefit }}
          </UBadge>
        </div>
      </div>
    </div>
  </UCard>
</template>

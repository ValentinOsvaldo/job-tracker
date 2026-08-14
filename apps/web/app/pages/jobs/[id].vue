<script setup lang="ts">
import type { InterestStatus, JobRoleCategory, TailoredResumeContent } from '~/types/api'

const ROLE_CATEGORY_LABELS: Record<JobRoleCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  mobile: 'Mobile',
  other: 'Otro'
}

// Neutral + icon (not color) — matches the jobs table convention, keeping
// success/warning reserved for their actual meaning elsewhere on the page.
const ROLE_CATEGORY_ICONS: Record<JobRoleCategory, string> = {
  frontend: 'i-lucide-layout-panel-left',
  backend: 'i-lucide-server',
  fullstack: 'i-lucide-layers',
  mobile: 'i-lucide-smartphone',
  other: 'i-lucide-circle-dashed'
}

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const api = useApiClient()
const toast = useToast()
const queryCache = useQueryCache()
const id = computed(() => String(route.params.id))

const { data: job, isPending, error, refetch } = useQuery({
  key: () => ['job', id.value],
  query: () => api.jobQuery(id.value).query()
})

const { data: profiles } = useQuery({
  key: () => ['profiles'],
  query: () => api.profilesQuery.query()
})

const activeProfiles = computed(() => (profiles.value ?? []).filter(p => p.is_active))

const { data: resumeProfile } = useQuery({
  key: () => ['resume-profile'],
  query: () => api.resumeProfileQuery.query()
})

const {
  data: tailoredResume,
  refetch: refetchTailoredResume
} = useQuery({
  key: () => ['tailor-resume', id.value],
  query: () => api.tailorResumeQuery(id.value).query()
})

const generatingResume = ref(false)

const generateResumeDisabledReason = computed(() => {
  if (!resumeProfile.value) return 'Completa tu perfil de CV en /resume-profile primero'
  if (!job.value?.user_applied) return 'Marca esta oferta como aplicada primero'
  return null
})

async function onGenerateTailoredResume() {
  generatingResume.value = true

  try {
    await api.generateTailoredResume(id.value)
    toast.add({ title: 'CV adaptado generado', color: 'success' })
    await refetchTailoredResume()
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo generar el CV adaptado',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Intenta de nuevo en unos segundos',
      color: 'error'
    })
  } finally {
    generatingResume.value = false
  }
}

function onTailoredResumeUpdated(content: TailoredResumeContent) {
  if (tailoredResume.value) {
    tailoredResume.value.generated_content = content
  }
}

const regeneratingSummary = ref(false)
const regeneratingProfileId = ref<string | null>(null)
const copyingPromptProfileId = ref<string | null>(null)
const manualAnalysisProfile = ref<{ id: string, name: string } | null>(null)
const manualAnalysisModalOpen = ref(false)

async function onRegenerateSummary() {
  regeneratingSummary.value = true

  try {
    const result = await api.regenerateJobSummary(id.value)
    if (job.value) {
      job.value.description_summary = result.description_summary
    }
    toast.add({ title: 'TLDR actualizado', color: 'success' })
  } catch {
    toast.add({
      title: 'No se pudo regenerar el TLDR',
      description: 'Intenta de nuevo en unos segundos',
      color: 'error'
    })
  } finally {
    regeneratingSummary.value = false
  }
}

async function onAnalyzeWithProfile(profileId: string, profileName: string) {
  regeneratingProfileId.value = profileId

  try {
    await api.regenerateJobAnalyses(id.value, profileId)
    toast.add({
      title: `Analizando como ${profileName}`,
      description: 'El resultado aparecerá en unos segundos.',
      color: 'success'
    })
    setTimeout(() => {
      void queryCache.invalidateQueries({ key: ['job', id.value] })
    }, 6000)
  } catch {
    toast.add({
      title: 'No se pudo iniciar el análisis',
      description: 'Intenta de nuevo en unos segundos',
      color: 'error'
    })
  } finally {
    regeneratingProfileId.value = null
  }
}

async function onCopyPrompt(profileId: string) {
  copyingPromptProfileId.value = profileId

  try {
    const { prompt } = await api.getAnalysisPrompt(id.value, profileId)
    await navigator.clipboard.writeText(prompt)
    toast.add({
      title: 'Prompt copiado',
      description: 'Pégalo en tu herramienta de chat y usa "Pegar resultado" para guardar la respuesta.',
      color: 'success'
    })
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo copiar el prompt',
      description: (err as { data?: { message?: string } })?.data?.message
        || 'Intenta de nuevo en unos segundos',
      color: 'error'
    })
  } finally {
    copyingPromptProfileId.value = null
  }
}

function onOpenManualAnalysis(profileId: string, profileName: string) {
  manualAnalysisProfile.value = { id: profileId, name: profileName }
  manualAnalysisModalOpen.value = true
}

function onManualAnalysisSaved() {
  void queryCache.invalidateQueries({ key: ['job', id.value] })
}

const analyses = computed(() =>
  [...(job.value?.analyses ?? [])].sort((a, b) => b.fit_score - a.fit_score)
)

const showFullDescription = ref(false)

const emails = computed(() => extractEmails(job.value?.description))

async function copyEmail(email: string) {
  try {
    await navigator.clipboard.writeText(email)
    toast.add({ title: `Copiado: ${email}`, color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo copiar', color: 'error' })
  }
}

const descriptionSummary = computed(() => {
  if (!job.value) return null
  if (job.value.description_summary) return job.value.description_summary
  const description = job.value.description
  if (!description) return null
  return description.length > 280 ? `${description.slice(0, 280)}…` : description
})

function onStatusUpdated(result: { interest: InterestStatus | null, applied: boolean, rejected: boolean }) {
  if (job.value) {
    job.value.user_interest = result.interest
    job.value.user_applied = result.applied
    job.value.user_rejected = result.rejected
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
          <UBadge
            v-if="job.role_category !== 'other'"
            color="neutral"
            variant="subtle"
            :icon="ROLE_CATEGORY_ICONS[job.role_category]"
          >
            {{ ROLE_CATEGORY_LABELS[job.role_category] }}
          </UBadge>
          <ScoreBadge :score="bestFitScore(job.analyses)" />
        </div>

        <div
          v-if="job.tech_keywords.length > 0"
          class="flex flex-wrap items-center gap-1.5 pt-1"
        >
          <UBadge
            v-for="tech in job.tech_keywords"
            :key="tech"
            color="neutral"
            variant="outline"
            size="sm"
          >
            {{ tech }}
          </UBadge>
        </div>

        <h1 class="text-2xl sm:text-3xl font-semibold text-highlighted">
          {{ job.title }}
        </h1>
        <p class="text-muted">
          <span v-if="job.company">{{ job.company }}</span>
          <span v-if="job.company && job.location"> · </span>
          <span v-if="job.location">{{ job.location }}</span>
          <span v-if="job.date_posted"> · Posted {{ formatDate(job.date_posted) }}</span>
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
            :interest="job.user_interest"
            :applied="job.user_applied"
            :rejected="job.user_rejected"
            size="sm"
            @updated="onStatusUpdated"
          />
          <UButton
            color="neutral"
            variant="subtle"
            icon="i-lucide-sparkles"
            :loading="regeneratingSummary"
            :disabled="regeneratingSummary"
            @click="onRegenerateSummary"
          >
            Regenerar TLDR
          </UButton>
          <UTooltip :text="generateResumeDisabledReason ?? undefined">
            <UButton
              icon="i-lucide-file-user"
              :loading="generatingResume"
              :disabled="generatingResume || !!generateResumeDisabledReason"
              @click="onGenerateTailoredResume"
            >
              Generar CV adaptado
            </UButton>
          </UTooltip>
          <span class="text-sm text-muted self-center">
            Salary:
            {{ formatSalary(job.salary_min, job.salary_max) }}
          </span>
        </div>

        <div
          v-if="emails.length > 0"
          class="flex flex-wrap items-center gap-2 pt-1"
        >
          <span class="text-xs text-muted">Contacto:</span>
          <div
            v-for="email in emails"
            :key="email"
            class="flex items-center gap-1 rounded-md border border-default bg-elevated pl-2 pr-1 py-0.5"
          >
            <a
              :href="`mailto:${email}`"
              class="text-xs text-highlighted hover:underline"
            >{{ email }}</a>
            <UButton
              icon="i-lucide-copy"
              size="2xs"
              color="neutral"
              variant="ghost"
              :aria-label="`Copiar ${email}`"
              :title="`Copiar ${email}`"
              @click="copyEmail(email)"
            />
          </div>
        </div>

        <div
          v-if="activeProfiles.length > 0"
          class="flex flex-wrap items-center gap-2 pt-1"
        >
          <span class="text-xs text-muted">Analizar como:</span>
          <div
            v-for="profile in activeProfiles"
            :key="profile.id"
            class="inline-flex items-center rounded-md border border-default overflow-hidden"
          >
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-sparkles"
              class="rounded-none border-0"
              :loading="regeneratingProfileId === profile.id"
              :disabled="regeneratingProfileId !== null"
              @click="onAnalyzeWithProfile(profile.id, profile.name)"
            >
              {{ profile.name }}
            </UButton>
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-clipboard-copy"
              class="rounded-none border-0 border-l border-default"
              :loading="copyingPromptProfileId === profile.id"
              :disabled="copyingPromptProfileId !== null"
              :aria-label="`Copiar prompt para ${profile.name}`"
              :title="`Copiar prompt para ${profile.name}`"
              @click="onCopyPrompt(profile.id)"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="i-lucide-clipboard-paste"
              class="rounded-none border-0 border-l border-default"
              :aria-label="`Pegar resultado manual para ${profile.name}`"
              :title="`Pegar resultado manual para ${profile.name}`"
              @click="onOpenManualAnalysis(profile.id, profile.name)"
            />
          </div>
        </div>
      </div>

      <ManualAnalysisModal
        v-if="manualAnalysisProfile"
        v-model:open="manualAnalysisModalOpen"
        :job-id="id"
        :profile-id="manualAnalysisProfile.id"
        :profile-name="manualAnalysisProfile.name"
        @saved="onManualAnalysisSaved"
      />

      <div class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
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
            class="space-y-4"
          >
            <AnalysisCard
              v-for="analysis in analyses"
              :key="analysis.id"
              :analysis="analysis"
            />
          </div>
        </div>

        <UCard>
          <template #header>
            <h2 class="font-semibold text-highlighted">
              Description
            </h2>
          </template>

          <div
            v-if="!job.description"
            class="text-sm text-muted"
          >
            No description available.
          </div>
          <template v-else-if="!showFullDescription">
            <p class="text-sm text-default whitespace-pre-wrap">
              {{ descriptionSummary }}
            </p>
            <UButton
              class="mt-3"
              size="sm"
              color="neutral"
              variant="subtle"
              @click="showFullDescription = true"
            >
              Ver más
            </UButton>
          </template>
          <template v-else>
            <MarkdownContent :content="job.description" />
            <UButton
              class="mt-3"
              size="sm"
              color="neutral"
              variant="subtle"
              @click="showFullDescription = false"
            >
              Ver menos
            </UButton>
          </template>
        </UCard>
      </div>

      <TailoredResumeResult
        v-if="tailoredResume"
        :job-id="job.id"
        :resume="tailoredResume.generated_content"
        @updated="onTailoredResumeUpdated"
      />
    </template>
  </div>
</template>

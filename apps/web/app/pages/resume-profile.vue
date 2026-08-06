<script setup lang="ts">
import type { UpsertResumeProfileInput } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()

const { data: profile, isPending, error } = useQuery({
  key: () => ['resume-profile'],
  query: () => api.resumeProfileQuery.query()
})

function emptyState(): UpsertResumeProfileInput {
  return {
    personal_info: {
      full_name: '',
      headline: null,
      email: '',
      phone: null,
      location: null,
      links: []
    },
    summary: {},
    skills: [],
    experience: [],
    skill_evidence: [],
    projects: [],
    education: null
  }
}

const state = reactive<UpsertResumeProfileInput>(emptyState())
const hydrated = ref(false)

watch(profile, (value) => {
  if (!value) return
  Object.assign(state, {
    personal_info: value.personal_info,
    summary: value.summary,
    skills: value.skills,
    experience: value.experience,
    skill_evidence: value.skill_evidence,
    projects: value.projects,
    education: value.education
  })
  hydrated.value = true
}, { immediate: true })

const saving = ref(false)

async function onSave() {
  saving.value = true
  try {
    await api.updateResumeProfile(state)
    toast.add({ title: 'Perfil de CV guardado', color: 'success' })
    await queryCache.invalidateQueries({ key: ['resume-profile'] })
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo guardar el perfil',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Revisa que todos los campos requeridos estén completos',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-3xl">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Perfil de CV
      </h1>
      <p class="text-sm text-muted">
        Tu experiencia, skills y proyectos reales. Se usa para generar CVs adaptados por vacante — la IA
        nunca inventa nada que no esté acá. Distinto del <NuxtLink
          to="/cv"
          class="text-primary hover:underline"
        >CV en texto</NuxtLink> usado para el scoring y el ATS check.
      </p>
    </div>

    <div
      v-if="isPending"
      class="flex justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <UAlert
      v-if="error"
      color="error"
      title="No se pudo cargar tu perfil de CV"
    />

    <template v-else-if="!isPending">
      <UAlert
        v-if="!profile"
        color="neutral"
        variant="subtle"
        title="Todavía no tienes un perfil de CV"
        description="Completa las secciones de abajo y guarda para poder generar CVs adaptados por vacante."
      />

      <ResumeProfilePersonalInfoSection v-model="state.personal_info" />
      <ResumeProfileSummarySection v-model="state.summary" />
      <ResumeProfileSkillsSection v-model="state.skills" />
      <ResumeProfileExperienceSection v-model="state.experience" />
      <ResumeProfileSkillEvidenceSection v-model="state.skill_evidence" />
      <ResumeProfileProjectsSection v-model="state.projects" />
      <ResumeProfileEducationSection v-model="state.education" />

      <div class="flex justify-end">
        <UButton
          icon="i-lucide-save"
          :loading="saving"
          @click="onSave"
        >
          Guardar perfil
        </UButton>
      </div>
    </template>
  </div>
</template>

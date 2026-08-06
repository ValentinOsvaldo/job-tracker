<script setup lang="ts">
import type { TailoredResumeContent } from '~/types/api'

const props = defineProps<{
  jobId: string
  resume: TailoredResumeContent
}>()

const emit = defineEmits<{
  updated: [TailoredResumeContent]
}>()

const toast = useToast()
const api = useApiClient()

const local = ref<TailoredResumeContent>(structuredClone(toRaw(props.resume)))

watch(() => props.resume, (value) => {
  local.value = structuredClone(toRaw(value))
})

const validating = ref(false)
const downloading = ref(false)

async function onRevalidate() {
  validating.value = true
  try {
    const result = await api.validateTailoredResume(props.jobId, local.value)
    local.value = result.generated_content
    emit('updated', result.generated_content)
    toast.add({ title: 'Revisión actualizada', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo revisar',
      description: (err as { statusMessage?: string })?.statusMessage || 'Intenta de nuevo',
      color: 'error'
    })
  } finally {
    validating.value = false
  }
}

async function onDownloadPdf() {
  downloading.value = true
  try {
    const buffer = await api.downloadTailoredResumePdf(props.jobId)
    const blob = new Blob([buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `cv-${props.jobId}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.add({ title: 'No se pudo descargar el PDF', color: 'error' })
  } finally {
    downloading.value = false
  }
}

const reviewCount = computed(() =>
  local.value.experience.reduce(
    (sum, entry) => sum + entry.bullets.filter(b => b.needs_review).length,
    0
  )
)
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="font-semibold text-highlighted">
            CV adaptado
          </h2>
          <p
            v-if="reviewCount > 0"
            class="text-xs text-warning mt-0.5"
          >
            {{ reviewCount }} bullet(s) marcados para revisar
          </p>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-check-check"
            size="xs"
            color="neutral"
            variant="subtle"
            :loading="validating"
            @click="onRevalidate"
          >
            Re-validar
          </UButton>
          <UButton
            icon="i-lucide-download"
            size="xs"
            :loading="downloading"
            @click="onDownloadPdf"
          >
            Descargar PDF
          </UButton>
        </div>
      </div>
    </template>

    <div class="space-y-5">
      <div>
        <p class="text-xs text-muted mb-1">
          Resumen
        </p>
        <UTextarea
          v-model="local.summary"
          :rows="3"
          class="w-full"
        />
      </div>

      <div
        v-for="(entry, entryIndex) in local.experience"
        :key="entryIndex"
        class="space-y-2"
      >
        <p class="text-sm font-medium text-highlighted">
          {{ entry.role }} · {{ entry.company }}
          <span class="text-xs text-muted font-normal">({{ entry.period }})</span>
        </p>
        <div
          v-for="bullet in entry.bullets"
          :key="bullet.id"
          class="rounded-md px-2 py-1"
          :class="bullet.needs_review ? 'bg-warning/10 border border-warning/40' : ''"
        >
          <UTextarea
            v-model="bullet.text"
            :rows="2"
            class="w-full"
            :ui="bullet.needs_review ? { base: 'ring-warning' } : undefined"
          />
          <p
            v-if="bullet.needs_review"
            class="text-xs text-warning mt-1"
          >
            Revisar: el texto se alejó bastante del bullet/hecho original.
          </p>
        </div>
      </div>

      <div v-if="local.skills.length > 0">
        <p class="text-xs text-muted mb-1">
          Skills
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="skill in local.skills"
            :key="skill.name"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ skill.name }}
          </UBadge>
        </div>
      </div>

      <div
        v-if="local.projects.length > 0"
        class="space-y-1"
      >
        <p class="text-xs text-muted mb-1">
          Proyectos
        </p>
        <p
          v-for="project in local.projects"
          :key="project.id"
          class="text-sm"
        >
          <span class="font-medium text-highlighted">{{ project.name }}:</span>
          {{ project.description }}
        </p>
      </div>
    </div>
  </UCard>
</template>

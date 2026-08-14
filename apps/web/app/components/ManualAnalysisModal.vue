<script setup lang="ts">
const props = defineProps<{
  open: boolean
  jobId: string
  profileId: string
  profileName: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'saved': []
}>()

const api = useApiClient()
const toast = useToast()

const raw = ref('')
const saving = ref(false)

watch(() => props.open, (open) => {
  if (open) raw.value = ''
})

async function onSubmit() {
  if (!raw.value.trim()) return

  saving.value = true

  try {
    await api.saveManualAnalysis(props.jobId, props.profileId, raw.value)
    toast.add({ title: 'Análisis guardado', color: 'success' })
    emit('saved')
    emit('update:open', false)
  } catch (err: unknown) {
    toast.add({
      title: 'No se pudo guardar el análisis',
      description: (err as { data?: { message?: string } })?.data?.message
        || 'Revisa que el JSON pegado sea la respuesta completa del prompt',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    :open="open"
    :title="`Pegar resultado manual — ${profileName}`"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-muted">
          Copia el prompt con el ícono de al lado, pégalo en tu herramienta de chat de preferencia,
          y pega aquí la respuesta completa (el JSON tal cual la devuelva).
        </p>
        <UTextarea
          v-model="raw"
          class="w-full font-mono text-xs"
          :rows="12"
          placeholder='{"fit_score": 8.5, "matched_skills": [...], ...}'
        />
        <div class="flex justify-end gap-2 pt-1">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="saving"
            @click="emit('update:open', false)"
          >
            Cancelar
          </UButton>
          <UButton
            :loading="saving"
            :disabled="saving || !raw.trim()"
            @click="onSubmit"
          >
            Guardar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

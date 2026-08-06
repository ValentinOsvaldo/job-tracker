<script setup lang="ts">
import type { Education } from '~/types/api'

const model = defineModel<Education[] | null>({ required: true })

function enableEducation() {
  model.value = []
}

function disableEducation() {
  model.value = null
}

function addEntry() {
  if (!model.value) return
  model.value.push({ institution: '', degree: '', period: null, location: null })
}

function removeEntry(index: number) {
  model.value?.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold text-highlighted">
          Educación
        </h2>
        <p class="text-xs text-muted">
          Opcional — si no la agregás, nunca se inventa en el CV generado.
        </p>
      </div>
    </template>

    <div v-if="model === null">
      <p class="text-sm text-muted mb-3">
        No agregaste educación a tu perfil.
      </p>
      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="enableEducation"
      >
        Agregar educación
      </UButton>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div
        v-for="(entry, index) in model"
        :key="index"
        class="grid gap-2 sm:grid-cols-2 rounded-lg border border-default p-3"
      >
        <UInput
          v-model="entry.institution"
          placeholder="Institución"
        />
        <UInput
          v-model="entry.degree"
          placeholder="Título/grado"
        />
        <UInput
          v-model="entry.period"
          placeholder="Periodo (opcional)"
        />
        <div class="flex items-center gap-2">
          <UInput
            v-model="entry.location"
            placeholder="Ubicación (opcional)"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Quitar"
            @click="removeEntry(index)"
          />
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          size="xs"
          color="neutral"
          variant="subtle"
          @click="addEntry"
        >
          Agregar entrada
        </UButton>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          @click="disableEducation"
        >
          Quitar sección de educación
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { EvidenceConfidence, SkillEvidenceItem } from '~/types/api'

const model = defineModel<SkillEvidenceItem[]>({ required: true })

const confidenceItems: { label: string, value: EvidenceConfidence }[] = [
  { label: 'Baja', value: 'low' },
  { label: 'Media', value: 'medium' },
  { label: 'Alta', value: 'high' }
]

function addEvidence() {
  model.value.push({
    id: crypto.randomUUID(),
    context: '',
    raw_fact: '',
    impact: null,
    confidence: 'medium'
  })
}

function removeEvidence(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Evidencia de skills
      </h2>
      <p class="text-xs text-muted mt-0.5">
        Hechos sueltos que todavía no convertiste en un bullet de experiencia. La IA nunca convierte
        evidencia de confianza "baja" en un logro.
      </p>
    </template>

    <div class="space-y-4">
      <div
        v-for="(evidence, index) in model"
        :key="evidence.id"
        class="space-y-2 rounded-lg border border-default p-3"
      >
        <div class="flex items-center gap-2">
          <UInput
            v-model="evidence.context"
            placeholder="Contexto (e.g. Optimización de performance en Acme)"
            class="flex-1"
          />
          <USelect
            v-model="evidence.confidence"
            :items="confidenceItems"
            class="w-32"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Quitar evidencia"
            @click="removeEvidence(index)"
          />
        </div>
        <UTextarea
          v-model="evidence.raw_fact"
          :rows="2"
          class="w-full"
          placeholder="El hecho concreto (sin exagerar)"
        />
        <UInput
          v-model="evidence.impact"
          placeholder="Impacto medible (opcional)"
          class="w-full"
        />
      </div>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addEvidence"
      >
        Agregar hecho
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { SummaryVariants } from '~/types/api'

const model = defineModel<SummaryVariants>({ required: true })

const pairs = computed({
  get: () => Object.entries(model.value),
  set: (next: [string, string][]) => {
    model.value = Object.fromEntries(next)
  }
})

function updateKey(index: number, key: string) {
  const next = [...pairs.value]
  next[index] = [key, next[index]?.[1] ?? '']
  pairs.value = next
}

function updateText(index: number, text: string) {
  const next = [...pairs.value]
  next[index] = [next[index]?.[0] ?? '', text]
  pairs.value = next
}

function addVariant() {
  pairs.value = [...pairs.value, ['', '']]
}

function removeVariant(index: number) {
  pairs.value = pairs.value.filter((_, i) => i !== index)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Resumen (variantes)
      </h2>
      <p class="text-xs text-muted mt-0.5">
        Define una o más variantes; la IA elige la más adecuada según cada vacante.
      </p>
    </template>

    <div class="space-y-4">
      <div
        v-for="([key, text], index) in pairs"
        :key="index"
        class="space-y-1.5 rounded-lg border border-default p-3"
      >
        <div class="flex items-center gap-2">
          <UInput
            :model-value="key"
            placeholder="e.g. frontend_heavy"
            class="w-48"
            @update:model-value="(v) => updateKey(index, String(v))"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            class="ml-auto"
            aria-label="Quitar variante"
            @click="removeVariant(index)"
          />
        </div>
        <UTextarea
          :model-value="text"
          :rows="3"
          class="w-full"
          placeholder="Texto del resumen para esta variante"
          @update:model-value="(v) => updateText(index, String(v))"
        />
      </div>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addVariant"
      >
        Agregar variante
      </UButton>
    </div>
  </UCard>
</template>

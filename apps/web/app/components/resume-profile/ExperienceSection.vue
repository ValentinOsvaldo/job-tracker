<script setup lang="ts">
import type { ExperienceEntry } from '~/types/api'

const model = defineModel<ExperienceEntry[]>({ required: true })

function tagsText(tags: string[]) {
  return tags.join(', ')
}

function setTags(target: { tags: string[] }, text: string) {
  target.tags = text.split(',').map(t => t.trim()).filter(Boolean)
}

function addEntry() {
  model.value.push({
    company: '',
    role: '',
    period: '',
    location: null,
    bullets: []
  })
}

function removeEntry(index: number) {
  model.value.splice(index, 1)
}

function addBullet(entry: ExperienceEntry) {
  entry.bullets.push({ id: crypto.randomUUID(), text: '', tags: [] })
}

function removeBullet(entry: ExperienceEntry, index: number) {
  entry.bullets.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Experiencia
      </h2>
    </template>

    <div class="space-y-4">
      <div
        v-for="(entry, index) in model"
        :key="index"
        class="space-y-3 rounded-lg border border-default p-3"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="grid gap-2 sm:grid-cols-2 flex-1">
            <UInput
              v-model="entry.company"
              placeholder="Empresa"
            />
            <UInput
              v-model="entry.role"
              placeholder="Rol"
            />
            <UInput
              v-model="entry.period"
              placeholder="e.g. 2022 - Presente"
            />
            <UInput
              v-model="entry.location"
              placeholder="Ubicación (opcional)"
            />
          </div>
          <UButton
            icon="i-lucide-trash-2"
            size="xs"
            color="error"
            variant="ghost"
            aria-label="Quitar experiencia"
            @click="removeEntry(index)"
          />
        </div>

        <div class="space-y-2 border-t border-default pt-3">
          <p class="text-xs text-muted">
            Bullets
          </p>
          <div
            v-for="(bullet, bulletIndex) in entry.bullets"
            :key="bullet.id"
            class="flex items-start gap-2"
          >
            <div class="flex-1 space-y-1">
              <UTextarea
                v-model="bullet.text"
                :rows="2"
                class="w-full"
                placeholder="Texto del bullet"
              />
              <UInput
                :model-value="tagsText(bullet.tags)"
                placeholder="tags separados por coma"
                size="sm"
                class="w-full"
                @update:model-value="(v) => setTags(bullet, String(v))"
              />
            </div>
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="ghost"
              aria-label="Quitar bullet"
              @click="removeBullet(entry, bulletIndex)"
            />
          </div>
          <UButton
            icon="i-lucide-plus"
            size="xs"
            color="neutral"
            variant="subtle"
            @click="addBullet(entry)"
          >
            Agregar bullet
          </UButton>
        </div>
      </div>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addEntry"
      >
        Agregar experiencia
      </UButton>
    </div>
  </UCard>
</template>

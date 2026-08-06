<script setup lang="ts">
import type { Project } from '~/types/api'

const model = defineModel<Project[]>({ required: true })

function tagsText(project: Project) {
  return project.tags.join(', ')
}

function setTags(project: Project, text: string) {
  project.tags = text.split(',').map(t => t.trim()).filter(Boolean)
}

function addProject() {
  model.value.push({
    id: crypto.randomUUID(),
    name: '',
    description: '',
    tags: [],
    url: null
  })
}

function removeProject(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Proyectos
      </h2>
    </template>

    <div class="space-y-4">
      <div
        v-for="(project, index) in model"
        :key="project.id"
        class="space-y-2 rounded-lg border border-default p-3"
      >
        <div class="flex items-center gap-2">
          <UInput
            v-model="project.name"
            placeholder="Nombre"
            class="flex-1"
          />
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="neutral"
            variant="ghost"
            aria-label="Quitar proyecto"
            @click="removeProject(index)"
          />
        </div>
        <UTextarea
          v-model="project.description"
          :rows="2"
          class="w-full"
          placeholder="Descripción"
        />
        <div class="flex items-center gap-2">
          <UInput
            :model-value="tagsText(project)"
            placeholder="tags separados por coma"
            class="flex-1"
            @update:model-value="(v) => setTags(project, String(v))"
          />
          <UInput
            v-model="project.url"
            placeholder="URL (opcional)"
            class="flex-1"
          />
        </div>
      </div>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addProject"
      >
        Agregar proyecto
      </UButton>
    </div>
  </UCard>
</template>

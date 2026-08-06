<script setup lang="ts">
import type { Skill, SkillLevel } from '~/types/api'

const model = defineModel<Skill[]>({ required: true })

const levelItems: { label: string, value: SkillLevel }[] = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Expert', value: 'expert' }
]

function tagsText(skill: Skill) {
  return skill.tags.join(', ')
}

function setTags(skill: Skill, text: string) {
  skill.tags = text.split(',').map(t => t.trim()).filter(Boolean)
}

function addSkill() {
  model.value.push({ name: '', tags: [], level: 'intermediate' })
}

function removeSkill(index: number) {
  model.value.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Skills
      </h2>
    </template>

    <div class="space-y-2">
      <div
        v-for="(skill, index) in model"
        :key="index"
        class="flex flex-wrap items-center gap-2"
      >
        <UInput
          v-model="skill.name"
          placeholder="e.g. TypeScript"
          class="w-40"
        />
        <UInput
          :model-value="tagsText(skill)"
          placeholder="tags separados por coma"
          class="flex-1 min-w-[160px]"
          @update:model-value="(v) => setTags(skill, String(v))"
        />
        <USelect
          v-model="skill.level"
          :items="levelItems"
          class="w-36"
        />
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Quitar skill"
          @click="removeSkill(index)"
        />
      </div>

      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addSkill"
      >
        Agregar skill
      </UButton>
    </div>
  </UCard>
</template>

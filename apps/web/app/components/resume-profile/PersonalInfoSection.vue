<script setup lang="ts">
import type { PersonalInfo } from '~/types/api'

const model = defineModel<PersonalInfo>({ required: true })

function addLink() {
  model.value.links.push({ label: '', url: '' })
}

function removeLink(index: number) {
  model.value.links.splice(index, 1)
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold text-highlighted">
        Datos personales
      </h2>
    </template>

    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Nombre completo">
        <UInput
          v-model="model.full_name"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Título/headline">
        <UInput
          v-model="model.headline"
          placeholder="e.g. Senior Frontend Developer"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Email">
        <UInput
          v-model="model.email"
          type="email"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Teléfono">
        <UInput
          v-model="model.phone"
          class="w-full"
        />
      </UFormField>
      <UFormField
        label="Ubicación"
        class="sm:col-span-2"
      >
        <UInput
          v-model="model.location"
          placeholder="e.g. Ciudad de México, MX"
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="mt-4 space-y-2">
      <p class="text-xs text-muted">
        Links (GitHub, LinkedIn, portafolio...)
      </p>
      <div
        v-for="(link, index) in model.links"
        :key="index"
        class="flex items-center gap-2"
      >
        <UInput
          v-model="link.label"
          placeholder="Label"
          class="w-32"
        />
        <UInput
          v-model="link.url"
          placeholder="https://..."
          class="flex-1"
        />
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="neutral"
          variant="ghost"
          aria-label="Quitar link"
          @click="removeLink(index)"
        />
      </div>
      <UButton
        icon="i-lucide-plus"
        size="xs"
        color="neutral"
        variant="subtle"
        @click="addLink"
      >
        Agregar link
      </UButton>
    </div>
  </UCard>
</template>

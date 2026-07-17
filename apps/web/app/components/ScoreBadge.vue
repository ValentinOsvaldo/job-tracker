<script setup lang="ts">
const props = defineProps<{
  score: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
}>()

const color = computed(() => scoreColor(props.score))
const label = computed(() => props.score == null ? '—' : props.score.toFixed(1))
</script>

<template>
  <UBadge
    :color="color"
    variant="subtle"
    :size="size ?? 'md'"
  >
    {{ label }}
  </UBadge>
</template>

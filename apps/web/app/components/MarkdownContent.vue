<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

const props = defineProps<{
  content: string
}>()

const html = computed(() => DOMPurify.sanitize(marked.parse(props.content, { async: false }) as string))
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none"
    v-html="html"
  />
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'Offline · Job Tracker'
})

function retry() {
  window.location.reload()
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4 bg-default">
    <UIcon
      name="i-lucide-wifi-off"
      class="size-10 text-muted"
    />
    <div class="space-y-1">
      <h1 class="text-xl font-semibold text-highlighted">
        You're offline
      </h1>
      <p class="text-sm text-muted max-w-sm">
        Job Tracker needs a connection to load your jobs and profiles. Reconnect and try again.
      </p>
    </div>
    <UButton
      icon="i-lucide-refresh-cw"
      color="neutral"
      variant="subtle"
      @click="retry"
    >
      Retry
    </UButton>
  </div>
</template>

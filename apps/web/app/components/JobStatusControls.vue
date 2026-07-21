<script setup lang="ts">
import type { JobInterestStatus } from '~/types/api'

const props = defineProps<{
  jobId: string
  status: JobInterestStatus | null | undefined
  size?: 'xs' | 'sm' | 'md'
}>()

const emit = defineEmits<{
  updated: [status: JobInterestStatus | null]
}>()

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const pending = ref<JobInterestStatus | 'clear' | null>(null)

const interestOptions: {
  value: JobInterestStatus
  label: string
  icon: string
  color: 'success' | 'error' | 'primary' | 'warning'
}[] = [
  { value: 'liked', label: 'Like', icon: 'i-lucide-thumbs-up', color: 'success' },
  { value: 'disliked', label: 'Dislike', icon: 'i-lucide-thumbs-down', color: 'error' }
]

const pipelineOptions: typeof interestOptions = [
  { value: 'applied', label: 'Applied', icon: 'i-lucide-send', color: 'primary' },
  { value: 'rejected', label: 'Rejected', icon: 'i-lucide-x', color: 'warning' }
]

async function setStatus(next: JobInterestStatus | null) {
  const current = props.status ?? null
  const target = current === next ? null : next
  pending.value = target ?? 'clear'

  try {
    const result = await api.updateJobStatus(props.jobId, target)
    emit('updated', result.status)
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await queryCache.invalidateQueries({ key: ['job', props.jobId] })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not update status',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    pending.value = null
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-1.5">
    <div class="flex items-center gap-1">
      <UButton
        v-for="opt in interestOptions"
        :key="opt.value"
        :icon="opt.icon"
        :size="size ?? 'xs'"
        :color="status === opt.value ? opt.color : 'neutral'"
        :variant="status === opt.value ? 'solid' : 'subtle'"
        :loading="pending === opt.value || (pending === 'clear' && status === opt.value)"
        :disabled="pending !== null"
        :aria-label="opt.label"
        :title="opt.label"
        @click="setStatus(opt.value)"
      />
    </div>
    <div class="h-4 w-px shrink-0 bg-default" />
    <div class="flex items-center gap-1">
      <UButton
        v-for="opt in pipelineOptions"
        :key="opt.value"
        :icon="opt.icon"
        :size="size ?? 'xs'"
        :color="status === opt.value ? opt.color : 'neutral'"
        :variant="status === opt.value ? 'solid' : 'subtle'"
        :loading="pending === opt.value || (pending === 'clear' && status === opt.value)"
        :disabled="pending !== null"
        :aria-label="opt.label"
        :title="opt.label"
        @click="setStatus(opt.value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { InterestStatus } from '~/types/api'

const props = defineProps<{
  jobId: string
  interest: InterestStatus | null | undefined
  applied: boolean | undefined
  rejected: boolean | undefined
  size?: 'xs' | 'sm' | 'md'
}>()

const emit = defineEmits<{
  updated: [result: { interest: InterestStatus | null, applied: boolean, rejected: boolean }]
}>()

const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()
const pending = ref(false)

const interestOptions: {
  value: InterestStatus
  label: string
  icon: string
  color: 'success' | 'error'
}[] = [
  { value: 'liked', label: 'Like', icon: 'i-lucide-thumbs-up', color: 'success' },
  { value: 'disliked', label: 'Dislike', icon: 'i-lucide-thumbs-down', color: 'error' }
]

const pipelineOptions: {
  key: 'applied' | 'rejected'
  label: string
  icon: string
  color: 'primary' | 'warning'
}[] = [
  { key: 'applied', label: 'Applied', icon: 'i-lucide-send', color: 'primary' },
  { key: 'rejected', label: 'Rejected', icon: 'i-lucide-x', color: 'warning' }
]

async function applyPatch(patch: { interest?: InterestStatus | null, applied?: boolean, rejected?: boolean }) {
  pending.value = true

  try {
    const result = await api.updateJobStatus(props.jobId, patch)
    emit('updated', { interest: result.interest, applied: result.applied, rejected: result.rejected })
    await queryCache.invalidateQueries({ key: ['jobs'] })
    await queryCache.invalidateQueries({ key: ['job', props.jobId] })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not update status',
      description: (err as { statusMessage?: string })?.statusMessage || 'Try again',
      color: 'error'
    })
  } finally {
    pending.value = false
  }
}

function setInterest(next: InterestStatus) {
  const target = props.interest === next ? null : next
  applyPatch({ interest: target })
}

function togglePipeline(key: 'applied' | 'rejected') {
  const current = key === 'applied' ? props.applied : props.rejected
  applyPatch({ [key]: !current })
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
        :color="interest === opt.value ? opt.color : 'neutral'"
        :variant="interest === opt.value ? 'solid' : 'subtle'"
        :disabled="pending"
        :aria-label="opt.label"
        :title="opt.label"
        @click="setInterest(opt.value)"
      />
    </div>
    <div class="h-4 w-px shrink-0 bg-default" />
    <div class="flex items-center gap-1">
      <UButton
        v-for="opt in pipelineOptions"
        :key="opt.key"
        :icon="opt.icon"
        :size="size ?? 'xs'"
        :color="(opt.key === 'applied' ? applied : rejected) ? opt.color : 'neutral'"
        :variant="(opt.key === 'applied' ? applied : rejected) ? 'solid' : 'subtle'"
        :disabled="pending"
        :aria-label="opt.label"
        :title="opt.label"
        @click="togglePipeline(opt.key)"
      />
    </div>
  </div>
</template>

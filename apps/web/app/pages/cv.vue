<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const auth = useAuthStore()
const toast = useToast()
const queryCache = useQueryCache()
const api = useApiClient()

const { data: me, isPending, refetch } = useQuery({
  key: () => ['me'],
  query: () => api.meQuery.query()
})

const file = ref<File | null>(null)
const uploading = ref(false)

const selectedFile = computed(() => file.value)

const cvRefresh = ref(false)

const {
  data: cvAnalysis,
  isPending: analysisPending,
  error: analysisError,
  refetch: refetchAnalysis
} = useQuery({
  key: () => ['cv-analysis', cvRefresh.value],
  query: () => api.cvAnalysisQuery(cvRefresh.value).query(),
  enabled: () => !!me.value?.cv_filename
})

async function onRefreshAnalysis() {
  cvRefresh.value = true
  await refetchAnalysis()
  cvRefresh.value = false
}

async function onUpload() {
  const userId = me.value?.id || auth.user?.id
  if (!userId || !selectedFile.value) return

  uploading.value = true
  try {
    const result = await api.uploadCv(userId, selectedFile.value)
    toast.add({
      title: 'CV uploaded',
      description: `${result.filename} · ${result.characters_extracted} characters`,
      color: 'success'
    })
    file.value = null
    await queryCache.invalidateQueries({ key: ['me'] })
    await queryCache.invalidateQueries({ key: ['cv-analysis'] })
    await auth.refreshUser()
    await refetch()
  } catch (err: unknown) {
    toast.add({
      title: 'Upload failed',
      description: (err as { statusMessage?: string })?.statusMessage || 'PDF required',
      color: 'error'
    })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Curriculum vitae
      </h1>
      <p class="text-sm text-muted">
        Upload a PDF CV. The text is extracted and stored for your account.
      </p>
    </div>

    <UCard>
      <div
        v-if="isPending"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <div
        v-else
        class="space-y-4"
      >
        <div
          v-if="me?.cv_filename"
          class="rounded-lg bg-elevated p-4 space-y-1"
        >
          <p class="font-medium text-highlighted">
            Current CV
          </p>
          <p class="text-sm">
            {{ me.cv_filename }}
          </p>
          <p class="text-xs text-muted">
            Uploaded
            {{ me.cv_uploaded_at ? new Date(me.cv_uploaded_at).toLocaleString() : '—' }}
            ·
            {{ me.cv_text?.length?.toLocaleString() ?? 0 }} characters extracted
          </p>
        </div>

        <div
          v-else
          class="text-sm text-muted"
        >
          No CV uploaded yet.
        </div>

        <UFileUpload
          v-model="file"
          accept="application/pdf,.pdf"
          label="Drop your CV here"
          description="PDF only"
          class="min-h-40"
        />

        <UButton
          icon="i-lucide-upload"
          :disabled="!selectedFile"
          :loading="uploading"
          @click="onUpload"
        >
          Upload CV
        </UButton>
      </div>
    </UCard>

    <UCard v-if="me?.cv_filename">
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold text-highlighted">
            CV score & market fit
          </h2>
          <UButton
            size="sm"
            color="neutral"
            variant="subtle"
            icon="i-lucide-refresh-cw"
            :loading="analysisPending"
            @click="onRefreshAnalysis"
          >
            Refresh
          </UButton>
        </div>
      </template>

      <div
        v-if="analysisPending"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <UAlert
        v-else-if="analysisError"
        color="error"
        title="Could not generate CV analysis"
        :description="(analysisError as { statusMessage?: string })?.statusMessage"
      />

      <div
        v-else-if="cvAnalysis"
        class="space-y-4 text-sm"
      >
        <div class="flex items-center gap-3">
          <UBadge
            :color="cvScoreColor(cvAnalysis.score)"
            variant="subtle"
            size="lg"
          >
            {{ cvAnalysis.score }}/100
          </UBadge>
          <p class="text-xs text-muted">
            Based on {{ cvAnalysis.analyzed_jobs_count }} analyzed job{{ cvAnalysis.analyzed_jobs_count === 1 ? '' : 's' }}
            <span v-if="cvAnalysis.ai_cached">· cached</span>
          </p>
        </div>

        <p class="text-default">
          {{ cvAnalysis.summary }}
        </p>

        <div>
          <p class="font-medium mb-1">
            Strengths
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="item in cvAnalysis.strengths"
              :key="item"
              color="success"
              variant="subtle"
              size="sm"
            >
              {{ item }}
            </UBadge>
            <span
              v-if="!cvAnalysis.strengths.length"
              class="text-muted"
            >None yet</span>
          </div>
        </div>

        <div>
          <p class="font-medium mb-1">
            Gaps
          </p>
          <div class="flex flex-wrap gap-1.5">
            <UBadge
              v-for="item in cvAnalysis.gaps"
              :key="item"
              color="warning"
              variant="subtle"
              size="sm"
            >
              {{ item }}
            </UBadge>
            <span
              v-if="!cvAnalysis.gaps.length"
              class="text-muted"
            >None yet</span>
          </div>
        </div>

        <div>
          <p class="font-medium mb-1">
            Recommendations
          </p>
          <ul class="list-disc list-inside space-y-1 text-default">
            <li
              v-for="item in cvAnalysis.recommendations"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </div>
      </div>
    </UCard>
  </div>
</template>

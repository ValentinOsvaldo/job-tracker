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
  </div>
</template>

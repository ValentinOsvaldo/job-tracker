<script setup lang="ts">
import type { AtsCheckStatus } from '~/types/api'

definePageMeta({
  middleware: 'auth'
})

const api = useApiClient()

const { data: me, isPending: mePending } = useQuery({
  key: () => ['me'],
  query: () => api.meQuery.query()
})

const {
  data: atsCheck,
  isPending: checkPending,
  error: checkError,
  refetch: refetchCheck
} = useQuery({
  key: () => ['ats-check'],
  query: () => api.atsCheckQuery.query(),
  enabled: () => !!me.value?.cv_filename
})

const STATUS_ICON: Record<AtsCheckStatus, string> = {
  ok: 'i-lucide-circle-check',
  warning: 'i-lucide-triangle-alert',
  error: 'i-lucide-circle-x',
  neutral: 'i-lucide-circle-help'
}

const STATUS_COLOR: Record<AtsCheckStatus, string> = {
  ok: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
  neutral: 'text-muted'
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <h1 class="text-2xl font-semibold text-highlighted">
      ATS compatibility check
    </h1>
    <p class="text-sm text-muted">
      Revisa qué tan compatible es tu CV con los sistemas ATS (Applicant Tracking Systems):
      formato, información de contacto, encabezados de sección y cobertura de keywords contra
      las ofertas que ya se analizaron.
    </p>

    <div
      v-if="mePending"
      class="flex justify-center py-10"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <div
      v-else-if="!me?.cv_filename"
      class="rounded-lg border border-dashed border-default p-8 text-center space-y-3"
    >
      <p class="text-muted">
        Sube tu CV primero para poder correr el check de ATS.
      </p>
      <UButton to="/cv">
        Subir CV
      </UButton>
    </div>

    <template v-else>
      <div
        v-if="checkPending"
        class="flex justify-center py-10"
      >
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 animate-spin text-muted"
        />
      </div>

      <UAlert
        v-else-if="checkError"
        color="error"
        title="No se pudo generar el check de ATS"
        :description="(checkError as { statusMessage?: string })?.statusMessage"
        :actions="[{ label: 'Reintentar', onClick: () => { void refetchCheck() } }]"
      />

      <UCard v-else-if="atsCheck">
        <template #header>
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-highlighted">
              Resultado
            </h2>
            <div class="flex items-center gap-2">
              <UBadge
                :color="cvScoreColor(atsCheck.score)"
                variant="subtle"
                size="lg"
              >
                {{ atsCheck.score }}/100
              </UBadge>
              <UButton
                size="sm"
                color="neutral"
                variant="subtle"
                icon="i-lucide-refresh-cw"
                @click="() => { void refetchCheck() }"
              >
                Refresh
              </UButton>
            </div>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <div
            v-for="check in atsCheck.checks"
            :key="check.key"
            class="flex items-start gap-2"
          >
            <UIcon
              :name="STATUS_ICON[check.status]"
              :class="STATUS_COLOR[check.status]"
              class="size-4 shrink-0 mt-0.5"
            />
            <div>
              <p class="text-default font-medium">
                {{ check.label }}
              </p>
              <p class="text-xs text-muted">
                {{ check.detail }}
              </p>
            </div>
          </div>
        </div>

        <template
          v-if="atsCheck.recommendations.length"
          #footer
        >
          <p class="font-medium text-highlighted text-sm mb-1">
            Recomendaciones
          </p>
          <ul class="list-disc list-inside space-y-1 text-sm text-default">
            <li
              v-for="item in atsCheck.recommendations"
              :key="item"
            >
              {{ item }}
            </li>
          </ul>
        </template>
      </UCard>

      <p class="text-xs text-muted">
        Basado en {{ atsCheck?.analyzed_jobs_count ?? 0 }} oferta{{ atsCheck?.analyzed_jobs_count === 1 ? '' : 's' }} analizada{{ atsCheck?.analyzed_jobs_count === 1 ? '' : 's' }} contra tu CV.
      </p>
    </template>
  </div>
</template>

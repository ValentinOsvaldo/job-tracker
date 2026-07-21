<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const toast = useToast()

const mockChecks = [
  { label: 'Formato compatible (PDF, sin imágenes de texto)', status: 'ok' as const },
  { label: 'Información de contacto detectada', status: 'ok' as const },
  { label: 'Sin tablas o columnas complejas', status: 'ok' as const },
  { label: 'Cobertura de keywords del puesto', status: 'warning' as const },
  { label: 'Encabezados de sección estándar', status: 'warning' as const }
]

function onRun() {
  toast.add({
    title: 'Próximamente',
    description: 'El análisis real de ATS todavía no está conectado.',
    color: 'info'
  })
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <div class="flex items-center gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">
        ATS compatibility check
      </h1>
      <UBadge
        color="warning"
        variant="subtle"
      >
        Preview
      </UBadge>
    </div>
    <p class="text-sm text-muted">
      Vista previa de cómo se vería un test de compatibilidad con sistemas ATS (Applicant
      Tracking Systems). Todavía no está conectado a un análisis real — esto es solo un mockup.
    </p>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold text-highlighted">
            Resultado de ejemplo
          </h2>
          <UBadge
            color="warning"
            variant="subtle"
            size="lg"
          >
            72/100
          </UBadge>
        </div>
      </template>

      <div class="space-y-3 text-sm">
        <div
          v-for="check in mockChecks"
          :key="check.label"
          class="flex items-center gap-2"
        >
          <UIcon
            :name="check.status === 'ok' ? 'i-lucide-circle-check' : 'i-lucide-triangle-alert'"
            :class="check.status === 'ok' ? 'text-success' : 'text-warning'"
            class="size-4 shrink-0"
          />
          <span class="text-default">{{ check.label }}</span>
        </div>
      </div>

      <template #footer>
        <p class="text-xs text-muted">
          Datos de ejemplo — no corresponden a un CV real.
        </p>
      </template>
    </UCard>

    <UButton
      icon="i-lucide-scan-search"
      color="neutral"
      variant="subtle"
      @click="onRun"
    >
      Run ATS check
    </UButton>
  </div>
</template>

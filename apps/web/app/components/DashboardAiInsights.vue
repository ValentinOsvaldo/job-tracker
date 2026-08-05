<script setup lang="ts">
defineProps<{
  insights: {
    summary: string
    hot_technologies: string[]
    emerging_roles: string[]
    salary_signals: string | null
    recommendations: string[]
  } | null
}>()
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-sparkles"
          class="size-4 text-primary"
        />
        <h3 class="font-semibold text-highlighted">
          Lectura del mercado (IA)
        </h3>
      </div>
    </template>

    <div
      v-if="!insights"
      class="text-sm text-muted py-4"
    >
      Los insights aparecerán cuando haya suficientes ofertas analizadas.
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <p class="text-sm text-default text-pretty">
        {{ insights.summary }}
      </p>

      <div
        v-if="insights.hot_technologies?.length"
        class="space-y-1.5"
      >
        <p class="text-xs font-medium text-muted">
          Tecnologías en auge
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="tech in insights.hot_technologies"
            :key="tech"
            color="primary"
            variant="subtle"
            size="sm"
          >
            {{ tech }}
          </UBadge>
        </div>
      </div>

      <div
        v-if="insights.emerging_roles?.length"
        class="space-y-1.5"
      >
        <p class="text-xs font-medium text-muted">
          Roles emergentes
        </p>
        <div class="flex flex-wrap gap-1.5">
          <UBadge
            v-for="role in insights.emerging_roles"
            :key="role"
            color="neutral"
            variant="subtle"
            size="sm"
          >
            {{ role }}
          </UBadge>
        </div>
      </div>

      <p
        v-if="insights.salary_signals"
        class="text-xs text-muted border-t border-default pt-3"
      >
        <UIcon
          name="i-lucide-banknote"
          class="size-3.5 align-[-2px] mr-1"
        />{{ insights.salary_signals }}
      </p>

      <ul
        v-if="insights.recommendations?.length"
        class="space-y-1.5 border-t border-default pt-3"
      >
        <li
          v-for="tip in insights.recommendations"
          :key="tip"
          class="flex items-start gap-2 text-sm text-default"
        >
          <UIcon
            name="i-lucide-arrow-right"
            class="size-3.5 mt-1 text-primary shrink-0"
          />
          <span>{{ tip }}</span>
        </li>
      </ul>
    </div>
  </UCard>
</template>

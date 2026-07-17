<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

const auth = useAuthStore()

const state = reactive({
  email: '',
  password: ''
})

async function onSubmit() {
  await auth.login(state.email, state.password)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1 text-center">
      <h1 class="text-2xl font-semibold text-highlighted">
        Sign in
      </h1>
      <p class="text-sm text-muted">
        Use your Job Tracker account to continue
      </p>
    </div>

    <UCard>
      <UForm
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            autocomplete="email"
            placeholder="you@example.com"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
          required
        >
          <UInput
            v-model="state.password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="auth.error"
          color="error"
          variant="subtle"
          :title="auth.error"
          icon="i-lucide-circle-alert"
        />

        <UButton
          type="submit"
          block
          :loading="auth.loading"
        >
          Sign in
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

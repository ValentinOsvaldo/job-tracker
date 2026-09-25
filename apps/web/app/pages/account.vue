<script setup lang="ts">
const toast = useToast()
const api = useApiClient()

const { data: me, refetch: refetchMe } = useQuery({
  key: ['me'],
  query: () => api.meQuery.query()
})

const accountState = reactive({ name: '', email: '', home_city: '', home_country: '' })
const savingAccount = ref(false)

watch(
  me,
  (user) => {
    if (!user) return
    accountState.name = user.name
    accountState.email = user.email
    accountState.home_city = user.home_city ?? ''
    accountState.home_country = user.home_country ?? ''
  },
  { immediate: true }
)

async function onSaveAccount() {
  savingAccount.value = true
  try {
    await api.updateMe({
      name: accountState.name.trim(),
      email: accountState.email.trim(),
      home_city: accountState.home_city.trim() || null,
      home_country: accountState.home_country.trim() || null
    })
    await refetchMe()
    toast.add({ title: 'Account updated', color: 'success' })
  } catch (err: unknown) {
    toast.add({
      title: 'Could not update account',
      description: (err as { statusMessage?: string, data?: { message?: string } })?.statusMessage
        || (err as { data?: { message?: string } })?.data?.message
        || 'Try again',
      color: 'error'
    })
  } finally {
    savingAccount.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-xl">
    <div>
      <h1 class="text-2xl font-semibold text-highlighted">
        Account
      </h1>
      <p class="text-sm text-muted">
        Your name and location
      </p>
    </div>

    <UCard>
      <template #header>
        <h3 class="font-semibold text-highlighted">
          Profile
        </h3>
      </template>

      <UForm
        :state="accountState"
        class="space-y-4"
        @submit="onSaveAccount"
      >
        <UFormField
          label="Name"
          name="name"
          required
        >
          <UInput
            v-model="accountState.name"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Email"
          name="email"
          required
        >
          <UInput
            v-model="accountState.email"
            type="email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="City"
          name="home_city"
          hint="Used as a fallback location when scraping if your search profiles don't set their own"
        >
          <UInput
            v-model="accountState.home_city"
            placeholder="e.g. Guadalajara"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Country"
          name="home_country"
        >
          <UInput
            v-model="accountState.home_country"
            placeholder="e.g. Mexico"
            class="w-full"
          />
        </UFormField>

        <UButton
          type="submit"
          icon="i-lucide-save"
          :loading="savingAccount"
        >
          Save changes
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>

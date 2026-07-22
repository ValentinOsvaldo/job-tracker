<script setup lang="ts">
const auth = useAuthStore()
const route = useRoute()

const links = computed(() => [
  {
    label: 'Dashboard',
    to: '/',
    icon: 'i-lucide-layout-dashboard',
    active: route.path === '/'
  },
  {
    label: 'Jobs',
    to: '/jobs',
    icon: 'i-lucide-briefcase',
    active: route.path.startsWith('/jobs')
  },
  {
    label: 'Profiles',
    to: '/profiles',
    icon: 'i-lucide-users',
    active: route.path.startsWith('/profiles')
  },
  {
    label: 'CV',
    to: '/cv',
    icon: 'i-lucide-file-text',
    active: route.path.startsWith('/cv')
  },
  {
    label: 'ATS check',
    to: '/ats-check',
    icon: 'i-lucide-scan-search',
    badge: 'Preview',
    active: route.path.startsWith('/ats-check')
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: 'i-lucide-settings',
    active: route.path.startsWith('/settings')
  }
])

const accountItems = computed(() => [
  [
    {
      label: auth.user?.name ?? 'Account',
      icon: 'i-lucide-user',
      type: 'label' as const
    }
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: () => auth.logout()
    }
  ]
])
</script>

<template>
  <div class="min-h-screen flex flex-col bg-default">
    <UHeader
      mode="drawer"
      title="Job Tracker"
    >
      <UNavigationMenu :items="links" />

      <template #right>
        <UDropdownMenu :items="accountItems">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            :loading="auth.loading"
            :aria-label="auth.user?.name ?? 'Account'"
          />
        </UDropdownMenu>
        <UColorModeButton />
      </template>

      <template #body>
        <UNavigationMenu
          :items="links"
          orientation="vertical"
          class="-mx-2.5"
        />
      </template>
    </UHeader>

    <UMain class="flex-1">
      <UContainer class="py-6 sm:py-8">
        <slot />
      </UContainer>
    </UMain>
  </div>
</template>

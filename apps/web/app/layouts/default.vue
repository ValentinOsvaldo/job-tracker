<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const auth = useAuthStore()
const route = useRoute()

const links = computed<NavigationMenuItem[]>(() => [
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
    label: 'Postulaciones',
    to: '/applications',
    icon: 'i-lucide-send',
    active: route.path.startsWith('/applications')
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
    label: 'Perfil de CV',
    to: '/resume-profile',
    icon: 'i-lucide-file-user',
    active: route.path.startsWith('/resume-profile')
  },
  {
    label: 'ATS check',
    to: '/ats-check',
    icon: 'i-lucide-scan-search',
    active: route.path.startsWith('/ats-check')
  },
  {
    label: 'Users',
    to: '/users',
    icon: 'i-lucide-user-cog',
    active: route.path.startsWith('/users')
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
  <UDashboardGroup>
    <UDashboardSidebar
      collapsible
      resizable
    >
      <template #header="{ collapsed }">
        <div class="flex items-center gap-2 px-1">
          <UIcon
            name="i-lucide-briefcase"
            class="size-5 text-primary shrink-0"
          />
          <span
            v-if="!collapsed"
            class="font-semibold text-highlighted truncate"
          >
            Job Tracker
          </span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <UDropdownMenu
          :items="accountItems"
          class="w-full"
        >
          <UButton
            color="neutral"
            variant="ghost"
            :icon="collapsed ? 'i-lucide-user' : undefined"
            :label="collapsed ? undefined : (auth.user?.name ?? 'Account')"
            :loading="auth.loading"
            :aria-label="auth.user?.name ?? 'Account'"
            block
            class="justify-start"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar>
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <UColorModeButton />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>

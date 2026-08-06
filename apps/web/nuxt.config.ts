// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxt/test-utils',
    '@nuxtjs/mcp-toolkit',
    'nuxt-auth-utils',
    'nuxt-authorization',
    'nuxt-charts',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    '@vite-pwa/nuxt'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    apiBaseUrl: 'http://localhost:3000',
    // Server-only; must match Nest SEED_SECRET. Never expose to the client.
    seedSecret: '',
    // h3 defaults cookie.secure=true; over http://localhost the browser drops the session → 401s
    session: {
      cookie: {
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },

  devServer: {
    port: 3001
  },

  compatibilityDate: '2026-06-30',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Job Tracker',
      short_name: 'Job Tracker',
      description: 'Track job offers, match them to your search profiles, and review AI fit scores.',
      theme_color: '#00A155',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    workbox: {
      navigateFallback: '/offline',
      navigateFallbackDenylist: [/^\/api\//],
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      // Never cache API responses — job/profile data must always come from
      // the network, not a stale service worker cache.
      runtimeCaching: [
        {
          urlPattern: /^\/api\//,
          handler: 'NetworkOnly'
        }
      ]
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true
    }
  }
})

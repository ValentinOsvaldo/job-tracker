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
    '@pinia/colada-nuxt'
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
  }
})

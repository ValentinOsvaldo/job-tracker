declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'user'
    created_at: string
  }

  interface SecureSessionData {
    accessToken: string
    refreshToken: string
  }
}

export {}

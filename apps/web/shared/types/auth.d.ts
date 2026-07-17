declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
    cv_text: string | null
    cv_filename: string | null
    cv_uploaded_at: string | null
    created_at: string
  }

  interface SecureSessionData {
    accessToken: string
    refreshToken: string
  }
}

export {}

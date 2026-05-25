import '@auth/core/types'

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string
      email: string
      name: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    role?: string
  }
}

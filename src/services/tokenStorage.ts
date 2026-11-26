const TOKEN_KEY = 'access_token'

export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof localStorage === 'undefined') return null
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },

  setToken: (token: string): void => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Ignore storage errors in restricted environments.
    }
  },

  clearToken: (): void => {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Ignore storage errors in restricted environments.
    }
  },
}

import type { AuthSession } from './types'

// Same key the login form writes to.
const SESSION_KEY = 'auth_session'

export function getAuthSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.accessToken || !parsed.user?.role) return null
    return parsed as AuthSession
  } catch {
    return null
  }
}

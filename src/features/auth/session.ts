import { tokenStorage } from '@/services/tokenStorage'

export type CurrentAuth = { role: string | null; expired: boolean }

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1]
    if (!part) return null
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const payload: unknown = JSON.parse(json)
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/**
 * Role and expiry for route guards, read from the OTP login's access token (JWT claims).
 * This is UX only: the token is not verified here, the backend enforces access with 401/403.
 */
export function getCurrentAuth(): CurrentAuth | null {
  const token = tokenStorage.getToken()
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const role = typeof payload?.role === 'string' ? payload.role : null
  const expired = typeof payload?.exp === 'number' && payload.exp * 1000 <= Date.now()
  return { role, expired }
}

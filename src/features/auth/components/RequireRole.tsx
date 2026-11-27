import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/config/env'
import { getCurrentAuth } from '../session'

const HOME_BY_ROLE: Record<string, string> = { admin: '/admin', vendor: '/vendor' }

/**
 * Client-side gate only; the backend must still reject non-admin requests with 401/403.
 * While developing against mock data the gate is opened in dev builds.
 */
export default function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const location = useLocation()
  if (import.meta.env.DEV && env.useMockApi) return children

  const auth = getCurrentAuth()
  if (!auth || auth.expired) {
    const returnTo = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />
  }
  if (auth.role !== role) return <Navigate to={HOME_BY_ROLE[auth.role ?? ''] ?? '/'} replace />
  return children
}

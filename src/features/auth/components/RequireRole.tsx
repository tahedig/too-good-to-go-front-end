import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/config/env'
import { getAuthSession } from '../session'
import type { AuthSession } from '../types'

type Role = AuthSession['user']['role']

const HOME_BY_ROLE: Record<Role, string> = { admin: '/admin', vendor: '/vendor', user: '/' }

/**
 * Client-side gate only; the backend must still reject non-admin requests with 401/403.
 * While developing against mock data (no backend login yet) the gate is opened in dev builds.
 */
export default function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const location = useLocation()
  if (import.meta.env.DEV && env.useMockApi) return children

  const session = getAuthSession()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (session.user.role !== role) return <Navigate to={HOME_BY_ROLE[session.user.role]} replace />
  return children
}

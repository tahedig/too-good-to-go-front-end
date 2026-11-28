import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { env } from '@/config/env'
import { getCurrentAuth } from '../session'

const HOME_BY_ROLE: Record<string, string> = {
  admin: '/admin',
  vendor: '/vendor',
}

export default function RequireRole({
  role,
  children,
}: {
  role: string
  children: ReactNode
}) {
  const location = useLocation()

  if (import.meta.env.DEV && env.useMockApi) {
    return children
  }

  const auth = getCurrentAuth()

  if (!auth || auth.expired) {
    const returnTo = encodeURIComponent(
      location.pathname + location.search,
    )

    const loginPath = role === 'admin' ? '/admin/login' : '/login'

    return (
      <Navigate
        to={`${loginPath}?returnTo=${returnTo}`}
        replace
      />
    )
  }

  if (auth.role !== role) {
    return (
      <Navigate
        to={HOME_BY_ROLE[auth.role ?? ''] ?? '/'}
        replace
      />
    )
  }

  return children
}
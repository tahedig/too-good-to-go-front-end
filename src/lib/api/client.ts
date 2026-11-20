import { env } from '@/config/env'
import { tokenStorage } from '@/services/tokenStorage'

type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[] | string>
  error?: {
    code?: string
    message?: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>
  readonly code?: string
  readonly retryAfter?: number

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    options?: { code?: string; retryAfter?: number },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = options?.code
    this.retryAfter = options?.retryAfter
  }
}

function normaliseFieldErrors(errors?: ApiErrorBody['errors']) {
  if (!errors) return {}

  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages : [messages],
    ]),
  )
}

function getAccessToken() {
  const storedToken = tokenStorage.getToken()
  if (storedToken) return storedToken

  const serializedSession = sessionStorage.getItem('auth_session')
  if (!serializedSession) return undefined

  let session: unknown
  try {
    session = JSON.parse(serializedSession)
  } catch {
    throw new ApiError('جلسه ورود معتبر نیست. لطفاً دوباره وارد شوید.', 401)
  }

  if (!session || typeof session !== 'object') return undefined
  const token =
    'accessToken' in session
      ? session.accessToken
      : 'access_token' in session
        ? session.access_token
        : undefined
  return typeof token === 'string' && token ? token : undefined
}

function readFieldErrors(details: unknown): Record<string, string[]> {
  if (!Array.isArray(details)) return {}
  return Object.fromEntries(
    details.flatMap((detail) => {
      if (!detail || typeof detail !== 'object' || !('field' in detail) || !('message' in detail))
        return []
      const { field, message } = detail
      if (typeof field !== 'string' || typeof message !== 'string') return []
      return [[field, [message]]]
    }),
  )
}

function parseRetryAfter(response: Response, details: unknown): number | undefined {
  const headerValue = response.headers.get('Retry-After')
  if (headerValue) {
    const parsed = Number(headerValue)
    if (Number.isFinite(parsed) && parsed > 0) return Math.ceil(parsed)
  }
  if (details && typeof details === 'object' && 'retry_after_seconds' in details) {
    const value = details.retry_after_seconds
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.ceil(value)
  }
  return undefined
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getAccessToken()
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.', 0)
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null

  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody
    throw new ApiError(
      errorBody.error?.message ??
        errorBody.message ??
        'در انجام درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
      response.status,
      {
        ...normaliseFieldErrors(errorBody.errors),
        ...readFieldErrors(errorBody.error?.details),
      },
      {
        code: errorBody.error?.code,
        retryAfter: parseRetryAfter(response, errorBody.error?.details),
      },
    )
  }

  return body as T
}

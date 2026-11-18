import { env } from '@/config/env'
import { tokenStorage } from '@/services/tokenStorage'
import { getAuthSession } from '@/features/auth/session'

type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[] | string>
  error?: {
    message?: string
    details?: unknown
  }
}

/** Error envelope used by the Go backend. */
type ApiErrorEnvelope = {
  error: {
    code?: string
    message?: string
    details?: { field?: string; message: string }[]
    request_id?: string
  }
}

// The backend's 401/403 messages are shared English strings, so they are replaced here.
const STATUS_MESSAGES: Record<number, string> = {
  401: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.',
  403: 'شما به این بخش دسترسی ندارید.',
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>
  readonly requestId?: string

  constructor(
    message: string,
    status: number,
    fieldErrors: Record<string, string[]> = {},
    requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.requestId = requestId
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

function toApiError(body: unknown, status: number) {
  const fallback = 'در انجام درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید.'
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'object') {
    const { message, details, request_id } = (body as ApiErrorEnvelope).error
    const fieldErrors: Record<string, string[]> = {}
    for (const detail of details ?? []) {
      if (detail.field) (fieldErrors[detail.field] ??= []).push(detail.message)
    }
    return new ApiError(
      STATUS_MESSAGES[status] ?? message ?? fallback,
      status,
      fieldErrors,
      request_id,
    )
  }
  const errorBody = (body ?? {}) as ApiErrorBody
  return new ApiError(
    errorBody.message ?? STATUS_MESSAGES[status] ?? fallback,
    status,
    normaliseFieldErrors(errorBody.errors),
  )
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const token = getAccessToken() ?? getAuthSession()?.accessToken
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`)

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    })
  } catch {
    throw new ApiError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.', 0)
  }

  const body = (await response.json().catch(() => null)) as unknown

  if (!response.ok) throw toApiError(body, response.status)

  return body as T
}

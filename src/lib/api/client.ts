import { env } from '@/config/env'
import { tokenStorage } from '@/services/tokenStorage'

type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[] | string>
  error?: {
    message?: string
    details?: unknown
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
  /** Backend request id, useful for finding the request in server logs. */
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
    const envelopeMessage = errorBody.error && STATUS_MESSAGES[response.status]
    throw new ApiError(
      envelopeMessage ||
        errorBody.error?.message ||
        errorBody.message ||
        STATUS_MESSAGES[response.status] ||
        'در انجام درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
      response.status,
      {
        ...normaliseFieldErrors(errorBody.errors),
        ...readFieldErrors(errorBody.error?.details),
      },
      errorBody.error?.request_id,
    )
  }

  return body as T
}

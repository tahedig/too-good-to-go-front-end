import { env } from '@/config/env'

type ApiErrorBody = {
  message?: string
  errors?: Record<string, string[] | string>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string[]>

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
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

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.', 0)
  }

  const body = (await response.json().catch(() => null)) as ApiErrorBody | T | null

  if (!response.ok) {
    const errorBody = (body ?? {}) as ApiErrorBody
    throw new ApiError(
      errorBody.message ?? 'در انجام درخواست مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
      response.status,
      normaliseFieldErrors(errorBody.errors),
    )
  }

  return body as T
}

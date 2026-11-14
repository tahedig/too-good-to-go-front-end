import { getErrorMessage } from '@/features/auth/utils'
import { ApiError } from '@/lib/api/client'

export type DescribedError = { message: string; unauthorized: boolean; notFound: boolean }

/** User-facing message plus the backend request id, which support can look up in server logs. */
export function describeError(caught: unknown, fallback: string): DescribedError {
  const message = getErrorMessage(caught, fallback)
  const apiError = caught instanceof ApiError ? caught : null
  return {
    message: apiError?.requestId ? `${message} (کد پیگیری: ${apiError.requestId})` : message,
    unauthorized: apiError?.status === 401,
    notFound: apiError?.status === 404,
  }
}

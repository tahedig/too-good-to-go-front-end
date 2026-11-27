import { getErrorMessage } from '@/features/auth/utils'
import { ApiError } from '@/lib/api/client'

export type DescribedError = {
  message: string
  unauthorized: boolean
  forbidden: boolean
  notFound: boolean
}

export function describeError(caught: unknown, fallback: string): DescribedError {
  const apiError = caught instanceof ApiError ? caught : null
  const unauthorized = apiError?.status === 401
  const forbidden = apiError?.status === 403
  const notFound = apiError?.status === 404

  let message = getErrorMessage(caught, fallback)
  if (unauthorized) {
    message = 'برای مشاهده این بخش، ابتدا با حساب مدیر وارد شوید.'
  } else if (forbidden) {
    message = 'حساب کاربری فعلی دسترسی مدیریت ندارد.'
  }

  return {
    message,
    unauthorized,
    forbidden,
    notFound,
  }
}

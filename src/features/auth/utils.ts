import { ApiError } from '@/lib/api/client'

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return fallback
}

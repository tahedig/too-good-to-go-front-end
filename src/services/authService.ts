import { ApiError, apiRequest } from '@/lib/api/client'
import type { LoginResponse, VerifyOtpPayload } from '@/types/authTypes'
import { tokenStorage } from './tokenStorage'

export async function verifyOtpService(payload: VerifyOtpPayload): Promise<LoginResponse> {
  const response = await apiRequest<LoginResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!response?.verified || !response.access_token) {
    throw new ApiError('ورود تأیید نشد. دوباره تلاش کنید.', 401)
  }

  tokenStorage.setToken(response.access_token)
  return response
}

export function logoutService(): void {
  tokenStorage.clearToken()
}

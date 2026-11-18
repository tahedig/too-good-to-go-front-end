import { apiRequest } from '@/lib/api/client'

type RequestOtpResponse = {
  message: string
  expires_in_seconds: number
  debug_code?: string
}

export const customerOtpApi = {
  requestOtp(phone: string) {
    return apiRequest<RequestOtpResponse>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })
  },
}

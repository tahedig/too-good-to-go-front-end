import { apiRequest } from '@/lib/api/client'
import type {
  AuthSession,
  LoginPayload,
  OtpRequestPayload,
  OtpRequestResponse,
  OtpVerificationPayload,
  OtpVerificationResponse,
} from '../types'

// Keep backend-specific paths in this module so the UI remains unchanged when the API is connected.
export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requestRecoveryOtp: (payload: OtpRequestPayload) =>
    apiRequest<OtpRequestResponse>('/auth/recovery/otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyRecoveryOtp: (payload: OtpVerificationPayload) =>
    apiRequest<OtpVerificationResponse>('/auth/recovery/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}

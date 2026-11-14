export type LoginPayload = {
  email: string
  password: string
}

export type AuthSession = {
  accessToken: string
  refreshToken?: string
  user: {
    id: string
    email: string
    role: 'admin' | 'vendor'
  }
}

export type OtpRequestPayload = {
  email: string
  purpose: 'account_recovery'
}

export type OtpRequestResponse = {
  requestId: string
  expiresIn: number
  retryAfter?: number
}

export type OtpVerificationPayload = {
  email: string
  code: string
  requestId: string
}

export type OtpVerificationResponse = {
  recoveryToken: string
}

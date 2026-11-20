import { ApiError, apiRequest } from '@/lib/api/client'
import { tokenStorage } from '@/services/tokenStorage'

// Matches tahedig/too-good-to-go-back-end dto.RequestOTPResponse
type RawOtpRequestDto = {
  message?: string
  request_id?: string
  requestId?: string
  retry_after?: number
  retryAfter?: number
  expires_in_seconds?: number
  expiresInSeconds?: number
  expires_in?: number
  expiresIn?: number
  debug_code?: string
  is_new_customer?: boolean
  isNewCustomer?: boolean
  is_new_user?: boolean
  isNewUser?: boolean
}

// Matches tahedig/too-good-to-go-back-end dto.VerifyOTPResponse
type RawOtpVerifyDto = {
  verified?: boolean
  phone?: string
  access_token?: string
  accessToken?: string
  token_type?: string
  expires_in?: number
  user?: {
    id?: string | number
    phone?: string
    role?: string
  }
}

// Matches tahedig/too-good-to-go-back-end dto.MeResponse
type RawMeDto = {
  user_id?: string
  userId?: string
  role?: string
}

export type AdminOtpRequestResult = {
  requestId: string
  retryAfter: number
  expiresIn: number
  debugCode?: string
}

export type AdminAuthUser = {
  id: string
  phone: string
  role: string
}

export type AdminOtpVerifyResult = {
  accessToken: string
  user: AdminAuthUser
  isAdmin: boolean
}

export type AdminSession = {
  accessToken: string
  user: AdminAuthUser
}

const DEFAULT_RETRY_AFTER_SECONDS = 60
const DEFAULT_EXPIRES_IN_SECONDS = 300

export const adminAuthApi = {
  async requestOtp(phone: string): Promise<AdminOtpRequestResult> {
    const raw = await apiRequest<RawOtpRequestDto>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })

    const isNewAccount = Boolean(
      raw.is_new_customer ?? raw.isNewCustomer ?? raw.is_new_user ?? raw.isNewUser,
    )
    if (isNewAccount) {
      throw new ApiError('شماره تلفن مجاز نیست. دوباره تلاش کنید.', 403)
    }

    const retryAfterValue = raw.retry_after ?? raw.retryAfter
    const expiresInValue =
      raw.expires_in_seconds ?? raw.expiresInSeconds ?? raw.expires_in ?? raw.expiresIn

    return {
      requestId: raw.request_id ?? raw.requestId ?? '',
      retryAfter:
        typeof retryAfterValue === 'number' && retryAfterValue >= 0
          ? retryAfterValue
          : DEFAULT_RETRY_AFTER_SECONDS,
      expiresIn:
        typeof expiresInValue === 'number' && expiresInValue > 0
          ? expiresInValue
          : DEFAULT_EXPIRES_IN_SECONDS,
      debugCode: raw.debug_code,
    }
  },

  async verifyOtp(payload: { phone: string; code: string }): Promise<AdminOtpVerifyResult> {
    const raw = await apiRequest<RawOtpVerifyDto>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const accessToken = raw.access_token ?? raw.accessToken ?? ''
    if (raw.verified === false || !accessToken) {
      throw new ApiError('کد تأیید نادرست یا منقضی شده است.', 401)
    }

    const role = (raw.user?.role ?? '').trim().toLowerCase()
    const user: AdminAuthUser = {
      id: String(raw.user?.id ?? ''),
      phone: raw.user?.phone ?? raw.phone ?? payload.phone,
      role,
    }

    tokenStorage.setToken(accessToken)
    sessionStorage.setItem(
      'auth_session',
      JSON.stringify({
        accessToken,
        user,
      }),
    )

    return {
      accessToken,
      user,
      isAdmin: role === 'admin',
    }
  },

  async getMe(): Promise<{ userId: string; role: string }> {
    const raw = await apiRequest<RawMeDto>('/auth/me')
    return {
      userId: raw.user_id ?? raw.userId ?? '',
      role: (raw.role ?? '').trim().toLowerCase(),
    }
  },

  async verifyAdminAccess(): Promise<{ userId: string; role: string }> {
    const raw = await apiRequest<RawMeDto>('/test/admin')
    return {
      userId: raw.user_id ?? raw.userId ?? '',
      role: (raw.role ?? '').trim().toLowerCase(),
    }
  },

  getStoredSession(): AdminSession | null {
    const token = tokenStorage.getToken()
    const rawSession = sessionStorage.getItem('auth_session')
    if (!rawSession) {
      return token ? { accessToken: token, user: { id: '', phone: '', role: '' } } : null
    }
    try {
      const parsed = JSON.parse(rawSession) as Partial<AdminSession>
      const accessToken = parsed.accessToken || token || ''
      if (!accessToken || !parsed.user) return null
      return { accessToken, user: parsed.user }
    } catch {
      return null
    }
  },

  logout(): void {
    tokenStorage.clearToken()
    sessionStorage.removeItem('auth_session')
  },
}

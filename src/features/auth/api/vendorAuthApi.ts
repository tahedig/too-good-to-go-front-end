import { ApiError, apiRequest } from '@/lib/api/client'
import { tokenStorage } from '@/services/tokenStorage'

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
}

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

type RawMeDto = {
  user_id?: string
  userId?: string
  role?: string
}

export type VendorOtpRequestResult = {
  requestId: string
  retryAfter: number
  expiresIn: number
  debugCode?: string
}

export type VendorAuthUser = {
  id: string
  phone: string
  role: string
}

export type VendorOtpVerifyResult = {
  accessToken: string
  user: VendorAuthUser
  isVendor: boolean
}

export type VendorSession = {
  accessToken: string
  user: VendorAuthUser
}

const DEFAULT_RETRY_AFTER_SECONDS = 60
const DEFAULT_EXPIRES_IN_SECONDS = 300

function saveSession(accessToken: string, user: VendorAuthUser): void {
  tokenStorage.setToken(accessToken)
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(
      'auth_session',
      JSON.stringify({
        accessToken,
        user,
      }),
    )
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

export const vendorAuthApi = {
  async requestOtp(phone: string): Promise<VendorOtpRequestResult> {
    const raw = await apiRequest<RawOtpRequestDto>('/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    })

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

  async verifyOtp(payload: { phone: string; code: string }): Promise<VendorOtpVerifyResult> {
    const raw = await apiRequest<RawOtpVerifyDto>('/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const accessToken = raw.access_token ?? raw.accessToken ?? ''
    if (raw.verified === false || !accessToken) {
      throw new ApiError('کد تأیید نادرست یا منقضی شده است.', 401)
    }

    const role = (raw.user?.role ?? '').trim().toLowerCase()
    const user: VendorAuthUser = {
      id: String(raw.user?.id ?? ''),
      phone: raw.user?.phone ?? raw.phone ?? payload.phone,
      role,
    }

    saveSession(accessToken, user)

    return {
      accessToken,
      user,
      isVendor: role === 'vendor',
    }
  },

  async getMe(): Promise<{ userId: string; role: string }> {
    const raw = await apiRequest<RawMeDto>('/auth/me')
    return {
      userId: raw.user_id ?? raw.userId ?? '',
      role: (raw.role ?? '').trim().toLowerCase(),
    }
  },

  async verifyVendorAccess(): Promise<{ userId: string; role: string }> {
    const raw = await apiRequest<RawMeDto>('/test/vendor')
    return {
      userId: raw.user_id ?? raw.userId ?? '',
      role: (raw.role ?? '').trim().toLowerCase(),
    }
  },

  getStoredSession(): VendorSession | null {
    const token = tokenStorage.getToken()
    if (typeof sessionStorage === 'undefined') {
      return token ? { accessToken: token, user: { id: '', phone: '', role: '' } } : null
    }
    let rawSession: string | null
    try {
      rawSession = sessionStorage.getItem('auth_session')
    } catch {
      rawSession = null
    }
    if (!rawSession) {
      return token ? { accessToken: token, user: { id: '', phone: '', role: '' } } : null
    }
    try {
      const parsed = JSON.parse(rawSession) as Partial<VendorSession>
      const accessToken = parsed.accessToken || token || ''
      if (!accessToken) return null
      return {
        accessToken,
        user: parsed.user ?? { id: '', phone: '', role: '' },
      }
    } catch {
      return token ? { accessToken: token, user: { id: '', phone: '', role: '' } } : null
    }
  },

  logout(): void {
    tokenStorage.clearToken()
    if (typeof sessionStorage === 'undefined') return
    try {
      sessionStorage.removeItem('auth_session')
    } catch {
      // Ignore storage errors in restricted environments.
    }
  },
}

import { ApiError } from '@/lib/api/client'

const MOCK_REQUEST_KEY = 'tahedig_mock_otp_request'
const PROFILE_STORAGE_KEY = 'tahedig_customer_profile'
export const MOCK_OTP_CODE = '123456'

type PendingProfile = { firstName: string; lastName: string }

type MockOtpRequest = {
  requestId: string
  phoneNumber: string
  isNewCustomer: boolean
  profile?: PendingProfile
}

export type OtpRequestResult = {
  requestId: string
  retryAfter: number
  isNewCustomer: boolean
}

function wait(milliseconds = 500): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

function readRequest(): MockOtpRequest | null {
  try {
    const stored = sessionStorage.getItem(MOCK_REQUEST_KEY)
    return stored ? (JSON.parse(stored) as MockOtpRequest) : null
  } catch {
    return null
  }
}

function writeRequest(request: MockOtpRequest) {
  sessionStorage.setItem(MOCK_REQUEST_KEY, JSON.stringify(request))
}

function makeRequest(phoneNumber: string): MockOtpRequest {
  return {
    requestId: `mock-${Date.now()}`,
    phoneNumber,
    isNewCustomer: phoneNumber !== '09121234567',
  }
}

export const customerOtpApi = {
  async requestOtp(phoneNumber: string): Promise<OtpRequestResult> {
    await wait()
    const request = makeRequest(phoneNumber)
    writeRequest(request)
    return { requestId: request.requestId, retryAfter: 30, isNewCustomer: request.isNewCustomer }
  },

  async completeProfile(profile: PendingProfile): Promise<void> {
    await wait(400)
    const request = readRequest()
    if (!request) throw new ApiError('درخواست ورود منقضی شده است. دوباره تلاش کنید.', 400)
    writeRequest({ ...request, profile })
  },

  async verifyOtp(requestId: string, code: string): Promise<void> {
    await wait()
    const request = readRequest()
    if (!request || request.requestId !== requestId) {
      throw new ApiError('درخواست ورود منقضی شده است. کد جدیدی دریافت کنید.', 400)
    }
    if (code !== MOCK_OTP_CODE) throw new ApiError('کد تایید نادرست است.', 422)
    if (request.isNewCustomer && !request.profile) {
      throw new ApiError('اطلاعات حساب مشتری کامل نشده است.', 422)
    }

    const profile = request.profile ?? { firstName: 'لیلا', lastName: 'علیزاده' }
    localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({
        id: 'customer-1',
        firstName: profile.firstName,
        lastName: profile.lastName,
        displayName: `${profile.firstName} ${profile.lastName}`,
        phoneNumber: request.phoneNumber,
        phoneVerified: true,
      }),
    )
    sessionStorage.setItem(
      'auth_session',
      JSON.stringify({
        accessToken: 'mock-customer-token',
        user: { id: 'customer-1', role: 'customer' },
      }),
    )
    sessionStorage.removeItem(MOCK_REQUEST_KEY)
  },

  async resendOtp(): Promise<OtpRequestResult> {
    await wait(400)
    const current = readRequest()
    if (!current) throw new ApiError('ابتدا شماره تلفن را وارد کنید.', 400)
    const next = { ...current, requestId: `mock-${Date.now()}` }
    writeRequest(next)
    return { requestId: next.requestId, retryAfter: 30, isNewCustomer: next.isNewCustomer }
  },
}

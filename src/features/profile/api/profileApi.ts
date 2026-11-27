import { apiRequest, ApiError } from '@/lib/api/client'
import { env } from '@/config/env'
import type { CustomerProfile, UpdateCustomerProfilePayload } from '../types'

const MOCK_PROFILE_STORAGE_KEY = 'tahedig_customer_profile'
const MOCK_LATENCY_MS = 350

const defaultMockProfile: CustomerProfile = {
  id: 'customer-1',
  firstName: 'لیلا',
  lastName: 'علیزاده',
  displayName: 'لیلا علیزاده',
  phoneNumber: '۰۹۱۲۱۲۳۴۵۶۷',
  phoneVerified: true,
}

type ProfileApiResponse = {
  id?: string | number
  user_id?: string
  firstName?: string
  first_name?: string
  lastName?: string
  last_name?: string
  displayName?: string
  display_name?: string
  name?: string
  phoneNumber?: string
  phone_number?: string
  phone?: string
  phoneVerified?: boolean
  phone_verified?: boolean
}

function waitForMock(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, MOCK_LATENCY_MS))
}

function readMockProfile(): CustomerProfile {
  try {
    const stored = localStorage.getItem(MOCK_PROFILE_STORAGE_KEY)
    if (!stored) return defaultMockProfile
    return { ...defaultMockProfile, ...(JSON.parse(stored) as Partial<CustomerProfile>) }
  } catch {
    return defaultMockProfile
  }
}

async function getMockProfile(): Promise<CustomerProfile> {
  await waitForMock()
  return readMockProfile()
}

async function updateMockProfile(payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
  await waitForMock()
  const updated: CustomerProfile = {
    ...readMockProfile(),
    firstName: payload.firstName,
    lastName: payload.lastName,
    displayName: `${payload.firstName} ${payload.lastName}`.trim(),
  }

  try {
    localStorage.setItem(MOCK_PROFILE_STORAGE_KEY, JSON.stringify(updated))
  } catch {
    throw new ApiError('ذخیره اطلاعات در مرورگر انجام نشد.', 0)
  }

  return updated
}

function normaliseProfile(profile: ProfileApiResponse): CustomerProfile {
  const displayName = profile.displayName ?? profile.display_name ?? profile.name ?? ''
  const nameParts = displayName.trim().split(/\s+/)
  const firstName = profile.firstName ?? profile.first_name ?? nameParts[0] ?? ''
  const lastName = profile.lastName ?? profile.last_name ?? nameParts.slice(1).join(' ')
  const phoneNumber = profile.phoneNumber ?? profile.phone_number ?? profile.phone ?? ''

  return {
    id: String(profile.id ?? profile.user_id ?? 'current'),
    firstName,
    lastName,
    displayName: displayName || [firstName, lastName].filter(Boolean).join(' '),
    phoneNumber,
    phoneVerified: profile.phoneVerified ?? profile.phone_verified ?? true,
  }
}

export const profileApi = {
  async getCurrent(): Promise<CustomerProfile> {
    if (env.profileApiMode === 'mock') return getMockProfile()

    const profile = await apiRequest<ProfileApiResponse>('/customer/profile')
    return normaliseProfile(profile)
  },

  async updateCurrent(payload: UpdateCustomerProfilePayload): Promise<CustomerProfile> {
    if (env.profileApiMode === 'mock') return updateMockProfile(payload)

    await apiRequest<ProfileApiResponse | null>('/customer/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        display_name: `${payload.firstName} ${payload.lastName}`.trim(),
      }),
    })
    // Re-read the server source of truth so the UI exactly matches a subsequent refresh,
    // including APIs that return 204 or a partial object after PATCH.
    return profileApi.getCurrent()
  },
}

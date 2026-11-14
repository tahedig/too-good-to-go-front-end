import { ApiError } from '@/lib/api/client'
import { DECISION_MESSAGE_MIN_LENGTH } from '../constants'
import type {
  Vendor,
  VendorApprovalApi,
  VendorDecisionPayload,
  VendorDecisionType,
  VendorStatus,
} from '../types'

/**
 * In-memory stand-in for the backend (data resets on reload). It enforces the same rules the
 * real API must enforce. Set localStorage `mock_api_fail` to "1" to test error states.
 */
const IMAGE = '/vendor-bakery.jpg'

function vendor(
  fields: Pick<Vendor, 'id' | 'storeName' | 'ownerName' | 'category' | 'address' | 'submittedAt'> &
    Partial<Vendor>,
): Vendor {
  return {
    phone: '09000000001',
    email: null,
    description: 'نان و شیرینی پایان روز',
    imageUrl: IMAGE,
    status: 'pending',
    statusUpdatedAt: null,
    decision: null,
    ...fields,
  }
}

let vendors: Vendor[] = [
  vendor({
    id: 'v-101',
    storeName: 'نان صبحگاهی · شعبه شریعتی',
    ownerName: 'آیدا کریمی',
    category: 'نانوایی',
    address: 'تهران، خیابان شریعتی',
    submittedAt: '2026-10-19T08:30:00Z',
  }),
  vendor({
    id: 'v-102',
    storeName: 'نانوایی سنتی و آشپزخانهٔ صبحانهٔ محلهٔ ولیعصر',
    ownerName: 'سمیرا محمدی',
    category: 'نانوایی',
    address: 'خیابان شریعتی، پلاک ۲۴',
    submittedAt: '2026-10-19T07:10:00Z',
    phone: '09000000002',
  }),
  vendor({
    id: 'v-103',
    storeName: 'خواربار کاسپین',
    ownerName: 'رضا حسینی',
    category: 'خواربار',
    address: 'میدان ونک، پلاک ۸',
    submittedAt: '2026-10-18T10:00:00Z',
    phone: '09000000003',
    description: 'میوه، سبزی و لبنیات نزدیک به تاریخ',
  }),
  vendor({
    id: 'v-104',
    storeName: 'نان صبحگاهی',
    ownerName: 'آیدا کریمی',
    category: 'نانوایی',
    address: 'خیابان ولیعصر، پلاک ۱۲',
    submittedAt: '2026-10-17T09:00:00Z',
    status: 'approved',
    statusUpdatedAt: '2026-10-17T12:00:00Z',
  }),
  vendor({
    id: 'v-105',
    storeName: 'سفرهٔ شام شهر قدیم',
    ownerName: 'امیر عباسی',
    category: 'غذای آماده',
    address: 'کوچهٔ مروی، پلاک ۶',
    submittedAt: '2026-10-16T15:00:00Z',
    description: 'غذای گرم باقی‌ماندهٔ شام',
    status: 'rejected',
    statusUpdatedAt: '2026-10-16T18:00:00Z',
    decision: {
      type: 'rejection',
      reasonCode: 'unverifiable_address',
      message:
        'نشانی تحویل قابل تأیید نبود. لطفاً نشانی فروشگاه را اصلاح و درخواست را دوباره ارسال کنید.',
      decidedAt: '2026-10-16T18:00:00Z',
      decidedBy: 'ادمین',
    },
  }),
  vendor({
    id: 'v-106',
    storeName: 'کافه رز',
    ownerName: 'نگار رضایی',
    category: 'کافه',
    address: 'خیابان انقلاب، پلاک ۴۰',
    submittedAt: '2026-10-02T09:00:00Z',
    description: 'کیک و ساندویچ پایان روز',
    status: 'approved',
    statusUpdatedAt: '2026-10-03T09:00:00Z',
  }),
  vendor({
    id: 'v-107',
    storeName: 'شیرینی‌سرای مهتاب',
    ownerName: 'حمید نوری',
    category: 'شیرینی‌فروشی',
    address: 'خیابان آزادی، پلاک ۱۵',
    submittedAt: '2026-09-20T09:00:00Z',
    description: 'شیرینی تر و خشک روز',
    status: 'suspended',
    statusUpdatedAt: '2026-10-10T11:00:00Z',
    decision: {
      type: 'suspension',
      reasonCode: 'customer_complaints',
      message: 'چند مشتری از کیفیت بسته‌ها شکایت کرده‌اند. تا بررسی کامل، فروشگاه تعلیق است.',
      decidedAt: '2026-10-10T11:00:00Z',
      decidedBy: 'ادمین',
    },
  }),
]

const wait = () => new Promise((resolve) => setTimeout(resolve, 450))

async function simulateNetwork() {
  await wait()
  let shouldFail = false
  try {
    shouldFail = localStorage.getItem('mock_api_fail') === '1'
  } catch {
    /* storage may be unavailable */
  }
  if (shouldFail)
    throw new ApiError('ارتباط با سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.', 0)
}

function find(id: string) {
  const found = vendors.find((item) => item.id === id)
  if (!found) throw new ApiError('فروشگاه پیدا نشد.', 404)
  return found
}

function transition(
  id: string,
  from: VendorStatus,
  to: VendorStatus,
  decision: Vendor['decision'],
) {
  const current = find(id)
  if (current.status !== from)
    throw new ApiError('وضعیت این فروشگاه تغییر کرده است. صفحه را تازه کنید.', 409)
  const now = new Date().toISOString()
  const updated: Vendor = { ...current, status: to, statusUpdatedAt: now, decision }
  vendors = vendors.map((item) => (item.id === id ? updated : item))
  return structuredClone(updated)
}

function decide(type: VendorDecisionType, { reasonCode, message }: VendorDecisionPayload) {
  if (!reasonCode)
    throw new ApiError('دلیل را انتخاب کنید.', 422, { reasonCode: ['دلیل را انتخاب کنید.'] })
  if (message.trim().length < DECISION_MESSAGE_MIN_LENGTH) {
    const text = `حداقل ${DECISION_MESSAGE_MIN_LENGTH} نویسه بنویسید.`
    throw new ApiError(text, 422, { message: [text] })
  }
  return {
    type,
    reasonCode,
    message: message.trim(),
    decidedAt: new Date().toISOString(),
    decidedBy: 'ادمین',
  }
}

export const mockVendorApprovalApi: VendorApprovalApi = {
  async list({ statuses, search, page = 1, pageSize = 20 }) {
    await simulateNetwork()
    const term = search?.trim().toLowerCase() ?? ''
    const filtered = vendors
      .filter((item) => !statuses?.length || statuses.includes(item.status))
      .filter(
        (item) =>
          !term ||
          [item.storeName, item.ownerName, item.category, item.address].some((value) =>
            value.toLowerCase().includes(term),
          ),
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    const counts: Record<VendorStatus, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      suspended: 0,
    }
    vendors.forEach((item) => (counts[item.status] += 1))
    return {
      items: structuredClone(filtered.slice((page - 1) * pageSize, page * pageSize)),
      total: filtered.length,
      page,
      pageSize,
      counts,
    }
  },
  async get(id) {
    await simulateNetwork()
    return structuredClone(find(id))
  },
  async approve(id) {
    await simulateNetwork()
    return transition(id, 'pending', 'approved', null)
  },
  async reject(id, payload) {
    await simulateNetwork()
    return transition(id, 'pending', 'rejected', decide('rejection', payload))
  },
  async suspend(id, payload) {
    await simulateNetwork()
    return transition(id, 'approved', 'suspended', decide('suspension', payload))
  },
  async reactivate(id) {
    await simulateNetwork()
    return transition(id, 'suspended', 'approved', null)
  },
}

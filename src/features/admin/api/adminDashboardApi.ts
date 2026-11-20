import { env } from '@/config/env'
import { ApiError, apiRequest } from '@/lib/api/client'
import { adminVendorsApi, type AdminVendorListDto } from './adminVendorsApi'

export type AdminRequestStatus = 'pending' | 'approved' | 'rejected' | 'suspended'

export type AdminDashboardMetrics = {
  registeredStores: number
  knownCustomers: number
  activeProducts: number
  activeStores: number
  completedReservations: number
  activeReservations: number
  pendingRequests: number
  platformCommission: number
}

export type AdminRequestStatusCounts = {
  pending: number
  approved: number
  rejected: number
}

export type AdminRecentActivityItem = {
  id: string
  storeName: string
  ownerName: string
  dateLabel: string
  status: AdminRequestStatus
  statusLabel: string
}

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics
  requestStatus: AdminRequestStatusCounts
  recentActivity: AdminRecentActivityItem[]
}

type AdminDashboardDto = {
  metrics?: Partial<AdminDashboardMetrics> & {
    registered_stores?: number
    known_customers?: number
    active_products?: number
    active_stores?: number
    completed_reservations?: number
    active_reservations?: number
    pending_requests?: number
    platform_commission?: number
  }
  request_status?: Partial<AdminRequestStatusCounts>
  requestStatus?: Partial<AdminRequestStatusCounts>
  recent_activity?: Array<{
    id?: string | number
    store_name?: string
    storeName?: string
    owner_name?: string
    ownerName?: string
    date_label?: string
    dateLabel?: string
    created_at?: string
    submitted_at?: string
    status?: string
    status_label?: string
    statusLabel?: string
  }>
  recentActivity?: Array<{
    id?: string | number
    store_name?: string
    storeName?: string
    owner_name?: string
    ownerName?: string
    date_label?: string
    dateLabel?: string
    created_at?: string
    submitted_at?: string
    status?: string
    status_label?: string
    statusLabel?: string
  }>
}

const DEMO_DASHBOARD_DATA: AdminDashboardData = {
  metrics: {
    registeredStores: 1,
    knownCustomers: 2,
    activeProducts: 1,
    activeStores: 1,
    completedReservations: 0,
    activeReservations: 2,
    pendingRequests: 3,
    platformCommission: 200000,
  },
  requestStatus: {
    pending: 3,
    approved: 1,
    rejected: 1,
  },
  recentActivity: [
    {
      id: 'activity-1',
      storeName: 'نان صبحگاهی · شعبه شریعتی',
      ownerName: 'آیدا کریمی',
      dateLabel: '۲۷ مهر ۱۴۰۵',
      status: 'pending',
      statusLabel: 'در انتظار بررسی',
    },
    {
      id: 'activity-2',
      storeName: 'نانوایی سنتی و آشپزخانهٔ صبحانهٔ محلهٔ ولیعصر',
      ownerName: 'سمیرا محمدی',
      dateLabel: '۲۷ مهر ۱۴۰۵',
      status: 'pending',
      statusLabel: 'در انتظار بررسی',
    },
    {
      id: 'activity-3',
      storeName: 'خواربار کاسپین',
      ownerName: 'رضا حسینی',
      dateLabel: '۲۶ مهر ۱۴۰۵',
      status: 'pending',
      statusLabel: 'در انتظار بررسی',
    },
  ],
}

function mapStatus(value?: string): AdminRequestStatus {
  if (value === 'approved' || value === 'active') return 'approved'
  if (value === 'rejected') return 'rejected'
  if (value === 'suspended') return 'suspended'
  return 'pending'
}

function defaultStatusLabel(status: AdminRequestStatus): string {
  switch (status) {
    case 'approved':
      return 'تأییدشده'
    case 'rejected':
      return 'ردشده'
    case 'suspended':
      return 'تعلیق‌شده'
    default:
      return 'در انتظار بررسی'
  }
}

function formatActivityDate(dateString?: string): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function normalizeDashboardDto(dto: AdminDashboardDto): AdminDashboardData {
  const metrics = dto.metrics ?? {}
  const statusCounts = dto.request_status ?? dto.requestStatus ?? {}
  const rawActivity = dto.recent_activity ?? dto.recentActivity ?? []

  return {
    metrics: {
      registeredStores: metrics.registeredStores ?? metrics.registered_stores ?? 0,
      knownCustomers: metrics.knownCustomers ?? metrics.known_customers ?? 0,
      activeProducts: metrics.activeProducts ?? metrics.active_products ?? 0,
      activeStores: metrics.activeStores ?? metrics.active_stores ?? 0,
      completedReservations: metrics.completedReservations ?? metrics.completed_reservations ?? 0,
      activeReservations: metrics.activeReservations ?? metrics.active_reservations ?? 0,
      pendingRequests: metrics.pendingRequests ?? metrics.pending_requests ?? 0,
      platformCommission: metrics.platformCommission ?? metrics.platform_commission ?? 0,
    },
    requestStatus: {
      pending: statusCounts.pending ?? 0,
      approved: statusCounts.approved ?? 0,
      rejected: statusCounts.rejected ?? 0,
    },
    recentActivity: rawActivity.map((item, index) => {
      const status = mapStatus(item.status)
      return {
        id: String(item.id ?? `activity-${index + 1}`),
        storeName: item.storeName ?? item.store_name ?? '',
        ownerName: item.ownerName ?? item.owner_name ?? '',
        dateLabel:
          item.dateLabel ??
          item.date_label ??
          formatActivityDate(item.submitted_at ?? item.created_at),
        status,
        statusLabel: item.statusLabel ?? item.status_label ?? defaultStatusLabel(status),
      }
    }),
  }
}

function buildFromVendorsSummary(vendors: AdminVendorListDto): AdminDashboardData {
  const { pending, approved, rejected, suspended } = vendors.counts
  return {
    metrics: {
      registeredStores: approved + suspended,
      knownCustomers: 0,
      activeProducts: 0,
      activeStores: approved,
      completedReservations: 0,
      activeReservations: 0,
      pendingRequests: pending,
      platformCommission: 0,
    },
    requestStatus: {
      pending,
      approved,
      rejected,
    },
    recentActivity: vendors.items.slice(0, 3).map((item) => {
      const status = mapStatus(item.status)
      return {
        id: item.id,
        storeName: item.store_name,
        ownerName: item.owner_name,
        dateLabel: formatActivityDate(item.submitted_at),
        status,
        statusLabel: defaultStatusLabel(status),
      }
    }),
  }
}

/**
 * Backend alignment notes (tahedig/too-good-to-go-back-end):
 * - GET /admin/vendors already exists on `main` and supplies request status counts + recent submitted stores.
 * - A unified GET /admin/dashboard endpoint for aggregate customer, product, reservation, and commission metrics
 *   is not yet implemented on the backend; `env.adminApiMode === 'mock'` renders demo data in the meantime.
 */
export const adminDashboardApi = {
  async getSummary(): Promise<AdminDashboardData> {
    if (env.adminApiMode === 'mock') {
      return DEMO_DASHBOARD_DATA
    }

    try {
      const dto = await apiRequest<AdminDashboardDto>('/admin/dashboard')
      return normalizeDashboardDto(dto)
    } catch (error) {
      if (error instanceof ApiError && [404, 405, 501].includes(error.status)) {
        const vendors = await adminVendorsApi.listVendors({ page: 1, pageSize: 3 })
        return buildFromVendorsSummary(vendors)
      }
      throw error
    }
  },
}

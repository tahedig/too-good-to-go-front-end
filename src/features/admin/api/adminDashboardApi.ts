import type { ListingStatus } from '@/components/ui/StatusBadge'
import { env } from '@/config/env'
import { ApiError, apiRequest } from '@/lib/api/client'
import { adminVendorsApi, type AdminVendorListDto } from './adminVendorsApi'

export type AdminActivityType = 'store_application' | 'store_decision' | 'reservation'

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
  suspended: number
}

export type AdminRecentActivityItem = {
  id: string
  type: AdminActivityType
  storeName: string
  ownerName: string
  dateLabel: string
  badgeStatus: ListingStatus
  statusLabel: string
  amount: number | null
}

export type AdminDashboardData = {
  metrics: AdminDashboardMetrics
  requestStatus: AdminRequestStatusCounts
  recentActivity: AdminRecentActivityItem[]
}

export type AdminDashboardQuery = {
  activityLimit?: number
  activityType?: string
}

// Matches tahedig/too-good-to-go-back-end PR #29 (feat/TEAM-58/admin-dashboard)
// internal/application/dto/admin_dashboard_dto.go
export type AdminDashboardTotalsDto = {
  customers: number
  vendors: number
  registered_stores: number
  active_stores: number
  active_offers: number
  pending_applications: number
  total_reservations: number
  active_reservations: number
  completed_reservations: number
  platform_commission: number
}

export type AdminApplicationBreakdownDto = {
  pending: number
  approved: number
  rejected: number
  suspended: number
}

export type AdminReservationBreakdownDto = {
  pending_payment: number
  paid: number
  ready: number
  completed: number
  cancelled: number
  expired: number
  no_show: number
  active: number
  total: number
}

export type AdminActivityItemDto = {
  type: AdminActivityType
  entity_id: string
  title: string
  actor_name: string
  status: string
  action?: string
  amount?: number | null
  occurred_at: string
}

export type AdminDashboardResponseDto = {
  totals: AdminDashboardTotalsDto
  applications: AdminApplicationBreakdownDto
  reservations: AdminReservationBreakdownDto
  recent_activity: AdminActivityItemDto[]
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
    suspended: 0,
  },
  recentActivity: [
    {
      id: 'activity-1',
      type: 'store_application',
      storeName: 'نان صبحگاهی · شعبه شریعتی',
      ownerName: 'آیدا کریمی',
      dateLabel: '۲۷ مهر ۱۴۰۵',
      badgeStatus: 'pending',
      statusLabel: 'در انتظار بررسی',
      amount: null,
    },
    {
      id: 'activity-2',
      type: 'store_application',
      storeName: 'نانوایی سنتی و آشپزخانهٔ صبحانهٔ محلهٔ ولیعصر',
      ownerName: 'سمیرا محمدی',
      dateLabel: '۲۷ مهر ۱۴۰۵',
      badgeStatus: 'pending',
      statusLabel: 'در انتظار بررسی',
      amount: null,
    },
    {
      id: 'activity-3',
      type: 'store_application',
      storeName: 'خواربار کاسپین',
      ownerName: 'رضا حسینی',
      dateLabel: '۲۶ مهر ۱۴۰۵',
      badgeStatus: 'pending',
      statusLabel: 'در انتظار بررسی',
      amount: null,
    },
  ],
}

function mapStatusBadge(status?: string): { badgeStatus: ListingStatus; statusLabel: string } {
  switch (status) {
    case 'approved':
    case 'active':
      return { badgeStatus: 'approved', statusLabel: 'تأییدشده' }
    case 'rejected':
      return { badgeStatus: 'rejected', statusLabel: 'ردشده' }
    case 'suspended':
      return { badgeStatus: 'suspended', statusLabel: 'تعلیق‌شده' }
    case 'pending_payment':
      return { badgeStatus: 'pending', statusLabel: 'در انتظار پرداخت' }
    case 'paid':
      return { badgeStatus: 'approved', statusLabel: 'پرداخت‌شده' }
    case 'ready':
      return { badgeStatus: 'approved', statusLabel: 'آماده تحویل' }
    case 'completed':
      return { badgeStatus: 'approved', statusLabel: 'تحویل‌شده' }
    case 'cancelled':
      return { badgeStatus: 'rejected', statusLabel: 'لغوشده' }
    case 'expired':
      return { badgeStatus: 'inactive', statusLabel: 'منقضی‌شده' }
    case 'no_show':
      return { badgeStatus: 'inactive', statusLabel: 'عدم مراجعه' }
    default:
      return { badgeStatus: 'pending', statusLabel: 'در انتظار بررسی' }
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
    timeZone: 'Asia/Tehran',
  }).format(date)
}

function buildDashboardQueryString(query: AdminDashboardQuery = {}): string {
  const params = new URLSearchParams()
  const limit = query.activityLimit ?? 5
  params.set('activity_limit', String(limit))
  if (query.activityType) params.set('activity_type', query.activityType)
  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

function normalizeDashboardResponse(dto: AdminDashboardResponseDto): AdminDashboardData {
  const totals = dto.totals
  const applications = dto.applications
  const recentActivity = dto.recent_activity ?? []

  return {
    metrics: {
      registeredStores: totals.registered_stores,
      knownCustomers: totals.customers,
      activeProducts: totals.active_offers,
      activeStores: totals.active_stores,
      completedReservations: totals.completed_reservations,
      activeReservations: totals.active_reservations,
      pendingRequests: totals.pending_applications,
      platformCommission: totals.platform_commission,
    },
    requestStatus: {
      pending: applications.pending,
      approved: applications.approved,
      rejected: applications.rejected,
      suspended: applications.suspended,
    },
    recentActivity: recentActivity.map((item, index) => {
      const { badgeStatus, statusLabel } = mapStatusBadge(item.status)
      return {
        id: item.entity_id || `activity-${index + 1}`,
        type: item.type ?? 'store_application',
        storeName: item.title,
        ownerName: item.actor_name || '—',
        dateLabel: formatActivityDate(item.occurred_at),
        badgeStatus,
        statusLabel,
        amount: item.amount ?? null,
      }
    }),
  }
}

function buildFromVendorsSummary(vendors: AdminVendorListDto): AdminDashboardData {
  const { pending, approved, rejected, suspended } = vendors.counts
  return {
    metrics: {
      registeredStores: pending + approved + rejected + suspended,
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
      suspended,
    },
    recentActivity: vendors.items.slice(0, 5).map((item) => {
      const { badgeStatus, statusLabel } = mapStatusBadge(item.status)
      return {
        id: item.id,
        type: 'store_application',
        storeName: item.store_name,
        ownerName: item.owner_name || '—',
        dateLabel: formatActivityDate(item.submitted_at),
        badgeStatus,
        statusLabel,
        amount: null,
      }
    }),
  }
}

export const adminDashboardApi = {
  async getSummary(query: AdminDashboardQuery = {}): Promise<AdminDashboardData> {
    if (env.adminApiMode === 'mock') {
      return DEMO_DASHBOARD_DATA
    }

    try {
      const dto = await apiRequest<AdminDashboardResponseDto>(
        `/admin/dashboard${buildDashboardQueryString(query)}`,
      )
      return normalizeDashboardResponse(dto)
    } catch (error) {
      if (error instanceof ApiError && [404, 405, 501].includes(error.status)) {
        try {
          const vendors = await adminVendorsApi.listVendors({ page: 1, pageSize: 5 })
          return buildFromVendorsSummary(vendors)
        } catch (vendorError) {
          if (
            import.meta.env.DEV &&
            vendorError instanceof ApiError &&
            [0, 502, 503, 504].includes(vendorError.status)
          ) {
            return DEMO_DASHBOARD_DATA
          }
          throw vendorError
        }
      }

      if (
        import.meta.env.DEV &&
        error instanceof ApiError &&
        [0, 502, 503, 504].includes(error.status)
      ) {
        return DEMO_DASHBOARD_DATA
      }

      throw error
    }
  },
}

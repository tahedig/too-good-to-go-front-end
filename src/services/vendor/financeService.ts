import type {
  CurrentPlan,
  FinanceReservation,
  FinanceSnapshot,
  FinanceSource,
} from '@/features/vendor-finance/financeTypes'
import type { FinanceSection } from '@/features/vendor-finance/navigation'
import { ApiError } from '@/lib/api/client'
import { formatJalaliMonthYear, localDate } from '@/lib/vendorDates'
import {
  isActiveReservation,
  reservationCustomerLabel,
  toPickupWindowFromTimestamps,
} from '@/lib/vendorReservations'
import type { Reservation, ReservationStatus } from '@/lib/vendorReservations'
import { listVendorReservations } from './reservationsService'
import { fetchVendorDashboard } from './vendorDashboardApi'
import type {
  VendorDashboardPlanDto,
  VendorDashboardReservationSummaryDto,
  VendorDashboardResponseDto,
} from './vendorDashboardApi'

function inferPlanMeta(name: string): { id: string; monthlyPrice: number } {
  if (name.includes('ویژه')) return { id: 'enterprise', monthlyPrice: 990000 }
  if (name.includes('حرفه‌ای')) return { id: 'pro', monthlyPrice: 490000 }
  return { id: 'basic', monthlyPrice: 0 }
}

function mapDashboardPlan(plan: VendorDashboardPlanDto): CurrentPlan {
  const { id, monthlyPrice } = inferPlanMeta(plan.name)
  return {
    offer: {
      id,
      name: plan.name,
      monthlyPrice,
      days: 30,
      commission: plan.commission_rate,
      stores: 1,
      products: 5,
      features: '',
    },
    from: plan.period_start.slice(0, 10),
    to: plan.period_end.slice(0, 10),
    daysLeft: Math.max(0, plan.remaining_days),
    pendingUpgrade: null,
  }
}

function mapDashboardStatus(status: string): ReservationStatus {
  switch (status) {
    case 'ready':
    case 'ready_for_pickup':
      return 'ready_for_pickup'
    case 'completed':
    case 'delivered':
      return 'delivered'
    case 'cancelled':
    case 'expired':
    case 'no_show':
      return 'cancelled'
    default:
      return 'active'
  }
}

function mapRecentReservation(item: VendorDashboardReservationSummaryDto): Reservation {
  const firstItem = item.items[0]
  const totalQuantity = item.items.reduce((sum, row) => sum + row.quantity, 0)
  return {
    id: item.id,
    orderNumber: item.pickup_code || item.id.slice(0, 8),
    customer: item.customer_name?.trim() || null,
    offerId: item.id,
    product: firstItem?.title?.trim() || 'بستهٔ رزروشده',
    image: '',
    quantity: Math.max(1, totalQuantity),
    amount: item.total_amount,
    status: mapDashboardStatus(item.status),
    ...toPickupWindowFromTimestamps(item.pickup_start, item.pickup_end, item.created_at),
  }
}

function toFinanceReservation(order: Reservation): FinanceReservation {
  return {
    id: order.id,
    customer: reservationCustomerLabel(order),
    quantity: order.quantity,
    amount: order.amount,
  }
}

function resolveDashboardStoreName(dto: VendorDashboardResponseDto): string | undefined {
  const approved = dto.stores.filter((store) => store.status === 'approved')
  if (approved.length === 1) return approved[0].name
  if (approved.length === 0 && dto.stores.length === 1) return dto.stores[0].name
  return undefined
}

function buildDashboardFinanceMeta(
  dto: VendorDashboardResponseDto,
): Pick<FinanceSnapshot, 'storeName' | 'period' | 'totals' | 'plans'> {
  const asOf = localDate()
  const { month, label } = formatJalaliMonthYear(asOf)
  return {
    storeName: resolveDashboardStoreName(dto),
    period: { asOf, month, label },
    totals: {
      net: dto.financial.net_period_revenue,
      paid: dto.financial.received_payout,
      pending: dto.financial.pending_payout,
      available: dto.financial.available_balance,
    },
    plans: {
      current: mapDashboardPlan(dto.financial.plan),
      options: [],
      history: [],
    },
  }
}

async function tryListActiveReservations(
  signal?: AbortSignal,
): Promise<{ ok: true; items: FinanceReservation[] } | { ok: false; error: unknown }> {
  try {
    const orders = await listVendorReservations(signal)
    return { ok: true, items: orders.filter(isActiveReservation).map(toFinanceReservation) }
  } catch (error) {
    return { ok: false, error }
  }
}

async function loadLiveFinance(
  section: FinanceSection,
  signal?: AbortSignal,
): Promise<FinanceSnapshot> {
  if (section === 'transactions') {
    // No backend financial ledger endpoint exists yet across PRs #22, #28, or main.
    return {}
  }

  if (section === 'plans' || section === 'settlements') {
    const dashboard = await fetchVendorDashboard({ recentLimit: 1, signal })
    if (!dashboard) return {}
    const meta = buildDashboardFinanceMeta(dashboard)
    return section === 'plans'
      ? { storeName: meta.storeName, period: meta.period, plans: meta.plans }
      : { storeName: meta.storeName, period: meta.period, totals: meta.totals }
  }

  const [dashboard, reservationsResult] = await Promise.all([
    fetchVendorDashboard({ recentLimit: 50, signal }),
    tryListActiveReservations(signal),
  ])

  if (!dashboard) {
    if (!reservationsResult.ok) throw reservationsResult.error
    return { reservations: reservationsResult.items }
  }

  const meta = buildDashboardFinanceMeta(dashboard)
  let reservations: FinanceReservation[]
  if (reservationsResult.ok) {
    reservations = reservationsResult.items
  } else if (
    reservationsResult.error instanceof ApiError &&
    [404, 405, 501].includes(reservationsResult.error.status)
  ) {
    reservations = dashboard.recent_reservations
      .map(mapRecentReservation)
      .filter(isActiveReservation)
      .map(toFinanceReservation)
  } else {
    throw reservationsResult.error
  }

  return {
    storeName: meta.storeName,
    period: meta.period,
    totals: meta.totals,
    plans: meta.plans,
    reservations,
  }
}

export const vendorFinanceSource: FinanceSource = {
  load: loadLiveFinance,
}

import type { FinanceSection } from './navigation'
import type { TransactionData } from './transactions'

export type FinanceTotals = {
  gross: number
  commission: number
  net: number
  paid: number
  pending: number
  available: number
}

export type FinanceReservation = { id: string; customer: string; quantity: number; amount: number }
export type SalesInterval = { firstDay: number; lastDay: number; amount: number }

export type FinancePlan = {
  id: string
  name: string
  monthlyPrice: number
  days: number
  commission: number
  stores: number
  products: number
  features: string
}

export type CurrentPlan = {
  offer: FinancePlan
  from: string
  to: string
  daysLeft: number
  pendingUpgrade: FinancePlan | null
}

export type PlanHistoryEntry = {
  id: string
  title: string
  description: string
  status: 'active' | 'pending' | 'expired'
}

export type PlansData = {
  current: CurrentPlan
  options: readonly FinancePlan[]
  history: readonly PlanHistoryEntry[]
}

export type Settlement = {
  id: string
  amount: number
  status: 'pending' | 'paid'
  date: string
  description: string
}

export type PayoutInput = { amount: number; accountHolder: string; iban: string }

// View data, not a server DTO. Missing fields mean an unavailable source, not zero.
// Amounts are in toman; dates are Gregorian store calendar days.
export type FinanceSnapshot = {
  storeName?: string
  period?: { month: string; label: string; asOf: string }
  totals?: FinanceTotals
  reservations?: readonly FinanceReservation[]
  sales?: readonly SalesInterval[]
  plans?: PlansData
  settlements?: readonly Settlement[]
  transactions?: TransactionData
}

export type FinanceSource = {
  load: (section: FinanceSection, signal?: AbortSignal) => Promise<FinanceSnapshot>
  requestUpgrade?: (planId: string) => Promise<FinanceSnapshot>
  requestPayout?: (input: PayoutInput) => Promise<FinanceSnapshot>
}

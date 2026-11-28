export const TRANSACTION_TYPES = {
  reservation: 'رزرو',
  settlement: 'تسویه',
  sale: 'فروش',
  fee: 'کارمزد',
  subscription: 'اشتراک',
} as const

export const TRANSACTION_STATUSES = {
  active: { label: 'فعال', badge: 'info' },
  pending: { label: 'در انتظار واریز', badge: 'pending' },
  completed: { label: 'تکمیل‌شده', badge: 'active' },
  deducted: { label: 'کسرشده', badge: 'active' },
  paid: { label: 'واریزشده', badge: 'active' },
  cancelled: { label: 'لغوشده', badge: 'ended' },
} as const

type TransactionType = keyof typeof TRANSACTION_TYPES
type TransactionStatus = keyof typeof TRANSACTION_STATUSES

export type TransactionRecord = {
  id: string
  // Gregorian calendar day in the store's time zone (YYYY-MM-DD).
  date: string
  type: TransactionType
  status: TransactionStatus
  amount: number // toman
  title: string
  description: string
}

type TransactionPeriod = { id: string; from: string; to: string }

export type TransactionData = {
  context: string
  records: readonly TransactionRecord[]
  // The first interval is selected on initial entry.
  periods: readonly TransactionPeriod[]
}

export function readTransactionFilters(
  params: URLSearchParams,
  periods: readonly TransactionPeriod[],
) {
  const type = params.get('type')
  const status = params.get('status')
  const period = params.get('period')
  return {
    type:
      type && Object.hasOwn(TRANSACTION_TYPES, type) ? (type as TransactionType) : ('all' as const),
    status:
      status && Object.hasOwn(TRANSACTION_STATUSES, status)
        ? (status as TransactionStatus)
        : ('all' as const),
    period: period === 'all' ? undefined : (periods.find(({ id }) => id === period) ?? periods[0]),
  }
}

export function filterTransactions(
  records: readonly TransactionRecord[],
  { type, status, period }: ReturnType<typeof readTransactionFilters>,
) {
  return records.filter(
    (record) =>
      (type === 'all' || type === record.type) &&
      (status === 'all' || status === record.status) &&
      (!period || (record.date >= period.from && record.date <= period.to)),
  )
}

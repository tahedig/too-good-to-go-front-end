import { formatPrice } from '@/lib/format'
import { formatJalaliDate } from '@/lib/vendorDates'
import { previewTransactions } from './previewTransactions'
import { validatePayout } from './payoutValidation'
import type { FinancePlan, FinanceSnapshot, FinanceSource, Settlement } from './financeTypes'
import type { TransactionRecord } from './transactions'

const storeName = 'نان صبحگاهی'
const period = { month: 'مهر', label: 'مهر ۱۴۰۵', asOf: '2026-10-19' }
const start = '2026-09-23'
const end = '2026-10-22'
const sales = [
  { firstDay: 1, lastDay: 6, amount: 200000 },
  { firstDay: 7, lastDay: 12, amount: 400000 },
  { firstDay: 13, lastDay: 18, amount: 320000 },
  { firstDay: 19, lastDay: 24, amount: 560000 },
  { firstDay: 25, lastDay: 27, amount: 520000 },
]
const options: readonly FinancePlan[] = [
  {
    id: 'basic',
    name: 'پایه',
    monthlyPrice: 0,
    days: 30,
    commission: 10,
    stores: 1,
    products: 5,
    features: 'گزارش فروش و مدیریت سفارشات',
  },
  {
    id: 'professional',
    name: 'حرفه‌ای',
    monthlyPrice: 490000,
    days: 30,
    commission: 7,
    stores: 3,
    products: 20,
    features: 'گزارش تفصیلی و پشتیبانی اولویت‌دار',
  },
  {
    id: 'premium',
    name: 'ویژه',
    monthlyPrice: 990000,
    days: 30,
    commission: 5,
    stores: 10,
    products: 100,
    features: 'گزارش تجمیعی شعب و پشتیبانی ویژه',
  },
]
const basic = options[0]
const baseSettlements: readonly Settlement[] = [
  {
    id: 'settlement-request',
    amount: 500000,
    status: 'pending',
    date: '2026-10-18',
    description: 'از خالص فروش مهر · در صف بررسی',
  },
  {
    id: 'settlement',
    amount: 1000000,
    status: 'paid',
    date: '2026-10-16',
    description: 'از خالص فروش مهر',
  },
]

// Development-only session state. Refreshing resets it; no bank details are persisted.
let pendingUpgrade = options[1]
let extraSettlements: Settlement[] = []

function snapshot(): FinanceSnapshot {
  const settlements = [...extraSettlements, ...baseSettlements]
  const gross = sales.reduce((total, interval) => total + interval.amount, 0)
  const commission = (gross * basic.commission) / 100
  const net = gross - commission
  const paid = settlements
    .filter((entry) => entry.status === 'paid')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pending = settlements
    .filter((entry) => entry.status === 'pending')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const extraTransactions: TransactionRecord[] = extraSettlements.map((entry) => ({
    id: entry.id,
    status: entry.status,
    date: entry.date,
    amount: entry.amount,
    type: 'settlement',
    title: 'درخواست تسویه نمونه',
    description: entry.description,
  }))

  return {
    storeName,
    period,
    totals: { gross, commission, net, paid, pending, available: net - paid - pending },
    sales,
    reservations: [
      { id: 'reservation-leila', customer: 'لیلا علیزاده', quantity: 1, amount: 40000 },
      { id: 'reservation-negar', customer: 'نگار', quantity: 2, amount: 80000 },
    ],
    plans: {
      current: { offer: basic, from: start, to: end, daysLeft: 3, pendingUpgrade },
      options,
      history: [
        {
          id: 'upgrade',
          title: `درخواست ارتقا به ${pendingUpgrade.name}`,
          status: 'pending',
          description: `${formatJalaliDate(period.asOf)} · ${formatPrice(pendingUpgrade.monthlyPrice)} · ماهانه`,
        },
        {
          id: 'current',
          title: 'فعال‌سازی پایه',
          status: 'active',
          description: `${formatJalaliDate(start)} · رایگان · تا ${formatJalaliDate(end)}`,
        },
        {
          id: 'previous',
          title: 'دوره پیشین پایه',
          status: 'expired',
          description: '۱ شهریور ۱۴۰۵ · رایگان · پایان ۳۱ شهریور ۱۴۰۵',
        },
      ],
    },
    settlements,
    transactions: {
      ...previewTransactions,
      records: [...extraTransactions, ...previewTransactions.records],
    },
  }
}

export const previewFinanceSource: FinanceSource = {
  async load() {
    return snapshot()
  },
  async requestUpgrade(planId) {
    const next = options.find(({ id }) => id === planId)
    if (!next || next.id === basic.id || next.id === pendingUpgrade.id) {
      throw new Error('امکان ثبت این درخواست نمونه وجود ندارد.')
    }
    pendingUpgrade = next
    return snapshot()
  },
  async requestPayout(input) {
    const { input: validInput } = validatePayout(
      { ...input, amount: String(input.amount) },
      snapshot().totals?.available ?? 0,
    )
    if (!validInput) throw new Error('مبلغ یا اطلاعات آزمایشی واردشده معتبر نیست.')
    extraSettlements = [
      {
        id: `preview-settlement-${extraSettlements.length + 1}`,
        amount: validInput.amount,
        status: 'pending',
        date: period.asOf,
        description: 'درخواست آزمایشی · بدون ارسال به بانک',
      },
      ...extraSettlements,
    ]
    return snapshot()
  },
}

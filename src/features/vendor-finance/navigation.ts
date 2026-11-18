export const FINANCE_ITEMS = [
  ['overview', 'مرور کلی'],
  ['plans', 'طرح‌ها'],
  ['transactions', 'تراکنش‌ها'],
  ['settlements', 'تسویه‌ها'],
] as const

export type FinanceSection = (typeof FINANCE_ITEMS)[number][0]

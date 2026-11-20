export const FINANCE_ITEMS = [
  ['overview', 'مرور کلی'],
  ['plans', 'طرح‌ها'],
  ['transactions', 'تراکنش‌ها'],
  ['settlements', 'تسویه‌ها'],
] as const

export type FinanceSection = (typeof FINANCE_ITEMS)[number][0]

// Keep an explicit opt-in or opt-out when moving between finance sections.
export function financePreviewSearch(search: string | URLSearchParams): string {
  if (!import.meta.env.DEV) return ''
  const flag = new URLSearchParams(search).get('preview')
  return flag === '1' || flag === '0' ? `?preview=${flag}` : ''
}

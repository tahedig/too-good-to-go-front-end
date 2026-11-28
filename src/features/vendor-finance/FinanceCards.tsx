import type { ComponentProps, ReactNode } from 'react'
import { Info } from 'lucide-react'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber, formatPrice } from '@/lib/format'
import { formatJalaliDateRange } from '@/lib/vendorDates'
import type { CurrentPlan, FinanceTotals } from './financeTypes'

export const financeCard =
  'flex min-w-0 flex-col gap-4 rounded-lg border border-border-default bg-surface p-5'
export const financeHeading = 'text-title-md font-bold'

export function FinanceBadge(props: Pick<ComponentProps<typeof StatusBadge>, 'status' | 'label'>) {
  return <StatusBadge {...props} compact className="w-fit font-normal! leading-4!" />
}

export function FinanceNotice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warning'
  children: ReactNode
}) {
  return (
    <InlineAlert
      tone={tone}
      icon={Info}
      className={`flex-row-reverse items-center! ${tone === 'info' ? 'bg-info-subtle! text-info!' : 'text-warning!'} [&>svg]:text-text-primary`}
    >
      {children}
    </InlineAlert>
  )
}

export function FinanceMoney({ amount }: { amount?: number }) {
  if (amount !== undefined) return formatPrice(amount)
  return (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">در دسترس نیست</span>
    </>
  )
}

export function FinanceMetrics({
  totals,
  settlements = false,
}: {
  totals?: FinanceTotals
  settlements?: boolean
}) {
  const items = [
    {
      label: 'در انتظار واریز',
      value: totals?.pending,
      order: settlements ? 'lg:order-2' : 'lg:order-3',
    },
    {
      label: settlements ? 'قابل درخواست' : 'قابل برداشت',
      value: totals?.available,
      order: 'lg:order-last',
    },
    ...(settlements ? [] : [{ label: 'خالص دوره', value: totals?.net, order: 'lg:order-1' }]),
    {
      label: 'واریزشده',
      value: totals?.paid,
      order: settlements ? 'col-span-2 lg:col-span-1 lg:order-1' : 'lg:order-2',
    },
  ]

  return (
    <dl
      aria-label="خلاصه موجودی"
      className={`grid grid-cols-2 gap-3 ${settlements ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}
    >
      {items.map(({ label, value, order }) => (
        <div
          key={label}
          className={`flex min-h-20 min-w-0 flex-col justify-between gap-2 rounded-[12px] bg-surface px-4 py-3 ${settlements ? 'lg:gap-3 lg:pt-4 lg:pb-1' : 'lg:min-h-[99px] lg:py-4'} ${order}`}
        >
          <dt className="text-caption font-normal">{label}</dt>
          <dd className="text-title-md font-bold wrap-anywhere lg:text-price-lg">
            <FinanceMoney amount={value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

type Detail = { label: string; value: ReactNode; strong?: boolean }

export function FinanceDetails({
  rows,
  columns = false,
}: {
  rows: readonly Detail[]
  columns?: boolean
}) {
  return (
    <dl className="flex flex-col gap-4">
      {rows.map(({ label, value, strong }) => (
        <div
          key={label}
          className={`${columns ? 'grid grid-cols-2' : 'flex justify-between'} items-baseline gap-3 text-body-md`}
        >
          <dt className="min-w-0 wrap-anywhere text-text-secondary">{label}</dt>
          <dd
            className={`min-w-0 wrap-anywhere ${columns ? 'text-start' : 'text-end'} ${strong ? 'font-bold' : ''}`}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function CurrentPlanCard({ plan }: { plan?: CurrentPlan }) {
  return (
    <section className={`${financeCard} bg-primary-subtle!`} aria-labelledby="finance-current-plan">
      <h2 id="finance-current-plan" className={financeHeading}>
        {plan ? `طرح فعلی · ${plan.offer.name}` : 'طرح فعلی'}
      </h2>
      {plan ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={financeHeading}>
              {plan.offer.monthlyPrice ? formatPrice(plan.offer.monthlyPrice) : 'رایگان'} · ماهانه
            </p>
            <FinanceBadge status="info" label="فعال" />
          </div>
          <FinanceDetails
            rows={[
              { label: 'کارمزد فروش', value: `${formatNumber(plan.offer.commission)}٪` },
              { label: 'دوره اعتبار', value: formatJalaliDateRange(plan.from, plan.to) },
            ]}
          />
          <FinanceBadge status="pending" label={`${formatNumber(plan.daysLeft)} روز باقی‌مانده`} />
          {plan.pendingUpgrade && (
            <p className="text-caption font-normal text-warning">
              ارتقا به {plan.pendingUpgrade.name} · در انتظار بررسی
            </p>
          )}
        </>
      ) : (
        <p className="text-body-md text-text-secondary">
          اطلاعات اشتراک فروشگاه هنوز از سرور ارائه نمی‌شود.
        </p>
      )}
    </section>
  )
}

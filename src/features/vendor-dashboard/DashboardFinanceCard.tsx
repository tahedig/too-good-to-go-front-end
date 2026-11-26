import { ButtonLink } from '@/components/ui/Button'
import { formatNumber, formatPrice } from '@/lib/format'
import type { DashboardFinance } from '@/services/vendor/dashboardService'

function Money({ value }: { value: number | undefined }) {
  return value === undefined ? (
    <>
      <span aria-hidden="true">—</span>
      <span className="sr-only">در دسترس نیست</span>
    </>
  ) : (
    formatPrice(value)
  )
}

export function DashboardFinanceCard({ finance }: { finance: DashboardFinance | null }) {
  const plan = finance?.plan
  const amounts = [
    { label: 'پرداخت دریافتی', value: finance?.received, desktop: 'lg:hidden' },
    { label: 'درآمد خالص دوره', value: finance?.net, desktop: 'lg:order-3' },
    { label: 'در انتظار پرداخت', value: finance?.pending, desktop: 'lg:order-2' },
    {
      label: 'در دسترس',
      longLabel: 'موجودی قابل برداشت',
      value: finance?.available,
      desktop: 'lg:order-1',
    },
  ]
  const planRows = [
    ['طرح فعلی', plan?.name],
    ['کارمزد', plan ? `${formatNumber(plan.commission)}٪` : undefined],
    ['تمدید', plan?.renewal],
  ]
  const planTitle = plan?.name ?? 'اطلاعات طرح در دسترس نیست'

  return (
    <section
      aria-labelledby="vendor-finance-heading"
      className="flex min-h-[407px] min-w-0 flex-col gap-3 rounded-lg border border-border-default bg-surface p-4 lg:grid lg:min-h-[372px] lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:content-start lg:gap-4 lg:p-6"
    >
      <header className="flex min-h-8 items-center justify-between gap-2 lg:col-start-2 lg:row-start-1 lg:w-full lg:max-w-80 lg:justify-self-end">
        {plan && (
          <span className="rounded-sm bg-primary-subtle px-2 py-1 text-caption font-semibold leading-[19px] lg:hidden">
            {plan.name}
          </span>
        )}
        <h2 id="vendor-finance-heading" className="ms-auto text-title-md lg:ms-0">
          مالی
        </h2>
      </header>

      <dl className="flex flex-col gap-2 lg:col-span-full lg:row-start-2 lg:grid lg:w-full lg:max-w-[684px] lg:grid-cols-3 lg:gap-3">
        {amounts.map(({ label, longLabel, value, desktop }) => (
          <div
            key={label}
            className={`flex min-w-0 items-baseline justify-between gap-2 lg:min-h-24 lg:flex-col lg:items-start lg:justify-center lg:rounded-md lg:border lg:border-border-default lg:p-4 ${desktop}`}
          >
            <dt className="text-body-md text-text-secondary lg:text-caption lg:font-semibold">
              <span className={longLabel ? 'lg:hidden' : undefined}>{label}</span>
              {longLabel && <span className="hidden lg:inline">{longLabel}</span>}
            </dt>
            <dd className="text-body-lg font-bold lg:text-price-lg">
              <Money value={value} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg bg-primary-subtle p-3 lg:col-start-1 lg:row-start-1 lg:flex lg:min-h-[114px] lg:flex-col lg:justify-center lg:rounded-md lg:border lg:border-border-default lg:bg-surface-sage lg:p-4">
        <dl className="flex flex-col gap-2 lg:hidden">
          {planRows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-2 text-body-md">
              <dt className="shrink-0 text-text-secondary">{label}</dt>
              <dd className="text-end font-semibold">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="hidden flex-col gap-2 lg:flex">
          <p className="text-label-md">{planTitle}</p>
          {plan && (
            <>
              <p className="text-body-md text-text-secondary">تمدید: {plan.renewal}</p>
              <p className="text-body-md text-text-secondary">
                کارمزد: {formatNumber(plan.commission)}٪
              </p>
            </>
          )}
        </div>
        {!finance && (
          <p className="mt-2 text-caption text-text-secondary">
            اطلاعات طرح و تسویه هنوز از سرور ارائه نمی‌شود.
          </p>
        )}
      </div>

      <ButtonLink
        to="/vendor/finance/plans"
        variant="secondary"
        size="md"
        className="h-[46px]! justify-start! px-3! lg:col-span-full lg:row-start-3 lg:w-55"
      >
        مدیریت طرح
      </ButtonLink>
    </section>
  )
}

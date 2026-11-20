import { Button, ButtonLink } from '@/components/ui/Button'
import { formatNumber, formatPrice } from '@/lib/format'
import {
  CurrentPlanCard,
  FinanceBadge,
  FinanceDetails,
  FinanceMetrics,
  FinanceMoney,
  financeCard,
  financeHeading,
} from './FinanceCards'
import type { FinanceSection } from './navigation'
import type { FinanceReservation, FinanceSnapshot, SalesInterval } from './financeTypes'

export type ReservationsState =
  | { kind: 'loading' }
  | { kind: 'unavailable' }
  | { kind: 'auth' }
  | { kind: 'error'; retry: () => void }
  | { kind: 'ready'; items: readonly FinanceReservation[] }

function ActiveReservations({ state }: { state: ReservationsState }) {
  return (
    <section className={financeCard} aria-labelledby="finance-reservations">
      <h2 id="finance-reservations" className={financeHeading}>
        رزروهای فعال
      </h2>
      {state.kind === 'ready' && state.items.length > 0 ? (
        <>
          <FinanceBadge status="info" label="فعال" />
          <p className="text-price-lg wrap-anywhere">
            {formatPrice(state.items.reduce((sum, item) => sum + item.amount, 0))}
          </p>
          <p className="text-caption font-normal text-text-secondary">رزروهای تحویل‌نشده</p>
          <ul className="flex flex-col gap-4">
            {state.items.map(({ id, customer, quantity, amount }) => (
              <li key={id} className="grid grid-cols-2 items-baseline gap-3 text-body-md">
                <span className="min-w-0 wrap-anywhere text-text-secondary">
                  {customer} · {formatNumber(quantity)} بسته
                </span>
                <span className="min-w-0 wrap-anywhere">{formatPrice(amount)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <p role="status" className="text-body-md text-text-secondary">
            {state.kind === 'ready' && 'رزرو فعالی برای تحویل وجود ندارد.'}
            {state.kind === 'loading' && 'در حال دریافت رزروهای فعال…'}
            {state.kind === 'unavailable' && 'اطلاعات رزروهای فعال هنوز از سرور ارائه نمی‌شود.'}
            {state.kind === 'auth' && 'برای مشاهدهٔ رزروها با حساب فروشنده وارد شوید.'}
            {state.kind === 'error' && 'دریافت رزروهای فعال انجام نشد. دوباره تلاش کنید.'}
          </p>
          {state.kind === 'auth' && (
            <ButtonLink to="/login" variant="secondary" size="md" className="self-start">
              ورود
            </ButtonLink>
          )}
          {state.kind === 'error' && (
            <Button onClick={state.retry} variant="secondary" size="md" className="self-start">
              تلاش دوباره
            </Button>
          )}
        </>
      )}
    </section>
  )
}

function SalesChart({ sales, month }: { sales?: readonly SalesInterval[]; month?: string }) {
  const step =
    Math.max(1, Math.ceil(Math.max(0, ...(sales ?? []).map(({ amount }) => amount)) / 300000)) *
    100000
  const ticks = [0, step, 2 * step, 3 * step]
  const ceiling = 3 * step
  return (
    <section className={financeCard} aria-labelledby="finance-sales-chart">
      <h2 id="finance-sales-chart" className={financeHeading}>
        فروش تکمیل‌شده{month ? ` در ${month}` : ''}
      </h2>
      {sales?.length ? (
        <>
          <p className="text-caption font-normal text-text-secondary">فروش ناخالص · هزار تومان</p>
          <ol className="sr-only" aria-label="مبلغ فروش به تفکیک بازه">
            {sales.map(({ firstDay, lastDay, amount }) => (
              <li key={firstDay}>
                {formatNumber(firstDay)} تا {formatNumber(lastDay)} {month}، {formatPrice(amount)}
              </li>
            ))}
          </ol>
          <div
            aria-hidden="true"
            className="mt-7 grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-2 lg:grid-cols-[2.25rem_minmax(0,1fr)]"
          >
            <div className="relative col-start-1 row-start-1 text-caption font-normal text-text-secondary">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute inset-s-0 translate-y-1/2"
                  style={{ bottom: `${(tick / ceiling) * 100}%` }}
                >
                  {formatNumber(tick / 1000)}
                </span>
              ))}
            </div>
            <div className="relative col-start-2 row-start-1 flex h-41 items-end gap-2.5">
              {ticks.map((tick) => (
                <div
                  key={tick}
                  className="absolute inset-x-0 border-t border-border-default"
                  style={{ bottom: `${(tick / ceiling) * 100}%` }}
                />
              ))}
              {sales.map(({ firstDay, amount }) => (
                <div
                  key={firstDay}
                  className="relative min-w-0 flex-1 rounded-t-sm bg-primary"
                  style={{ height: `${(amount / ceiling) * 100}%` }}
                >
                  <span className="absolute inset-x-0 bottom-full mb-1 text-center text-caption font-semibold">
                    {formatNumber(amount / 1000)}
                  </span>
                </div>
              ))}
            </div>
            <div className="col-start-2 row-start-2 flex gap-2.5 text-center text-caption font-normal text-text-secondary">
              {sales.map(({ firstDay, lastDay }) => (
                <span key={firstDay} className="min-w-0 flex-1" dir="ltr">
                  {formatNumber(firstDay)}–{formatNumber(lastDay)}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-body-md text-text-secondary">
          {sales
            ? 'فروش تکمیل‌شده‌ای در این دوره وجود ندارد.'
            : 'گزارش فروش تکمیل‌شده هنوز از سرور ارائه نمی‌شود.'}
        </p>
      )}
    </section>
  )
}

export function OverviewPanel({
  data,
  reservations,
  href,
}: {
  data?: FinanceSnapshot
  reservations: ReservationsState
  href: (section: FinanceSection) => string
}) {
  return (
    <>
      <FinanceMetrics totals={data?.totals} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid min-w-0 gap-6 lg:col-start-2 lg:row-start-1">
          <section className={financeCard} aria-labelledby="finance-period-account">
            <h2 id="finance-period-account" className="text-price-md leading-6">
              حساب دوره{data?.period && ` · ${data.period.label}`}
            </h2>
            <FinanceDetails
              columns
              rows={[
                { label: 'فروش ناخالص', value: <FinanceMoney amount={data?.totals?.gross} /> },
                {
                  label: 'کمیسیون پلتفرم',
                  value: <FinanceMoney amount={data?.totals?.commission} />,
                },
              ]}
            />
          </section>
          <ActiveReservations state={reservations} />
        </div>
        <div className="grid min-w-0 gap-6 lg:col-start-1 lg:row-start-1">
          <SalesChart sales={data?.sales} month={data?.period?.month} />
          <CurrentPlanCard plan={data?.plans?.current} />
          <div className="grid grid-cols-2 gap-3 lg:flex">
            <ButtonLink
              to={`${href('settlements')}#settlement-request`}
              className="px-2 font-normal sm:px-6 lg:px-6"
            >
              درخواست تسویه
            </ButtonLink>
            <ButtonLink
              to={href('plans')}
              variant="secondary"
              className="px-2 font-normal sm:px-6 lg:px-6"
            >
              مدیریت طرح
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  )
}

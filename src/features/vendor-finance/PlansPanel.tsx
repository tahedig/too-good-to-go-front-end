import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { formatNumber, formatPrice } from '@/lib/format'
import {
  CurrentPlanCard,
  FinanceBadge,
  FinanceNotice,
  financeCard,
  financeHeading,
} from './FinanceCards'
import type { FinancePlan, PlansData } from './financeTypes'

const planPrice = (price: number) => (price ? formatPrice(price) : 'رایگان')

const historyStatus = {
  pending: { status: 'pending', label: 'در انتظار بررسی' },
  active: { status: 'info', label: 'فعال' },
  expired: { status: 'active', label: 'پایان‌یافته' },
} as const

export function PlansPanel({
  data,
  preview,
  requestUpgrade,
}: {
  data?: PlansData
  preview: boolean
  requestUpgrade?: (planId: string) => Promise<void>
}) {
  const [selection, setSelection] = useState<FinancePlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [message, setMessage] = useState('')
  const current = data?.current
  const pending = current?.pendingUpgrade

  async function confirmUpgrade() {
    if (!requestUpgrade || !selection || saving) return
    setSaving(true)
    setError(undefined)
    try {
      await requestUpgrade(selection.id)
      setSelection(null)
      setMessage(
        preview
          ? 'درخواست نمونه به‌روز شد. طرح واقعی تغییری نکرد و چیزی به سرور ارسال نشد.'
          : 'درخواست ارتقا ثبت شد.',
      )
    } catch {
      setError('ثبت درخواست تأیید نشد. دوباره تلاش کنید.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {pending && (
          <div className="lg:col-start-2 lg:row-start-1">
            <FinanceNotice tone="warning">
              درخواست ارتقا به {pending.name} در انتظار بررسی است؛ طرح {current.offer.name} همچنان
              فعال است.
            </FinanceNotice>
          </div>
        )}
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <CurrentPlanCard plan={current} />
        </div>
      </div>
      {message && <InlineAlert tone="success">{message}</InlineAlert>}
      {data &&
        (data.options.length > 0 ? (
          <section
            aria-label="مقایسهٔ طرح‌ها"
            className="grid auto-rows-fr gap-4 lg:grid-cols-3 lg:gap-6"
          >
            {data.options.map((plan) => {
              const isCurrent = plan.id === data.current.offer.id
              const isPending = plan.id === pending?.id
              const badge = isCurrent
                ? ({ status: 'info', label: 'طرح فعلی' } as const)
                : isPending
                  ? ({ status: 'pending', label: 'درخواست در انتظار بررسی' } as const)
                  : requestUpgrade
                    ? ({ status: 'active', label: 'قابل درخواست' } as const)
                    : ({ status: 'inactive', label: 'غیرقابل درخواست' } as const)
              return (
                <article
                  key={plan.id}
                  className={`${financeCard} ${isCurrent ? 'bg-primary-subtle! ring-2 ring-inset ring-primary' : ''}`}
                >
                  <h2 className={financeHeading}>{plan.name}</h2>
                  <FinanceBadge {...badge} />
                  <p className="text-price-lg">{planPrice(plan.monthlyPrice)}</p>
                  <p className="text-caption font-normal text-text-secondary">
                    ماهانه · {formatNumber(plan.days)} روز
                  </p>
                  <dl className="flex items-baseline justify-between gap-3 text-body-md">
                    <dt className="text-text-secondary">کارمزد هر فروش</dt>
                    <dd className="font-bold">{formatNumber(plan.commission)}٪</dd>
                  </dl>
                  <ul className="flex flex-1 flex-col gap-4 text-body-md">
                    <li>{formatNumber(plan.stores)} فروشگاه</li>
                    <li>{formatNumber(plan.products)} محصول فعال</li>
                    <li className="text-text-secondary">{plan.features}</li>
                  </ul>
                  <Button
                    variant="secondary"
                    fullWidth
                    className="font-normal"
                    disabled={isCurrent || isPending || !requestUpgrade}
                    onClick={() => {
                      setMessage('')
                      setError(undefined)
                      setSelection(plan)
                    }}
                  >
                    {isCurrent ? 'طرح فعال' : isPending ? 'درخواست ثبت شده' : 'درخواست ارتقا'}
                  </Button>
                </article>
              )
            })}
          </section>
        ) : (
          <FinanceNotice>فهرست طرح‌های قابل ارتقا هنوز از سرویس مالی ارائه نمی‌شود.</FinanceNotice>
        ))}
      <section className={financeCard} aria-labelledby="finance-plan-history">
        <h2 className={financeHeading} id="finance-plan-history">
          تاریخچه طرح‌ها
        </h2>
        {data?.history.length ? (
          <ul className="divide-y divide-border-default">
            {data.history.map(({ id, title, description, status }) => (
              <li
                key={id}
                className="flex items-start justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 flex-col gap-2 wrap-anywhere">
                  <p className="text-label-md font-bold">{title}</p>
                  <p className="text-caption font-normal text-text-secondary">{description}</p>
                </div>
                <span className="shrink-0">
                  <FinanceBadge {...historyStatus[status]} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-md text-text-secondary">
            {data?.options.length
              ? 'هنوز سابقه‌ای برای طرح‌ها ثبت نشده است.'
              : 'تاریخچهٔ طرح‌ها هنوز از سرور ارائه نمی‌شود.'}
          </p>
        )}
      </section>
      <ConfirmDialog
        open={selection !== null}
        onClose={() => setSelection(null)}
        onConfirm={() => void confirmUpgrade()}
        title={preview ? 'درخواست ارتقای آزمایشی' : 'درخواست ارتقا'}
        description={
          selection
            ? [
                `درخواست ارتقا به طرح ${selection.name} با هزینهٔ ${planPrice(selection.monthlyPrice)} در ماه.`,
                pending && `این درخواست جایگزین درخواست در انتظار برای طرح ${pending.name} می‌شود.`,
                preview && 'این کار فقط در پیش‌نمایش انجام می‌شود.',
              ]
                .filter(Boolean)
                .join(' ')
            : undefined
        }
        confirmLabel={preview ? 'ثبت درخواست نمونه' : 'تأیید درخواست ارتقا'}
        isLoading={saving}
        error={error}
      />
    </>
  )
}

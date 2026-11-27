import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { formatNumber, formatPrice } from '@/lib/format'
import { formatJalaliDate } from '@/lib/vendorDates'
import {
  FinanceBadge,
  FinanceDetails,
  FinanceMetrics,
  FinanceMoney,
  FinanceNotice,
  financeCard,
  financeHeading,
} from './FinanceCards'
import { TRANSACTION_STATUSES } from './transactions'
import { validatePayout } from './payoutValidation'
import type { FinanceSnapshot, FinanceTotals, PayoutInput, Settlement } from './financeTypes'

function SettlementHistory({ items }: { items?: readonly Settlement[] }) {
  return (
    <section className={financeCard} aria-labelledby="finance-settlement-history">
      <h2 id="finance-settlement-history" className={financeHeading}>
        درخواست‌های تسویه
      </h2>
      {items?.length ? (
        <ul className="divide-y divide-border-default">
          {items.map(({ id, amount, status, date, description }) => {
            const { badge, label } = TRANSACTION_STATUSES[status]
            return (
              <li key={id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className={`${financeHeading} min-w-0 wrap-anywhere`}>{formatPrice(amount)}</p>
                  <FinanceBadge status={badge} label={label} />
                </div>
                <FinanceDetails
                  rows={[
                    {
                      label: status === 'pending' ? 'تاریخ درخواست' : 'تاریخ واریز',
                      value: <time dateTime={date}>{formatJalaliDate(date)}</time>,
                    },
                  ]}
                />
                <p className="text-caption font-normal text-text-secondary">{description}</p>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-body-md text-text-secondary">
          {items
            ? 'هنوز درخواست تسویه‌ای ثبت نشده است.'
            : 'تاریخچهٔ تسویه‌ها هنوز از سرور ارائه نمی‌شود.'}
        </p>
      )}
    </section>
  )
}

function BalanceCard({ totals }: { totals?: FinanceTotals }) {
  return (
    <section className={financeCard} aria-labelledby="finance-period-balance">
      <h2 id="finance-period-balance" className={financeHeading}>
        مانده دوره
      </h2>
      <FinanceDetails
        rows={[
          {
            label: 'خالص فروش تکمیل‌شده',
            value: <FinanceMoney amount={totals?.net} />,
            strong: true,
          },
          {
            label: 'واریزشده + در انتظار',
            value: <FinanceMoney amount={totals && totals.paid + totals.pending} />,
          },
          {
            label: 'قابل درخواست',
            value: <FinanceMoney amount={totals?.available} />,
            strong: true,
          },
        ]}
      />
    </section>
  )
}

const emptyFields = { amount: '', accountHolder: '', iban: '' }
type FieldName = keyof typeof emptyFields

function SettlementForm({
  available,
  preview,
  requestPayout,
}: {
  available?: number
  preview: boolean
  requestPayout?: (input: PayoutInput) => Promise<number | undefined>
}) {
  const [fields, setFields] = useState({
    ...emptyFields,
    amount: available === undefined ? '' : formatNumber(available),
  })
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<'error' | 'success' | null>(null)
  const enabled = Boolean(requestPayout && available !== undefined && available > 0)
  const { errors, input } = validatePayout(fields, available ?? 0)

  function field(name: FieldName) {
    return {
      name,
      value: fields[name],
      error: touched[name] ? errors[name] : undefined,
      disabled: !enabled || saving,
      autoComplete: 'off',
      'aria-required': enabled,
      onChange: (event: ChangeEvent<HTMLInputElement>) => {
        setFields((current) => ({ ...current, [name]: event.target.value }))
        setResult(null)
      },
      onBlur: () => setTouched((current) => ({ ...current, [name]: true })),
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!enabled || !input || !requestPayout || saving) return
    setSaving(true)
    setResult(null)
    try {
      const remaining = await requestPayout(input)
      setFields({ ...emptyFields, amount: remaining === undefined ? '' : formatNumber(remaining) })
      setTouched({})
      setResult('success')
    } catch {
      setResult('error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className={`${financeCard} scroll-mt-20`}
      id="settlement-request"
      aria-labelledby="finance-request-heading"
      tabIndex={-1}
    >
      <h2 id="finance-request-heading" className={financeHeading}>
        درخواست تسویه
      </h2>
      <p className="text-body-md text-text-secondary" id="finance-request-description">
        {requestPayout
          ? 'مبلغ و اطلاعات بانکی را تکمیل کنید.'
          : 'ثبت درخواست به اتصال سرویس تسویه نیاز دارد.'}
      </p>
      <form
        className="flex flex-col gap-4"
        aria-describedby="finance-request-description"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        <Input
          {...field('amount')}
          variant="subtle"
          label="مبلغ درخواست · تومان"
          inputMode="numeric"
          maxLength={24}
        />
        <Input
          {...field('accountHolder')}
          variant="subtle"
          label="نام دارنده حساب"
          placeholder="نام دارنده حساب را وارد کنید"
          maxLength={120}
        />
        <Input
          {...field('iban')}
          variant="subtle"
          label="شماره شبا"
          placeholder="شماره شبا را وارد کنید"
          ltrValue
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={42}
        />
        <p className="text-caption font-normal text-text-secondary">
          {!requestPayout
            ? 'در حال حاضر امکان ارسال اطلاعات بانکی وجود ندارد.'
            : !enabled
              ? 'موجودی قابل درخواست ندارید.'
              : 'اطلاعات بانکی ثبت نشده است.'}
          {preview && enabled && ' در پیش‌نمایش از اطلاعات آزمایشی استفاده کنید.'}
        </p>
        {result === 'error' && (
          <InlineAlert tone="error">ثبت درخواست تأیید نشد. دوباره تلاش کنید.</InlineAlert>
        )}
        {result === 'success' && (
          <InlineAlert tone="success">
            {preview
              ? 'درخواست نمونه به تاریخچه اضافه شد. اطلاعات بانکی ارسال نشد و واریزی انجام نمی‌شود.'
              : 'درخواست تسویه ثبت شد.'}
          </InlineAlert>
        )}
        <Button
          type="submit"
          fullWidth
          className="font-normal"
          disabled={!enabled || !input}
          isLoading={saving}
        >
          ثبت درخواست تسویه
        </Button>
      </form>
    </section>
  )
}

export function SettlementsPanel({
  data,
  preview,
  requestPayout,
}: {
  data?: FinanceSnapshot
  preview: boolean
  requestPayout?: (input: PayoutInput) => Promise<number | undefined>
}) {
  return (
    <>
      <FinanceMetrics totals={data?.totals} settlements />
      <FinanceNotice>
        {requestPayout
          ? 'ثبت درخواست پس از تکمیل اطلاعات بانکی'
          : 'سرویس تسویه هنوز در دسترس نیست؛ امکان ثبت درخواست وجود ندارد.'}
      </FinanceNotice>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,13fr)_minmax(0,20fr)] lg:items-start">
        <div className="grid min-w-0 gap-6 lg:col-start-2 lg:row-start-1">
          <SettlementHistory items={data?.settlements} />
          <BalanceCard totals={data?.totals} />
        </div>
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          <SettlementForm
            available={data?.totals?.available}
            preview={preview}
            requestPayout={requestPayout}
          />
        </div>
      </div>
    </>
  )
}

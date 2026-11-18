import { useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatNumber, formatPrice } from '@/lib/format'
import { formatJalaliDate, formatJalaliDateRange } from '@/lib/vendorDates'
import {
  filterTransactions,
  readTransactionFilters,
  TRANSACTION_STATUSES,
  TRANSACTION_TYPES,
} from './transactions'
import type { TransactionData, TransactionRecord } from './transactions'

const typeOptions = [
  { value: 'all', label: 'همه تراکنش‌ها' },
  ...Object.entries(TRANSACTION_TYPES).map(([value, label]) => ({ value, label })),
]
const statusOptions = [
  { value: 'all', label: 'همه وضعیت‌ها' },
  ...Object.entries(TRANSACTION_STATUSES).map(([value, { label }]) => ({ value, label })),
]
const columns = ['تاریخ', 'نوع', 'مبلغ', 'وضعیت', 'شرح و مورد مرتبط']

function TransactionDate({ date }: { date: string }) {
  return (
    <time
      dateTime={date}
      className="text-caption font-normal text-text-secondary lg:text-label-md lg:font-normal"
    >
      {formatJalaliDate(date)}
    </time>
  )
}

function TransactionStatus({ status }: Pick<TransactionRecord, 'status'>) {
  const { label, badge } = TRANSACTION_STATUSES[status]
  return (
    <StatusBadge
      status={badge}
      label={label}
      compact
      className="font-normal! leading-4! whitespace-nowrap"
    />
  )
}

function amountColor({ status }: TransactionRecord) {
  return status === 'cancelled' ? 'text-error' : 'text-text-primary'
}

function TransactionList({ records }: { records: readonly TransactionRecord[] }) {
  const cell = 'border-b border-border-default px-3 py-4 align-middle xl:px-4'
  return (
    <>
      <ul aria-label="فهرست تراکنش‌ها" className="grid gap-3 lg:hidden">
        {records.map((record) => (
          <li
            key={record.id}
            className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-label-md font-bold">{TRANSACTION_TYPES[record.type]}</span>
              <TransactionStatus status={record.status} />
            </div>
            <p className={`text-title-md font-bold wrap-anywhere ${amountColor(record)}`}>
              {formatPrice(record.amount)}
            </p>
            <p className="text-label-md font-normal wrap-anywhere">{record.title}</p>
            <p className="text-caption font-normal text-text-secondary wrap-anywhere">
              {record.description}
            </p>
            <TransactionDate date={record.date} />
          </li>
        ))}
      </ul>
      <div className="hidden rounded-lg bg-surface p-5 lg:block">
        <table className="w-full table-fixed border-separate border-spacing-0 text-start">
          <caption className="sr-only">فهرست تراکنش‌ها</caption>
          <colgroup>
            <col className="w-27 xl:w-[12%]" />
            <col className="w-18 xl:w-[9%]" />
            <col className="w-31 xl:w-[16%]" />
            <col className="w-30 xl:w-[13%]" />
            <col />
          </colgroup>
          <thead>
            <tr>
              {columns.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="bg-primary-subtle px-3 py-4 text-start text-label-md font-bold first:rounded-s-[8px] last:rounded-e-[8px] xl:px-4"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="h-20">
                <td className={cell}>
                  <TransactionDate date={record.date} />
                </td>
                <td className={`${cell} text-label-md font-normal`}>
                  {TRANSACTION_TYPES[record.type]}
                </td>
                <td
                  className={`${cell} text-label-md font-bold wrap-anywhere ${amountColor(record)}`}
                >
                  {formatPrice(record.amount)}
                </td>
                <td className={cell}>
                  <TransactionStatus status={record.status} />
                </td>
                <td className={cell}>
                  <div className="flex flex-col gap-1 wrap-anywhere">
                    <p className="text-label-md font-bold">{record.title}</p>
                    <p className="text-caption font-normal text-text-secondary">
                      {record.description}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export function TransactionsPanel({
  data,
  previewLink,
}: {
  data: TransactionData | null | undefined
  previewLink?: string
}) {
  const [params, setParams] = useSearchParams()
  const periods = data?.periods ?? []
  const filters = readTransactionFilters(params, periods)
  const visible = data && filterTransactions(data.records, filters)
  const unavailable = data == null
  const periodOptions = [
    ...periods.map(({ id, from, to }) => ({ value: id, label: formatJalaliDateRange(from, to) })),
    { value: 'all', label: 'همه بازه‌ها' },
  ]

  function updateFilter(name: 'status' | 'type' | 'period', value: string) {
    const next = new URLSearchParams(params)
    const initial = name === 'period' ? (periods[0]?.id ?? 'all') : 'all'
    if (value === initial) next.delete(name)
    else next.set(name, value)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  function resetFilters() {
    const next = new URLSearchParams(params)
    for (const name of ['period', 'type', 'status']) next.delete(name)
    setParams(next, { replace: true, preventScrollReset: true })
  }

  return (
    <>
      <div
        role="group"
        aria-label="فیلترهای تراکنش‌ها"
        className="flex flex-col gap-6 sm:flex-row-reverse"
      >
        <Select
          variant="filter"
          className="min-w-0 flex-1"
          label="وضعیت"
          value={filters.status}
          options={statusOptions}
          disabled={unavailable}
          onChange={(event) => updateFilter('status', event.target.value)}
        />
        <Select
          variant="filter"
          className="min-w-0 flex-1"
          label="نوع تراکنش"
          value={filters.type}
          options={typeOptions}
          disabled={unavailable}
          onChange={(event) => updateFilter('type', event.target.value)}
        />
        <Select
          variant="filter"
          className="min-w-0 flex-1"
          label="بازه زمانی"
          value={filters.period?.id ?? 'all'}
          options={periodOptions}
          disabled={unavailable}
          onChange={(event) => updateFilter('period', event.target.value)}
        />
      </div>
      {visible ? (
        <>
          <p role="status" className="text-caption font-normal text-text-secondary">
            {formatNumber(visible.length)} تراکنش
          </p>
          {visible.length ? (
            <TransactionList records={visible} />
          ) : (
            <div className="flex flex-col items-start gap-4 rounded-lg bg-surface p-5">
              <p>تراکنشی با این فیلترها پیدا نشد.</p>
              <Button variant="secondary" size="md" onClick={resetFilters}>
                پاک کردن فیلترها
              </Button>
            </div>
          )}
        </>
      ) : (
        <div role="status" className="flex flex-col items-start gap-4 rounded-lg bg-surface p-5">
          <p>
            {data === undefined
              ? 'در حال دریافت تراکنش‌ها…'
              : 'اطلاعات تراکنش‌های فروشگاه هنوز از سرور ارائه نمی‌شود.'}
          </p>
          {previewLink && (
            <ButtonLink to={previewLink} variant="secondary" size="md">
              پیش‌نمایش تراکنش‌ها
            </ButtonLink>
          )}
        </div>
      )}
    </>
  )
}

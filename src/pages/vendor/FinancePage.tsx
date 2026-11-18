import { useEffect, useState } from 'react'
import { Link, NavLink, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { FINANCE_ITEMS } from '@/features/vendor-finance/navigation'
import type { FinanceSection } from '@/features/vendor-finance/navigation'
import { TransactionsPanel } from '@/features/vendor-finance/TransactionsPanel'
import type { TransactionData } from '@/features/vendor-finance/transactions'

export default function VendorFinancePage({ section }: { section: FinanceSection }) {
  const [params] = useSearchParams()
  const previewParam = params.get('preview')
  const preview =
    import.meta.env.DEV &&
    section === 'transactions' &&
    (previewParam === '1' ||
      (previewParam !== '0' && import.meta.env.VITE_VENDOR_FINANCE_PREVIEW === '1'))
  const previewQuery =
    import.meta.env.DEV && (previewParam === '1' || previewParam === '0')
      ? `?preview=${previewParam}`
      : ''
  const [sample, setSample] = useState<TransactionData | null | undefined>()

  useEffect(() => {
    if (import.meta.env.DEV && preview) {
      let cancelled = false
      void import('@/features/vendor-finance/previewTransactions').then(
        ({ previewTransactions }) => {
          if (!cancelled) setSample(previewTransactions)
        },
        () => {
          if (!cancelled) setSample(null)
        },
      )
      return () => {
        cancelled = true
      }
    }
  }, [preview])

  const data = preview ? sample : null
  const title = FINANCE_ITEMS.find(([id]) => section === id)?.[1] ?? 'مالی'
  const overview = section === 'overview'

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 pb-10 sm:p-8 lg:p-6 xl:p-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link
            to={overview ? '/vendor' : `/vendor/finance/overview${previewQuery}`}
            aria-label={overview ? 'بازگشت به داشبورد' : 'بازگشت به مرور کلی مالی'}
            className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface transition-colors hover:bg-surface-secondary"
          >
            <ArrowRight size={24} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <h1 className="text-title-lg font-bold lg:text-title-xl">{title}</h1>
        </div>
        <div className="flex min-h-5 flex-wrap items-center gap-2 text-label-md font-normal text-text-secondary">
          <p>{data?.context ?? 'فروشگاه‌های شما'}</p>
          {data && (
            <span className="rounded-sm bg-primary-subtle px-2 text-caption">دادهٔ نمونه</span>
          )}
        </div>
      </header>
      <nav
        aria-label="بخش‌های مالی"
        className="grid grid-cols-4 gap-1 rounded-md bg-surface p-1 lg:hidden"
      >
        {FINANCE_ITEMS.map(([id, label]) => (
          <NavLink
            end
            key={id}
            to={`/vendor/finance/${id}${previewQuery}`}
            className={({ isActive }) =>
              `grid min-h-11 place-items-center rounded-[8px] text-center text-caption transition-colors ${isActive ? 'bg-primary-subtle font-bold' : 'font-normal hover:bg-surface-secondary'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {section === 'transactions' ? (
        <TransactionsPanel
          data={data}
          previewLink={
            import.meta.env.DEV && !preview ? '/vendor/finance/transactions?preview=1' : undefined
          }
        />
      ) : (
        <div className="flex flex-col gap-3 rounded-lg bg-surface p-6">
          <p className="text-title-md">بخش «{title}» در حال آماده‌سازی است.</p>
          <p className="text-body-md text-text-secondary">به‌زودی در دسترس خواهد بود.</p>
        </div>
      )}
    </div>
  )
}

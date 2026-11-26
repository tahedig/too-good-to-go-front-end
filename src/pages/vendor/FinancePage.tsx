import { useEffect, useLayoutEffect, useState } from 'react'
import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { FinanceNotice } from '@/features/vendor-finance/FinanceCards'
import { FINANCE_ITEMS, financePreviewSearch } from '@/features/vendor-finance/navigation'
import type { FinanceSection } from '@/features/vendor-finance/navigation'
import { OverviewPanel } from '@/features/vendor-finance/OverviewPanel'
import type { ReservationsState } from '@/features/vendor-finance/OverviewPanel'
import { PlansPanel } from '@/features/vendor-finance/PlansPanel'
import { SettlementsPanel } from '@/features/vendor-finance/SettlementsPanel'
import { TransactionsPanel } from '@/features/vendor-finance/TransactionsPanel'
import type { FinanceSnapshot, FinanceSource } from '@/features/vendor-finance/financeTypes'
import { ApiError } from '@/lib/api/client'
import { formatJalaliDate } from '@/lib/vendorDates'
import { vendorFinanceSource } from '@/services/vendor/financeService'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: FinanceSnapshot; source: FinanceSource }
  | { kind: 'error'; status?: number }

function reservationState(state: LoadState, retry: () => void): ReservationsState {
  if (state.kind === 'loading') return state
  if (state.kind === 'ready') {
    return state.data.reservations
      ? { kind: 'ready', items: state.data.reservations }
      : { kind: 'unavailable' }
  }
  if (state.status === 404 || state.status === 501) return { kind: 'unavailable' }
  if (state.status === 401 || state.status === 403) return { kind: 'auth' }
  return { kind: 'error', retry }
}

export default function VendorFinancePage({ section }: { section: FinanceSection }) {
  const [params] = useSearchParams()
  const flag = params.get('preview')
  const preview =
    import.meta.env.DEV &&
    (flag === '1' || (flag !== '0' && import.meta.env.VITE_VENDOR_FINANCE_PREVIEW === '1'))

  // Switching between preview and live must discard rendered data, dialogs, and form values.
  return (
    <FinanceScreen
      key={`${section}:${preview}`}
      section={section}
      preview={preview}
      previewQuery={financePreviewSearch(params)}
    />
  )
}

function FinanceScreen({
  section,
  preview,
  previewQuery,
}: {
  section: FinanceSection
  preview: boolean
  previewQuery: string
}) {
  const { hash } = useLocation()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)
  const data = state.kind === 'ready' ? state.data : undefined
  const source = state.kind === 'ready' ? state.source : undefined
  const loading = state.kind === 'loading'

  useLayoutEffect(() => {
    if (!hash) window.scrollTo(0, 0)
  }, [hash])

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        let adapter = vendorFinanceSource
        if (import.meta.env.DEV && preview) {
          adapter = (await import('@/features/vendor-finance/previewFinance')).previewFinanceSource
        }
        if (controller.signal.aborted) return
        const snapshot = await adapter.load(section, controller.signal)
        if (!controller.signal.aborted) setState({ kind: 'ready', data: snapshot, source: adapter })
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({ kind: 'error', status: error instanceof ApiError ? error.status : undefined })
        }
      }
    }
    void load()
    return () => controller.abort()
  }, [section, preview, attempt])

  useEffect(() => {
    if (loading || section !== 'settlements' || hash !== '#settlement-request') return
    const form = document.getElementById('settlement-request')
    form?.scrollIntoView({ block: 'start' })
    form?.focus({ preventScroll: true })
  }, [hash, loading, section])

  function retry() {
    setState({ kind: 'loading' })
    setAttempt((current) => current + 1)
  }

  function updateSnapshot(snapshot: FinanceSnapshot) {
    setState((current) => (current.kind === 'ready' ? { ...current, data: snapshot } : current))
  }

  const href = (target: FinanceSection) => `/vendor/finance/${target}${previewQuery}`
  const previewLink =
    import.meta.env.DEV && !preview ? `/vendor/finance/${section}?preview=1${hash}` : undefined
  const overview = section === 'overview'
  const transactions = section === 'transactions'
  const title = overview ? 'مالی و درآمد' : FINANCE_ITEMS.find(([id]) => section === id)?.[1]
  const context =
    section === 'plans'
      ? 'طرح مناسب فروشگاه خود را انتخاب کنید.'
      : transactions && data?.transactions
        ? data.transactions.context
        : [
            data?.storeName ?? 'فروشگاه‌های شما',
            data?.period && `تا ${formatJalaliDate(data.period.asOf)}`,
          ]
            .filter(Boolean)
            .join(' · ')
  const requestUpgrade = source?.requestUpgrade
  const requestPayout = source?.requestPayout
  const authError =
    !preview && state.kind === 'error' && (state.status === 401 || state.status === 403)
  const hardError =
    !preview && !overview && state.kind === 'error' && state.status !== 404 && state.status !== 501
  const returnTo = encodeURIComponent(`/vendor/finance/${section}`)

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 p-4 pb-10 sm:p-8 lg:p-6 xl:p-12">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <ButtonLink
            to={overview ? '/vendor' : href('overview')}
            variant="secondary"
            size="sm"
            aria-label={overview ? 'بازگشت به داشبورد' : 'بازگشت به مرور کلی مالی'}
            className="size-11! border! border-border-default! px-0! hover:bg-surface-secondary!"
          >
            <ArrowRight size={24} strokeWidth={1.75} aria-hidden="true" />
          </ButtonLink>
          <h1 className="text-title-lg font-bold lg:text-title-xl">{title}</h1>
        </div>
        <div className="flex min-h-5 flex-wrap items-center gap-2 text-label-md font-normal text-text-secondary">
          <p>{context}</p>
          {preview && (
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
            to={href(id)}
            className={({ isActive }) =>
              `grid min-h-11 place-items-center rounded-[8px] text-center text-caption transition-colors ${isActive ? 'bg-primary-subtle font-bold' : 'font-normal hover:bg-surface-secondary'}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      {preview && state.kind === 'error' ? (
        <div className="flex flex-col items-start gap-4">
          <InlineAlert tone="error">دریافت دادهٔ نمونه انجام نشد.</InlineAlert>
          <Button variant="secondary" size="md" onClick={retry}>
            تلاش دوباره
          </Button>
        </div>
      ) : hardError ? (
        <div className="flex flex-col items-start gap-4">
          {authError ? (
            <>
              <InlineAlert tone="warning">
                {state.status === 403
                  ? 'این بخش فقط برای حساب فروشنده در دسترس است.'
                  : 'برای مشاهدهٔ اطلاعات مالی وارد حساب فروشنده شوید.'}
              </InlineAlert>
              <ButtonLink to={`/login?returnTo=${returnTo}`} variant="secondary" size="md">
                ورود با حساب فروشنده
              </ButtonLink>
            </>
          ) : (
            <>
              <InlineAlert tone="error">دریافت اطلاعات مالی انجام نشد.</InlineAlert>
              <Button variant="secondary" size="md" onClick={retry}>
                تلاش دوباره
              </Button>
            </>
          )}
        </div>
      ) : transactions ? (
        <TransactionsPanel
          data={loading ? undefined : (data?.transactions ?? null)}
          previewLink={previewLink}
        />
      ) : loading && (preview || !overview) ? (
        <p role="status" className="rounded-lg bg-surface p-5 text-body-md text-text-secondary">
          در حال دریافت اطلاعات مالی…
        </p>
      ) : (
        <>
          {overview ? (
            <>
              {!loading &&
                !data?.totals &&
                (state.kind === 'ready' ||
                  state.status === 404 ||
                  state.status === 405 ||
                  state.status === 501) && (
                  <FinanceNotice>
                    اطلاعات درآمد و موجودی هنوز از سرویس مالی ارائه نمی‌شود.
                  </FinanceNotice>
                )}
              <OverviewPanel
                data={data}
                reservations={reservationState(state, retry)}
                href={href}
              />
            </>
          ) : section === 'plans' ? (
            <PlansPanel
              data={data?.plans}
              preview={preview}
              requestUpgrade={
                requestUpgrade && (async (planId) => updateSnapshot(await requestUpgrade(planId)))
              }
            />
          ) : (
            <SettlementsPanel
              data={data}
              preview={preview}
              requestPayout={
                requestPayout &&
                (async (input) => {
                  const snapshot = await requestPayout(input)
                  updateSnapshot(snapshot)
                  return snapshot.totals?.available
                })
              }
            />
          )}
          {previewLink && (
            <ButtonLink to={previewLink} variant="secondary" size="md" className="self-start">
              پیش‌نمایش {overview ? 'مرور کلی' : title}
            </ButtonLink>
          )}
        </>
      )}
    </div>
  )
}

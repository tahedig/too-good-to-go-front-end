import { useEffect, useState } from 'react'
import { LogOut, Store, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { vendorAuthApi } from '@/features/auth/api/vendorAuthApi'
import { ApiError } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/digits'
import { storeService } from '@/services/storeService'
import type { VendorStore } from '@/types/storeTypes'

type AccountState =
  | { kind: 'loading' }
  | { kind: 'auth'; status: 401 | 403 }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      userId: string
      phone: string
      role: string
      stores: VendorStore[]
    }

export default function VendorAccountPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<AccountState>(() =>
    vendorAuthApi.getStoredSession()?.accessToken
      ? { kind: 'loading' }
      : { kind: 'auth', status: 401 },
  )
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const stored = vendorAuthApi.getStoredSession()
    if (!stored?.accessToken) return

    let active = true

    vendorAuthApi
      .getMe()
      .then(async (me) => {
        if (!active) return
        if (me.role && me.role !== 'vendor') {
          setState({ kind: 'auth', status: 403 })
          return
        }

        const stores = await storeService.listStores().catch((): VendorStore[] => [])
        if (!active) return

        setState({
          kind: 'ready',
          userId: me.userId || stored.user.id || '—',
          phone: stored.user.phone || '',
          role: me.role || stored.user.role || 'vendor',
          stores,
        })
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          setState({ kind: 'auth', status: error.status })
          return
        }
        setState({
          kind: 'error',
          message:
            error instanceof ApiError
              ? error.message
              : 'دریافت اطلاعات حساب فروشنده انجام نشد. لطفاً دوباره تلاش کنید.',
        })
      })

    return () => {
      active = false
    }
  }, [retryKey])

  function handleLogout() {
    vendorAuthApi.logout()
    void navigate('/vendor/login', { replace: true })
  }

  return (
    <div className="mx-auto flex w-full max-w-[1116px] flex-col gap-6 p-4 sm:p-6 lg:px-20 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-title-xl text-primary lg:text-display-xl">حساب فروشنده</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            وضعیت نشست و اطلاعات حساب متصل به پنل فروشنده
          </p>
        </div>
      </div>

      {state.kind === 'loading' && (
        <div
          role="status"
          aria-busy="true"
          className="rounded-lg border border-border-default bg-surface p-6 text-body-md text-text-secondary"
        >
          در حال دریافت اطلاعات حساب فروشنده…
        </div>
      )}

      {state.kind === 'auth' && (
        <div className="max-w-xl space-y-4">
          <InlineAlert tone={state.status === 403 ? 'error' : 'warning'}>
            {state.status === 403
              ? 'حساب فعال فعلی دسترسی فروشنده ندارد. با شماره فروشنده وارد شوید.'
              : 'برای مشاهده حساب و مدیریت فروشگاه‌ها ابتدا وارد حساب فروشنده شوید.'}
          </InlineAlert>

          <div className="flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/vendor/login?returnTo=%2Fvendor%2Faccount" variant="primary" size="md">
              ورود با حساب فروشنده
            </ButtonLink>
            {state.status === 403 && (
              <Button variant="secondary" size="md" onClick={handleLogout}>
                خروج از حساب فعلی
              </Button>
            )}
          </div>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="max-w-xl space-y-4">
          <InlineAlert tone="error">{state.message}</InlineAlert>
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setState({ kind: 'loading' })
              setRetryKey((count) => count + 1)
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      )}

      {state.kind === 'ready' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section
            aria-labelledby="vendor-account-details"
            className="space-y-5 rounded-lg border border-border-default bg-surface p-6"
          >
            <div className="flex items-center justify-between gap-3 border-b border-border-default pb-4">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-md bg-primary-subtle text-primary">
                  <UserRound className="size-6" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 id="vendor-account-details" className="text-title-md text-primary">
                    اطلاعات حساب کاربری
                  </h2>
                  <p className="text-caption text-text-secondary">
                    متصل به سیستم احراز هویت ته‌دیگ
                  </p>
                </div>
              </div>
              <StatusBadge status="active" label="فروشنده" />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              {state.phone && (
                <div className="rounded-md bg-surface-secondary p-4">
                  <dt className="text-caption text-text-secondary">شماره موبایل</dt>
                  <dd className="mt-1 text-body-lg font-semibold text-primary">
                    <bdi dir="ltr">{toPersianDigits(state.phone)}</bdi>
                  </dd>
                </div>
              )}
              <div className="rounded-md bg-surface-secondary p-4">
                <dt className="text-caption text-text-secondary">شناسه کاربری</dt>
                <dd className="mt-1 truncate text-body-md font-medium text-primary">
                  <bdi dir="ltr">{state.userId}</bdi>
                </dd>
              </div>
              <div className="rounded-md bg-surface-secondary p-4">
                <dt className="text-caption text-text-secondary">نقش کاربری</dt>
                <dd className="mt-1 text-body-md font-medium text-primary">
                  {state.role === 'vendor' ? 'فروشنده (Vendor)' : state.role}
                </dd>
              </div>
              <div className="rounded-md bg-surface-secondary p-4">
                <dt className="text-caption text-text-secondary">فروشگاه‌های متصل</dt>
                <dd className="mt-1 text-body-md font-medium text-primary">
                  {state.stores.length.toLocaleString('fa-IR')} فروشگاه
                </dd>
              </div>
            </dl>

            <div className="pt-2">
              <Button
                type="button"
                variant="destructive"
                size="md"
                icon={<LogOut className="size-5" strokeWidth={1.75} />}
                onClick={handleLogout}
              >
                خروج از حساب
              </Button>
            </div>
          </section>

          <aside className="space-y-4 rounded-lg border border-border-default bg-surface p-6">
            <div className="flex items-center gap-2 text-primary">
              <Store className="size-5" strokeWidth={1.75} />
              <h2 className="text-title-sm">فروشگاه‌های شما</h2>
            </div>

            {state.stores.length > 0 ? (
              <ul className="space-y-3">
                {state.stores.map((store) => (
                  <li
                    key={store.id}
                    className="rounded-md border border-border-default bg-background p-3"
                  >
                    <p className="text-label-md text-primary">{store.name}</p>
                    <p className="mt-1 text-caption text-text-secondary">{store.address}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-md text-text-secondary">
                فروشگاهی یافت نشد یا هنوز ثبت نشده است.
              </p>
            )}

            <ButtonLink to="/vendor/stores" variant="secondary" fullWidth size="md">
              مدیریت فروشگاه‌ها
            </ButtonLink>
          </aside>
        </div>
      )}
    </div>
  )
}

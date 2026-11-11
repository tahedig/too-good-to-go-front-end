import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Handbag, HelpCircle, LogOut, WalletCards } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { ApiError } from '@/lib/api/client'
import { profileApi } from '@/features/profile/api/profileApi'
import { CustomerProfileShell } from '@/features/profile/components/CustomerProfileShell'
import { ProfileLoading } from '@/features/profile/components/ProfileLoading'
import type { CustomerProfile } from '@/features/profile/types'

function SettingRow({ to, label, detail }: { to?: string; label: string; detail?: string }) {
  const content = (
    <>
      <div>
        <span className="text-body-md text-primary">{label}</span>
        {detail && <p className="mt-1 text-caption text-text-secondary">{detail}</p>}
      </div>
      <ChevronLeft className="size-5 text-text-secondary" strokeWidth={1.75} />
    </>
  )

  return to ? (
    <Link
      to={to}
      className="flex min-h-17 items-center justify-between gap-4 border-b border-border-default px-5 last:border-0 hover:bg-surface-secondary"
    >
      {content}
    </Link>
  ) : (
    <button
      type="button"
      className="flex min-h-17 w-full items-center justify-between gap-4 border-b border-border-default px-5 text-start last:border-0 hover:bg-surface-secondary"
    >
      {content}
    </button>
  )
}

function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = useState(defaultChecked)
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4">
      <span className="text-body-md text-primary">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => setChecked(event.target.checked)}
        className="peer sr-only"
      />
      <span className="relative h-7 w-12 rounded-full border border-border-input bg-surface-secondary transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-surface" />
    </label>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    profileApi
      .getCurrent()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(
          requestError instanceof ApiError ? requestError.message : 'اطلاعات پروفایل بارگذاری نشد.',
        )
      })
    return () => {
      active = false
    }
  }, [retryKey])

  return (
    <CustomerProfileShell>
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-5 sm:px-8 sm:pb-12 sm:pt-10 lg:px-20">
        {!profile && !error ? (
          <ProfileLoading />
        ) : error ? (
          <div className="mx-auto max-w-xl space-y-4 pt-8">
            <InlineAlert tone="error">{error}</InlineAlert>
            <Button
              fullWidth
              onClick={() => {
                setError('')
                setRetryKey((value) => value + 1)
              }}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : profile ? (
          <>
            <h1 className="mb-5 text-title-xl text-primary sm:mb-8 sm:text-display-xl">پروفایل</h1>
            <div className="grid gap-4 lg:grid-cols-[minmax(300px,0.75fr)_minmax(0,1.25fr)] lg:gap-x-6">
              <section
                className="rounded-lg bg-primary-subtle p-5 lg:col-start-1 lg:row-start-1"
                aria-label="خوشامدگویی"
              >
                <p className="text-title-md text-primary">خوش آمدی، {profile.displayName}</p>
              </section>

              <div className="grid grid-cols-2 gap-3 lg:col-start-1 lg:row-start-2">
                <section className="rounded-lg bg-primary-subtle p-5">
                  <Handbag className="size-6 text-primary" strokeWidth={1.75} />
                  <p className="mt-4 text-price-lg text-primary">۴</p>
                  <p className="mt-2 text-caption text-text-secondary">نجات غذای تکمیل‌شده</p>
                </section>
                <section className="rounded-lg bg-primary p-5 text-on-primary">
                  <WalletCards className="size-6" strokeWidth={1.75} />
                  <p className="mt-4 text-price-lg">۳۰۰٬۰۰۰</p>
                  <p className="mt-2 text-caption text-on-primary/75">تومان صرفه‌جویی</p>
                </section>
              </div>

              <section
                className="overflow-hidden rounded-lg bg-surface lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:self-start"
                aria-label="تنظیمات پروفایل"
              >
                <SettingRow to="/profile/personal" label="اطلاعات شخصی" />
                <SettingRow label="مکان ترجیحی" detail="تهران، ولیعصر" />
                <SettingRow label="راهنمایی و پشتیبانی" />
              </section>

              <section
                className="rounded-lg bg-surface p-5 lg:col-start-1 lg:row-start-3"
                aria-labelledby="notifications-title"
              >
                <h2 id="notifications-title" className="mb-3 text-title-md text-primary">
                  اعلان‌ها
                </h2>
                <Toggle label="یادآوری تحویل" defaultChecked />
                <Toggle label="اعلان موجودی" />
              </section>

              <Button
                variant="destructive"
                fullWidth
                icon={<LogOut strokeWidth={1.75} />}
                className="lg:col-start-1 lg:row-start-4"
                onClick={() => {
                  sessionStorage.removeItem('auth_session')
                  window.location.assign('/')
                }}
              >
                خروج از حساب
              </Button>
            </div>

            <footer className="mt-12 hidden items-center justify-between border-t border-border-default pt-5 text-caption text-text-secondary sm:flex">
              <span>ته‌دیگ</span>
              <a
                href="mailto:support@example.com"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <HelpCircle className="size-5" />
                راهنمایی و پشتیبانی
              </a>
            </footer>
          </>
        ) : null}
      </main>
    </CustomerProfileShell>
  )
}

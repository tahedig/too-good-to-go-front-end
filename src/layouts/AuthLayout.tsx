import { Link, Outlet } from 'react-router-dom'
import { env } from '@/config/env'

export default function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-text-primary">
      <header className="shrink-0 bg-background sm:h-20 sm:bg-surface">
        <div className="relative mx-auto flex h-[88px] max-w-[1400px] items-center justify-between px-4 sm:h-20 sm:px-10 lg:px-20">
          <Link
            to="/"
            className="rounded-sm text-[28px] font-bold leading-none tracking-tight"
            aria-label="صفحه اصلی کرامب"
          >
            {env.appName}
          </Link>
          <p className="absolute start-1/2 hidden -translate-x-1/2 text-body-md text-text-secondary sm:block">
            غذای خوب، دورریز کمتر.
          </p>
          <span className="text-label-md">فضای مدیریت</span>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 pb-8 sm:px-6 sm:pb-10">
        <Outlet />
      </main>

      <footer className="hidden h-10 shrink-0 border-t border-border-default bg-surface px-10 sm:flex sm:items-center sm:justify-between lg:px-20">
        <p className="text-caption text-text-secondary">{env.appName} · غذای خوب، دورریز کمتر.</p>
        <nav
          aria-label="پیوندهای پایین صفحه"
          className="flex items-center gap-6 text-caption text-text-secondary"
        >
          <a href={`mailto:${env.supportEmail}`}>راهنمایی و پشتیبانی</a>
          <a href="#accessibility">دسترس‌پذیری</a>
          <a href="#privacy">حریم خصوصی</a>
        </nav>
      </footer>
    </div>
  )
}

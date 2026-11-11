import { Link, Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div dir="rtl" className="flex min-h-dvh flex-col bg-background text-text-primary">
      <header className="h-16 shrink-0 border-b border-border-default bg-background sm:h-20">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-end px-5 sm:px-10 lg:px-20">
          <Link
            to="/"
            className="rounded-sm text-title-lg font-bold text-primary sm:text-title-xl"
            aria-label="صفحه اصلی ته‌دیگ"
          >
            ته‌دیگ
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-6 sm:items-center sm:px-6 sm:py-12">
        <Outlet />
      </main>
    </div>
  )
}

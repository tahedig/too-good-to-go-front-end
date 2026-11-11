import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, Compass, MapPin, ShoppingBag, UserRound } from 'lucide-react'

const navItems = [
  { to: '/', label: 'اکتشاف', Icon: Compass },
  { to: '/favorites', label: 'ذخیره‌ها', Icon: Bookmark },
  { to: '/orders', label: 'سفارشات', Icon: ShoppingBag },
  { to: '/profile', label: 'پروفایل', Icon: UserRound },
]

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-65 shrink-0 flex-col border-e border-border-default bg-surface px-6 py-7 lg:flex">
      <Link
        to="/"
        className="mb-5 flex items-center justify-between border-b border-border-default px-4 pb-5 text-title-lg font-bold text-primary"
      >
        <span>ته‌دیگ</span>
        <UserRound className="size-7" strokeWidth={1.75} />
      </Link>
      <nav aria-label="ناوبری مشتری" className="flex flex-col gap-2">
        {navItems.map(({ to, label, Icon }) => {
          const active = to === '/profile'
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={[
                'flex min-h-12 items-center gap-3 rounded-md px-4 text-body-md transition-colors',
                active
                  ? 'bg-primary-subtle font-semibold text-primary'
                  : 'text-text-secondary hover:bg-surface-secondary hover:text-primary',
              ].join(' ')}
            >
              <Icon className="size-6" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function Header() {
  return (
    <header className="hidden h-20 items-center justify-between border-b border-border-default px-8 sm:flex">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          aria-label="پروفایل"
          className="grid size-11 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
        >
          <UserRound strokeWidth={1.75} />
        </Link>
        <span className="inline-flex min-h-11 items-center gap-2 px-2 text-body-md text-primary">
          <MapPin className="size-6" strokeWidth={1.75} />
          تهران، ولیعصر
        </span>
      </div>
      <Link to="/" className="text-title-xl font-bold text-primary">
        ته‌دیگ
      </Link>
    </header>
  )
}

function MobileNavigation() {
  return (
    <nav
      aria-label="ناوبری پایین"
      className="fixed inset-x-0 bottom-0 z-30 flex h-24 items-start gap-1 border-t border-border-default bg-surface px-2 pb-7 pt-1 sm:hidden"
    >
      {navItems.map(({ to, label, Icon }) => {
        const active = to === '/profile'
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={[
              'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-md py-2 text-caption',
              active ? 'bg-primary-subtle font-semibold text-primary' : 'text-text-secondary',
            ].join(' ')}
          >
            <Icon className="size-6" strokeWidth={1.75} />
            {label}
          </Link>
        )
      })}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-2 mx-auto h-1 w-[134px] rounded-full bg-primary"
      />
    </nav>
  )
}

export function CustomerProfileShell({ children }: { children: ReactNode }) {
  return (
    <div dir="rtl" className="min-h-screen bg-background text-text-primary">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          {children}
        </div>
      </div>
      <MobileNavigation />
    </div>
  )
}

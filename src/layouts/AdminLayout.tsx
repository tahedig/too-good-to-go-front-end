import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  Menu,
  PackageCheck,
  Settings,
  ShoppingBag,
  Store,
  UserRound,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  matches: (pathname: string) => boolean
}

function normalizePathname(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') || '/' : pathname
}

const NAV_ITEMS: NavItem[] = [
  {
    to: '/admin',
    label: 'داشبورد',
    icon: LayoutDashboard,
    matches: (pathname) => pathname === '/admin' || pathname === '/admin/dashboard',
  },
  {
    to: '/admin/store-requests',
    label: 'درخواست فروشگاه‌ها',
    icon: PackageCheck,
    matches: (pathname) =>
      pathname === '/admin/store-requests' || pathname.startsWith('/admin/store-requests/'),
  },
  {
    to: '/admin/stores',
    label: 'فروشگاه‌ها',
    icon: Store,
    matches: (pathname) => pathname === '/admin/stores' || pathname.startsWith('/admin/stores/'),
  },
  {
    to: '/admin/customers',
    label: 'مشتریان',
    icon: UsersRound,
    matches: (pathname) =>
      pathname === '/admin/customers' || pathname.startsWith('/admin/customers/'),
  },
  {
    to: '/admin/products',
    label: 'محصولات',
    icon: ShoppingBag,
    matches: (pathname) =>
      pathname === '/admin/products' || pathname.startsWith('/admin/products/'),
  },
  {
    to: '/admin/orders',
    label: 'سفارشات',
    icon: PackageCheck,
    matches: (pathname) => pathname === '/admin/orders' || pathname.startsWith('/admin/orders/'),
  },
  {
    to: '/admin/finance',
    label: 'مالی',
    icon: Wallet,
    matches: (pathname) => pathname === '/admin/finance' || pathname.startsWith('/admin/finance/'),
  },
  {
    to: '/admin/support',
    label: 'پشتیبانی',
    icon: CircleHelp,
    matches: (pathname) => pathname === '/admin/support' || pathname.startsWith('/admin/support/'),
  },
  {
    to: '/admin/settings',
    label: 'تنظیمات',
    icon: Settings,
    matches: (pathname) =>
      pathname === '/admin/settings' || pathname.startsWith('/admin/settings/'),
  },
]

const FINANCE_ITEMS = [
  ['overview', 'مرور کلی'],
  ['plans', 'طرح‌ها'],
  ['commission', 'کمیسیون'],
  ['subscriptions', 'اشتراک‌ها'],
  ['transactions', 'تراکنش‌ها'],
  ['settlements', 'تسویه‌ها'],
  ['reports', 'گزارش مالی'],
] as const

function getAdminPageTitle(pathname: string): string {
  const normalizedPathname = normalizePathname(pathname)
  if (normalizedPathname.startsWith('/admin/finance')) {
    const section = normalizedPathname.split('/')[3]
    const sub = FINANCE_ITEMS.find(([key]) => key === section)?.[1]
    return sub ? `مالی · ${sub}` : 'مالی'
  }
  const match = NAV_ITEMS.find((item) => item.matches(normalizedPathname))
  return match?.label ?? 'داشبورد'
}

function formatTodayPersianDate(): string {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function BrandRow({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-[53px] shrink-0 items-center gap-3 border-b border-border-default px-3">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن منو"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface hover:bg-surface-secondary"
        >
          <X className="size-6" strokeWidth={1.75} />
        </button>
      ) : (
        <UserRound className="size-6 shrink-0" strokeWidth={1.75} />
      )}
      <span className="flex-1 text-[18px] font-semibold leading-[29px]">ته‌دیگ · مدیریت</span>
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const normalizedPathname = normalizePathname(pathname)
  const onFinanceRoute =
    normalizedPathname === '/admin/finance' || normalizedPathname.startsWith('/admin/finance/')
  const [financeExpanded, setFinanceExpanded] = useState(onFinanceRoute)

  return (
    <nav aria-label="ناوبری مدیریت" className="flex min-h-0 flex-col gap-1 overflow-y-auto">
      {NAV_ITEMS.map(({ to, label, icon: Icon, matches }) => {
        if (to === '/admin/finance') {
          return (
            <div key={to}>
              <button
                type="button"
                aria-expanded={financeExpanded}
                onClick={() => setFinanceExpanded((expanded) => !expanded)}
                className={`flex h-12 w-full items-center gap-3 rounded-[12px] px-3 text-label-md font-semibold transition-colors ${onFinanceRoute ? 'bg-surface-sage' : 'hover:bg-surface-secondary'}`}
              >
                <Icon className="size-6 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 text-start">{label}</span>
                <ChevronDown
                  className={`size-5 transition-transform ${financeExpanded ? 'rotate-180' : ''}`}
                  strokeWidth={1.75}
                />
              </button>
              {financeExpanded && (
                <div className="flex flex-col gap-1 pb-2 pe-3 pt-1">
                  {FINANCE_ITEMS.map(([path, subLabel]) => (
                    <NavLink
                      key={path}
                      to={`/admin/finance/${path}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `flex h-9 items-center rounded-[12px] px-3 text-[13px] font-semibold transition-colors ${isActive ? 'bg-surface-sage' : 'hover:bg-surface-secondary'}`
                      }
                    >
                      {subLabel}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )
        }

        const active = matches(normalizedPathname)
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            onClick={onNavigate}
            className={`flex h-12 items-center gap-3 rounded-[12px] px-3 text-label-md font-semibold transition-colors ${active ? 'bg-surface-sage' : 'hover:bg-surface-secondary'}`}
          >
            <Icon className="size-6 shrink-0" strokeWidth={1.75} />
            <span className="flex-1 text-start">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const pageTitle = getAdminPageTitle(pathname)
  const todayDate = formatTodayPersianDate()
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const button = menuButtonRef.current
    drawerRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key !== 'Tab' || !drawerRef.current) return
      const items = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button, a[href]'))
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault()
        items.at(-1)?.focus()
      } else if (!event.shiftKey && document.activeElement === items.at(-1)) {
        event.preventDefault()
        items[0]?.focus()
      }
    }
    const media = window.matchMedia('(min-width: 64rem)')
    const onResize = () => media.matches && setMenuOpen(false)
    document.addEventListener('keydown', onKeyDown)
    media.addEventListener('change', onResize)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      media.removeEventListener('change', onResize)
      document.body.style.overflow = overflow
      if (!media.matches) button?.focus()
    }
  }, [menuOpen])

  return (
    <div dir="rtl" className="flex min-h-dvh bg-background text-text-primary">
      <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 border-e border-border-default bg-surface lg:block">
        <div className="flex h-full flex-col gap-1 p-4">
          <BrandRow />
          <NavList />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border-default bg-background px-4 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="باز کردن منو"
              aria-expanded={menuOpen}
              className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface-secondary text-primary transition-colors hover:bg-surface"
            >
              <Menu className="size-5" strokeWidth={2} />
            </button>
            <span className="text-title-md text-primary">{pageTitle}</span>
          </div>
        </header>

        <header className="hidden h-16 shrink-0 border-b border-border-default bg-background lg:block">
          <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between px-8">
            <span className="text-title-md text-primary">{pageTitle}</span>

            <div className="flex items-center gap-8">
              <time className="text-caption font-normal text-text-secondary">{todayDate}</time>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-start">
                  <span className="text-title-md text-primary">ته‌دیگ · مدیریت</span>
                  <span className="text-body-md text-text-secondary">فضای مدیریت</span>
                </div>
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-md bg-primary text-title-md font-bold text-on-primary"
                >
                  ت
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1116px]">
            <Outlet />
          </div>
        </main>
      </div>
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-primary/40 transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          ref={drawerRef}
          inert={!menuOpen}
          role="dialog"
          aria-modal="true"
          aria-label="منوی مدیریت"
          className={`absolute inset-y-0 start-0 w-65 overflow-hidden bg-surface shadow-3 transition-transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex h-full flex-col gap-1 p-4">
            <BrandRow onClose={() => setMenuOpen(false)} />
            <NavList onNavigate={() => setMenuOpen(false)} />
          </div>
        </aside>
      </div>
    </div>
  )
}

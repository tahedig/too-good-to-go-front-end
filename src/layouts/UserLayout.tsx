import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Compass, Heart, PackageCheck, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type UserNavItem = {
  to: string
  label: string
  icon: LucideIcon
  matches: (pathname: string) => boolean
}

const USER_NAV_ITEMS: UserNavItem[] = [
  {
    to: '/',
    label: 'اکتشاف',
    icon: Compass,
    matches: (pathname) => ['/', '/map', '/search', '/today', '/last-chance'].includes(pathname),
  },
  {
    to: '/favorites',
    label: 'ذخیره‌ها',
    icon: Heart,
    matches: (pathname) => pathname.startsWith('/favorites'),
  },
  {
    to: '/orders',
    label: 'سفارشات',
    icon: PackageCheck,
    matches: (pathname) => pathname.startsWith('/orders'),
  },
  {
    to: '/login',
    label: 'پروفایل',
    icon: UserRound,
    matches: (pathname) => pathname.startsWith('/profile'),
  },
]

function DesktopSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 border-e border-border-default bg-surface lg:block">
      <div className="flex h-full flex-col gap-1 p-4">
        <div className="flex h-[53px] shrink-0 items-center gap-3 border-b border-border-default px-3">
          <UserRound className="size-6 shrink-0 text-text-primary" strokeWidth={1.75} />
          <span className="flex-1 text-[18px] font-semibold leading-[29px] text-text-primary">
            ته‌دیگ
          </span>
        </div>
        <nav aria-label="ناوبری مشتری" className="flex flex-col gap-1">
          {USER_NAV_ITEMS.map(({ to, label, icon: Icon, matches }) => {
            const active = matches(pathname)
            return (
              <NavLink
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 rounded-[12px] px-3 text-label-md font-semibold text-text-primary transition-colors ${
                  active ? 'bg-surface-sage' : 'hover:bg-surface-secondary'
                }`}
              >
                <Icon className="size-6 shrink-0" strokeWidth={1.75} />
                <span className="flex-1 text-start">{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

function MobileNavigation() {
  const { pathname } = useLocation()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <nav
        aria-label="ناوبری مشتری"
        className="flex h-[72px] border-t border-border-default bg-surface p-1"
      >
        {USER_NAV_ITEMS.map(({ to, label, icon: Icon, matches }) => {
          const active = matches(pathname)
          return (
            <NavLink
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              className={`flex h-16 min-w-19 flex-1 flex-col items-center justify-center gap-1 rounded-md px-2 text-text-primary transition-colors ${
                active
                  ? 'bg-primary-subtle text-label-md font-semibold'
                  : 'text-caption font-medium hover:bg-surface-secondary'
              }`}
            >
              <Icon className="size-6 shrink-0" strokeWidth={1.75} />
              <span>{label}</span>
            </NavLink>
          )
        })}
      </nav>
      <div aria-hidden="true" className="flex h-6 items-center justify-center bg-surface">
        <span className="h-[5px] w-[134px] rounded-full bg-primary" />
      </div>
    </div>
  )
}

export default function UserLayout() {
  return (
    <div dir="rtl" className="flex min-h-dvh bg-background text-text-primary">
      <DesktopSidebar />
      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <Outlet />
      </div>
      <MobileNavigation />
    </div>
  )
}

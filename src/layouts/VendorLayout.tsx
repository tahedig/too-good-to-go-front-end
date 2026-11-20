import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  Menu,
  PackageCheck,
  ShoppingBag,
  Store,
  UserRound,
  Wallet,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/vendor', label: 'داشبورد', icon: LayoutDashboard, end: true },
  { to: '/vendor/products', label: 'محصولات', icon: ShoppingBag },
  { to: '/vendor/orders', label: 'سفارشات', icon: PackageCheck },
  { to: '/vendor/stores', label: 'فروشگاه‌ها', icon: Store },
  { to: '/vendor/finance', label: 'مالی', icon: Wallet },
  { to: '/vendor/account', label: 'حساب فروشنده', icon: UserRound },
]

const FINANCE_ITEMS = [
  ['overview', 'مرور کلی'],
  ['plans', 'طرح‌ها'],
  ['transactions', 'تراکنش‌ها'],
  ['settlements', 'تسویه‌ها'],
] as const

function BrandRow({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex h-[53px] shrink-0 items-center gap-3 border-b border-border-default px-3">
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن منو"
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-text-primary transition-colors hover:bg-surface-secondary"
        >
          <X className="size-6" strokeWidth={1.75} />
        </button>
      ) : (
        <UserRound className="size-6 shrink-0 text-text-primary" strokeWidth={1.75} />
      )}
      <span className="flex-1 text-[18px] font-semibold leading-[29px] text-text-primary">
        ته‌دیگ
      </span>
    </div>
  )
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation()
  const onFinanceRoute = pathname.startsWith('/vendor/finance')
  const [financeExpanded, setFinanceExpanded] = useState(onFinanceRoute)

  return (
    <nav aria-label="ناوبری فروشنده" className="flex min-h-0 flex-col gap-1 overflow-y-auto">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => {
        if (to === '/vendor/finance') {
          return (
            <div key={to}>
              <button
                type="button"
                aria-expanded={financeExpanded}
                onClick={() => setFinanceExpanded((expanded) => !expanded)}
                className={`flex h-12 w-full items-center gap-3 rounded-[12px] px-3 text-label-md text-text-primary transition-colors ${onFinanceRoute ? 'bg-surface-sage' : 'hover:bg-surface-secondary'}`}
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
                      to={`/vendor/finance/${path}`}
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

        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                'flex h-12 items-center gap-3 rounded-[12px] px-3 text-label-md text-text-primary transition-colors',
                isActive ? 'bg-surface-sage' : 'hover:bg-surface-secondary',
              ].join(' ')
            }
          >
            <Icon className="size-6 shrink-0" strokeWidth={1.75} />
            <span className="flex-1 text-start">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default function VendorLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const headerOffset = useRef(0)
  const drawerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  // Move one pixel for each pixel scrolled, rather than toggling a hidden state.
  // Keeping the sticky header in the layout avoids content jumping as it moves.
  useEffect(() => {
    let previousY = Math.max(0, window.scrollY)
    const desktop = window.matchMedia('(min-width: 64rem)')
    function onScroll() {
      const header = headerRef.current
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      const y = Math.min(maxScroll, Math.max(0, window.scrollY))
      const delta = y - previousY
      previousY = y
      if (!header || desktop.matches) return
      const height = header.offsetHeight
      headerOffset.current =
        y === 0 ? 0 : Math.max(0, Math.min(height, headerOffset.current + delta))
      header.style.transform = `translateY(-${headerOffset.current}px)`
    }
    function resetOnResize() {
      if (headerRef.current) headerRef.current.style.transform = ''
      headerOffset.current = 0
      previousY = Math.max(0, window.scrollY)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    desktop.addEventListener('change', resetOnResize)
    return () => {
      window.removeEventListener('scroll', onScroll)
      desktop.removeEventListener('change', resetOnResize)
    }
  }, [])

  function revealHeader() {
    headerOffset.current = 0
    if (headerRef.current) headerRef.current.style.transform = ''
  }

  useEffect(() => {
    if (!menuOpen) return
    const menuButton = menuButtonRef.current
    drawerRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
      if (event.key === 'Tab' && drawerRef.current) {
        const items = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('button, a[href]'))
        const first = items[0]
        const last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    const desktop = window.matchMedia('(min-width: 64rem)')
    const onResize = () => {
      if (desktop.matches) setMenuOpen(false)
    }
    desktop.addEventListener('change', onResize)
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onResize)
      document.body.style.overflow = previousOverflow
      if (!desktop.matches) menuButton?.focus()
    }
  }, [menuOpen])

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-65 shrink-0 border-e border-border-default bg-surface lg:block">
        <div className="flex h-full flex-col gap-1 p-4">
          <BrandRow />
          <NavList />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header
          ref={headerRef}
          onFocus={revealHeader}
          className="sticky top-0 z-30 flex items-center justify-between bg-background px-5 py-4 will-change-transform lg:hidden"
        >
          <span className="text-title-md text-text-primary">ته‌دیگ</span>
          <button
            type="button"
            ref={menuButtonRef}
            onClick={() => setMenuOpen(true)}
            aria-label="باز کردن منو"
            aria-expanded={menuOpen}
            className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-text-primary transition-colors hover:bg-surface-secondary"
          >
            <Menu className="size-6" strokeWidth={1.75} />
          </button>
        </header>

        {/* Desktop brand header; the product page supplies its store context when needed. */}
        <header className="hidden h-12 shrink-0 items-center border-b border-border-default bg-background lg:flex">
          <span className="text-title-lg text-text-primary">ته‌دیگ</span>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          className={`absolute inset-0 bg-primary/40 transition-opacity duration-200 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          ref={drawerRef}
          inert={!menuOpen}
          role="dialog"
          aria-modal="true"
          aria-label="منوی فروشنده"
          className={`absolute inset-y-0 start-0 w-65 bg-surface shadow-3 transition-transform duration-200 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
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

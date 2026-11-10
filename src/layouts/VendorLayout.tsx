import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
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
  return (
    <nav aria-label="ناوبری فروشنده" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
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
      ))}
    </nav>
  )
}

export default function VendorLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [headerHidden, setHeaderHidden] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let anchorY = Math.max(0, window.scrollY)
    function onScroll() {
      const y = Math.max(0, window.scrollY)
      if (y <= 10) {
        setHeaderHidden(false)
        anchorY = y
      } else if (Math.abs(y - anchorY) >= 12) {
        setHeaderHidden(y > anchorY && y > 76)
        anchorY = y
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          className={`sticky top-0 z-30 flex items-center justify-between bg-background px-5 py-4 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none lg:hidden ${headerHidden && !menuOpen ? '-translate-y-full opacity-0 focus-within:translate-y-0 focus-within:opacity-100' : 'translate-y-0 opacity-100'}`}
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

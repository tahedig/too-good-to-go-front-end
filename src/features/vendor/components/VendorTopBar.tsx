import React, { useState } from 'react'
import { ArrowRight, Menu, X, ShoppingBag, Calendar, Store } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

interface VendorTopBarProps {
  title: string
  storeName?: string
  storeAddress?: string
  showBackButton?: boolean
  backTo?: string
}

export const VendorTopBar: React.FC<VendorTopBarProps> = ({
  title,
  storeName = 'نان صبحگاهی',
  storeAddress = 'تهران، ولیعصر، پلاک ۱۲',
  showBackButton = true,
  backTo,
}) => {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleBack = () => {
    if (backTo) {
      navigate(backTo)
    } else {
      navigate(-1)
    }
  }

  return (
    <div className="w-full">
      {/* Top Navbar */}
      <header className="flex h-16 items-center justify-between border-b border-border-default bg-surface px-4 md:px-8">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary">
          ته‌دیگ
        </Link>

        {/* Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-border-default bg-surface text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="منو"
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>

      {/* Mobile Drawer / Dropdown */}
      {menuOpen && (
        <nav className="border-b border-border-default bg-surface p-4 shadow-1">
          <div className="flex flex-col gap-2">
            <Link
              to="/vendor/orders"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-label-md text-text-primary hover:bg-surface-secondary"
            >
              <Calendar className="size-5 text-primary" />
              <span>سفارشات روزانه</span>
            </Link>
            <Link
              to="/vendor/reservations"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-label-md text-text-primary hover:bg-surface-secondary"
            >
              <ShoppingBag className="size-5 text-primary" />
              <span>همه رزروها</span>
            </Link>
            <Link
              to="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-label-md text-text-primary hover:bg-surface-secondary"
            >
              <Store className="size-5 text-primary" />
              <span>مشاهده فروشگاه / صفحه اصلی</span>
            </Link>
          </div>
        </nav>
      )}

      {/* Page Header Section */}
      <div className="px-4 pt-6 pb-4 md:px-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary">{title}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              {storeName}
              {storeAddress && (
                <>
                  <span className="mx-1.5 opacity-60">•</span>
                  <span>{storeAddress}</span>
                </>
              )}
            </p>
          </div>

          {showBackButton && (
            <button
              type="button"
              onClick={handleBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface text-text-primary shadow-1 hover:bg-surface-secondary transition-colors"
              aria-label="بازگشت"
            >
              <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

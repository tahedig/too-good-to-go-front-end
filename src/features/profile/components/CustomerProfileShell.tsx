import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, UserRound } from 'lucide-react'
import { catalogueService } from '@/services/catalogueService'

function Header() {
  const hasLocation = Boolean(catalogueService.getLocation())
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
        <Link
          to="/map"
          className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-body-md text-primary hover:bg-surface-secondary"
        >
          <MapPin className="size-6" strokeWidth={1.75} />
          {hasLocation ? 'موقعیت انتخاب‌شده' : 'انتخاب موقعیت'}
        </Link>
      </div>
      <Link to="/" className="text-title-xl font-bold text-primary">
        ته‌دیگ
      </Link>
    </header>
  )
}

export function CustomerProfileShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1 bg-background text-text-primary">
      <Header />
      {children}
    </div>
  )
}

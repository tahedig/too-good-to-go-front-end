import { MapPin, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/ui/StatusBadge'

const surface =
  'block w-full rounded-lg border border-border-default bg-surface p-4 sm:rounded-[12px] sm:border-transparent sm:bg-warning-subtle sm:text-warning lg:max-w-[1020px] xl:w-4/5'

export function DashboardStoreRequest({
  request,
  preview,
}: {
  request: { id: string; name: string; branch: string }
  preview: boolean
}) {
  const name = [request.name, request.branch].filter(Boolean).join(' · ')
  const content = (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        <h2 className="flex items-center justify-between gap-2 text-title-md">
          <StatusBadge compact status="pending" />
          درخواست فروشگاه
        </h2>
        <div className="flex items-center gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-subtle"
            aria-hidden="true"
          >
            <MapPin className="size-6" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 wrap-anywhere">
            <p className="text-label-lg">{name}</p>
            <p className="text-body-md text-text-secondary">در انتظار بررسی</p>
          </div>
        </div>
      </div>
      <div className="hidden items-center gap-2 text-label-md wrap-anywhere sm:flex lg:font-bold">
        <Store
          className="size-6 shrink-0 text-text-primary lg:hidden"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        {name} · در انتظار بررسی
      </div>
    </>
  )

  return preview ? (
    <div className={surface}>{content}</div>
  ) : (
    <Link
      to={`/vendor/stores/${encodeURIComponent(request.id)}`}
      className={`${surface} hover:border-warning hover:bg-warning-subtle transition-colors`}
    >
      {content}
    </Link>
  )
}

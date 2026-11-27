import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  adminDashboardApi,
  type AdminActivityType,
  type AdminDashboardData,
} from '@/features/admin/api/adminDashboardApi'
import { ApiError } from '@/lib/api/client'
import { formatNumber } from '@/lib/format'

function DashboardLoading() {
  return (
    <div
      role="status"
      aria-label="در حال بارگذاری داشبورد"
      className="flex flex-col gap-2.5 lg:gap-4"
    >
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="h-[113px] animate-pulse rounded-lg border border-border-default bg-surface p-5"
          />
        ))}
      </div>
      <div className="h-[227px] animate-pulse rounded-lg border border-border-default bg-surface p-5 lg:h-[263px]" />
      <div className="h-[305px] animate-pulse rounded-lg border border-border-default bg-surface p-5 lg:h-[323px]" />
    </div>
  )
}

function getActivityRoute(type: AdminActivityType, id: string): string {
  const hasEntityId = Boolean(id) && !id.startsWith('activity-')
  switch (type) {
    case 'reservation':
      return '/admin/orders'
    case 'store_decision':
      return hasEntityId ? `/admin/stores/${encodeURIComponent(id)}` : '/admin/stores'
    default:
      return hasEntityId
        ? `/admin/store-requests/${encodeURIComponent(id)}`
        : '/admin/store-requests'
  }
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState<{ message: string; status?: number } | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'داشبورد مدیریت | ته‌دیگ'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    let active = true
    adminDashboardApi
      .getSummary({ activityLimit: 5 })
      .then((summary) => {
        if (active) setData(summary)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        if (requestError instanceof ApiError) {
          if (requestError.status === 401) {
            setError({
              status: 401,
              message: 'برای مشاهده داشبورد مدیریت، ابتدا با حساب مدیر وارد شوید.',
            })
            return
          }
          if (requestError.status === 403) {
            setError({
              status: 403,
              message: 'حساب کاربری فعلی دسترسی مدیریت ندارد.',
            })
            return
          }
          setError({ status: requestError.status, message: requestError.message })
          return
        }
        setError({ message: 'بارگذاری اطلاعات داشبورد انجام نشد.' })
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  if (!data && !error) {
    return (
      <>
        <h1 className="sr-only">داشبورد مدیریت</h1>
        <DashboardLoading />
      </>
    )
  }

  const needsAuth = error?.status === 401 || error?.status === 403
  const metrics = data?.metrics
  const requestStatus = data?.requestStatus
  const recentActivity = data?.recentActivity ?? []

  const formatMetric = (value: number | undefined) =>
    value === undefined ? '—' : formatNumber(value)

  const metricCards = [
    {
      key: 'registeredStores',
      label: 'فروشگاه‌های ثبت‌شده',
      value: formatMetric(metrics?.registeredStores),
      orderClass: 'lg:order-3',
    },
    {
      key: 'knownCustomers',
      label: 'مشتریان شناخته‌شده',
      value: formatMetric(metrics?.knownCustomers),
      orderClass: 'lg:order-4',
    },
    {
      key: 'activeProducts',
      label: 'محصولات فعال',
      value: formatMetric(metrics?.activeProducts),
      orderClass: 'lg:order-1',
    },
    {
      key: 'activeStores',
      label: 'فروشگاه‌های فعال',
      value: formatMetric(metrics?.activeStores),
      orderClass: 'lg:order-2',
    },
    {
      key: 'completedReservations',
      label: 'رزروهای تکمیل‌شده',
      value: formatMetric(metrics?.completedReservations),
      orderClass: 'lg:order-7',
    },
    {
      key: 'activeReservations',
      label: 'رزروهای فعال',
      value: formatMetric(metrics?.activeReservations),
      orderClass: 'lg:order-8',
    },
    {
      key: 'pendingRequests',
      label: 'درخواست‌های در انتظار',
      value: formatMetric(metrics?.pendingRequests),
      orderClass: 'lg:order-5',
    },
    {
      key: 'platformCommission',
      label: 'کمیسیون پلتفرم',
      value: formatMetric(metrics?.platformCommission),
      orderClass: 'lg:order-6',
    },
  ]

  const totalRequests = requestStatus
    ? requestStatus.pending +
      requestStatus.approved +
      requestStatus.rejected +
      requestStatus.suspended
    : 0

  const statusRows = [
    {
      key: 'pending',
      label: 'در انتظار بررسی',
      count: requestStatus?.pending,
      barClassName: 'bg-warning',
    },
    {
      key: 'approved',
      label: 'تأییدشده',
      count: requestStatus?.approved,
      barClassName: 'bg-success',
    },
    {
      key: 'rejected',
      label: 'ردشده',
      count: requestStatus?.rejected,
      barClassName: 'bg-error',
    },
    {
      key: 'suspended',
      label: 'تعلیق‌شده',
      count: requestStatus?.suspended,
      barClassName: 'bg-text-secondary',
    },
  ]

  return (
    <div className="flex flex-col gap-2.5 lg:gap-4">
      <h1 className="sr-only">داشبورد مدیریت</h1>

      {error && (
        <div className="flex flex-col gap-3">
          <InlineAlert tone={needsAuth ? 'warning' : 'error'}>{error.message}</InlineAlert>
          <div className="flex flex-wrap items-center gap-3">
            {needsAuth && (
              <Button size="md" onClick={() => void navigate('/admin/login?returnTo=/admin')}>
                ورود به پنل مدیریت
              </Button>
            )}
            <Button
              size="md"
              variant={needsAuth ? 'secondary' : 'primary'}
              onClick={() => {
                setError(null)
                setData(null)
                setReloadKey((key) => key + 1)
              }}
            >
              تلاش دوباره
            </Button>
          </div>
        </div>
      )}

      <section aria-label="نماگرهای مدیریت" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metricCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            className={card.orderClass}
          />
        ))}
      </section>

      <section
        aria-labelledby="request-status-heading"
        className="flex flex-col gap-2.5 rounded-lg border border-border-default bg-surface p-5 lg:gap-4"
      >
        <h2 id="request-status-heading" className="text-title-md text-primary">
          وضعیت درخواست‌ها
        </h2>

        {statusRows.map((row) => {
          const count = row.count ?? 0
          const percent = totalRequests > 0 ? Math.round((count / totalRequests) * 100) : 0
          return (
            <div key={row.key} className="flex flex-col gap-2.5 lg:gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="text-body-md text-text-secondary">{row.label}</span>
                <span className="text-label-md text-primary">
                  {row.count === undefined ? '—' : formatNumber(row.count)} درخواست
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={row.label}
                aria-valuenow={count}
                aria-valuemin={0}
                aria-valuemax={Math.max(totalRequests, 1)}
                className="flex h-2.5 w-full overflow-hidden rounded-sm bg-background"
              >
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${row.barClassName}`}
                  style={{ width: count > 0 ? `${Math.max(percent, 4)}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </section>

      <section
        aria-labelledby="recent-activity-heading"
        className="flex flex-col gap-2.5 rounded-lg border border-border-default bg-surface p-5 lg:gap-4"
      >
        <h2 id="recent-activity-heading" className="text-title-md text-primary">
          فعالیت اخیر
        </h2>

        {recentActivity.length === 0 ? (
          <p className="text-body-md text-text-secondary">
            {error ? 'اطلاعات فعالیت‌ها در دسترس نیست.' : 'فعالیتی برای نمایش وجود ندارد.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5 lg:gap-4">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <Link
                  to={getActivityRoute(item.type, item.id)}
                  className="flex flex-col gap-2.5 rounded-sm transition-opacity hover:opacity-80 lg:gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="min-w-0 text-title-sm text-primary">{item.storeName}</span>
                    <StatusBadge
                      status={item.badgeStatus}
                      label={item.statusLabel}
                      showIcon={false}
                      className="h-auto shrink-0"
                    />
                  </div>
                  <div className="grid grid-cols-2 items-start gap-4">
                    <span className="text-body-md text-text-secondary">{item.ownerName}</span>
                    <span className="text-label-md text-primary">{item.dateLabel}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

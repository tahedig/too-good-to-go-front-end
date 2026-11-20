import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { adminDashboardApi, type AdminDashboardData } from '@/features/admin/api/adminDashboardApi'
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [error, setError] = useState('')
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
      .getSummary()
      .then((summary) => {
        if (active) setData(summary)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : 'بارگذاری اطلاعات داشبورد انجام نشد.',
        )
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

  if (error || !data) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="sr-only">داشبورد مدیریت</h1>
        <InlineAlert tone="error">{error || 'اطلاعات داشبورد در دسترس نیست.'}</InlineAlert>
        <div>
          <Button
            size="md"
            onClick={() => {
              setError('')
              setData(null)
              setReloadKey((key) => key + 1)
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      </div>
    )
  }

  const { metrics, requestStatus, recentActivity } = data

  const metricCards = [
    {
      key: 'registeredStores',
      label: 'فروشگاه‌های ثبت‌شده',
      value: formatNumber(metrics.registeredStores),
      orderClass: 'lg:order-3',
    },
    {
      key: 'knownCustomers',
      label: 'مشتریان شناخته‌شده',
      value: formatNumber(metrics.knownCustomers),
      orderClass: 'lg:order-4',
    },
    {
      key: 'activeProducts',
      label: 'محصولات فعال',
      value: formatNumber(metrics.activeProducts),
      orderClass: 'lg:order-1',
    },
    {
      key: 'activeStores',
      label: 'فروشگاه‌های فعال',
      value: formatNumber(metrics.activeStores),
      orderClass: 'lg:order-2',
    },
    {
      key: 'completedReservations',
      label: 'رزروهای تکمیل‌شده',
      value: formatNumber(metrics.completedReservations),
      orderClass: 'lg:order-7',
    },
    {
      key: 'activeReservations',
      label: 'رزروهای فعال',
      value: formatNumber(metrics.activeReservations),
      orderClass: 'lg:order-8',
    },
    {
      key: 'pendingRequests',
      label: 'درخواست‌های در انتظار',
      value: formatNumber(metrics.pendingRequests),
      orderClass: 'lg:order-5',
    },
    {
      key: 'platformCommission',
      label: 'کمیسیون پلتفرم',
      value: formatNumber(metrics.platformCommission),
      orderClass: 'lg:order-6',
    },
  ]

  const totalRequests = requestStatus.pending + requestStatus.approved + requestStatus.rejected

  const statusRows = [
    {
      key: 'pending',
      label: 'در انتظار بررسی',
      count: requestStatus.pending,
      barClassName: 'bg-warning',
    },
    {
      key: 'approved',
      label: 'تأییدشده',
      count: requestStatus.approved,
      barClassName: 'bg-success',
    },
    {
      key: 'rejected',
      label: 'ردشده',
      count: requestStatus.rejected,
      barClassName: 'bg-error',
    },
  ]

  return (
    <div className="flex flex-col gap-2.5 lg:gap-4">
      <h1 className="sr-only">داشبورد مدیریت</h1>

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
          const percent = totalRequests > 0 ? Math.round((row.count / totalRequests) * 100) : 0
          return (
            <div key={row.key} className="flex flex-col gap-2.5 lg:gap-4">
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="text-body-md text-text-secondary">{row.label}</span>
                <span className="text-label-md text-primary">
                  {formatNumber(row.count)} درخواست
                </span>
              </div>
              <div
                role="progressbar"
                aria-label={row.label}
                aria-valuenow={row.count}
                aria-valuemin={0}
                aria-valuemax={Math.max(totalRequests, 1)}
                className="flex h-2.5 w-full overflow-hidden rounded-sm bg-background"
              >
                <div
                  className={`h-full rounded-sm transition-all duration-300 ${row.barClassName}`}
                  style={{ width: row.count > 0 ? `${Math.max(percent, 4)}%` : '0%' }}
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
          <p className="text-body-md text-text-secondary">فعالیتی برای نمایش وجود ندارد.</p>
        ) : (
          <ul className="flex flex-col gap-2.5 lg:gap-4">
            {recentActivity.map((item) => (
              <li key={item.id}>
                <Link
                  to="/admin/store-requests"
                  className="flex flex-col gap-2.5 rounded-sm transition-opacity hover:opacity-80 lg:gap-4"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="min-w-0 text-title-sm text-primary">{item.storeName}</span>
                    <StatusBadge
                      status={item.status}
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

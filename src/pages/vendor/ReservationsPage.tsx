import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { VendorTopBar } from '@/features/vendor/components/VendorTopBar'
import { OrderDateSelector } from '@/features/vendor/components/OrderDateSelector'
import { OrderFilterTabs } from '@/features/vendor/components/OrderFilterTabs'
import { OrderStatsSummary } from '@/features/vendor/components/OrderStatsSummary'
import { VendorOrderCard } from '@/features/vendor/components/VendorOrderCard'
import { VendorOrdersEmptyState } from '@/features/vendor/components/VendorOrdersEmptyState'
import { VerifyPickupModal } from '@/features/vendor/components/VerifyPickupModal'
import { vendorApi } from '@/features/vendor/api/vendorApi'
import type {
  OrderFilterStatus,
  VendorOrder,
  VendorOrderSummary,
  VendorStoreActive,
} from '@/features/vendor/types'
import { formatJalaliDate } from '@/features/vendor/utils/dateUtils'
import { ApiError } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/digits'
import { localDate } from '@/lib/vendorDates'

export default function VendorReservationsPage() {
  const location = useLocation()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<OrderFilterStatus>('all')

  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [summary, setSummary] = useState<VendorOrderSummary | null>(null)
  const [store, setStore] = useState<VendorStoreActive | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [errorInfo, setErrorInfo] = useState<{ status: number | null; message: string } | null>(
    null,
  )
  const [selectedOrderForVerification, setSelectedOrderForVerification] =
    useState<VendorOrder | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const dateLabel = selectedDate ? formatJalaliDate(selectedDate) : 'همه تاریخ‌ها'

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      const [storeResult, ordersResult, summaryResult] = await Promise.allSettled([
        vendorApi.getStore(),
        vendorApi.listOrders({ date: selectedDate || undefined, status: selectedStatus }),
        vendorApi.getSummary(selectedDate || undefined),
      ])

      if (!isMounted) return

      if (storeResult.status === 'fulfilled') {
        setStore(storeResult.value)
      }
      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value)
      }

      if (ordersResult.status === 'fulfilled') {
        setOrders(ordersResult.value.orders)
        setErrorInfo(null)
      } else {
        const reason = ordersResult.reason
        const status = reason instanceof ApiError ? reason.status : null
        setOrders([])
        setErrorInfo({
          status,
          message:
            status === 403
              ? 'این بخش فقط برای حساب فروشنده در دسترس است.'
              : status === 401
                ? 'برای مشاهدهٔ رزروها وارد حساب فروشنده شوید.'
                : status === 404
                  ? 'API رزروهای فروشنده (/vendor/orders) روی سرور فعال نیست.'
                  : reason instanceof Error
                    ? reason.message
                    : 'دریافت رزروها ممکن نیست.',
        })
      }

      setLoading(false)
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [selectedDate, selectedStatus, refreshTrigger])

  const handleDateChange = (nextDate: string) => {
    setLoading(true)
    setErrorInfo(null)
    setSelectedDate(nextDate)
  }

  const handleStatusChange = (nextStatus: OrderFilterStatus) => {
    setLoading(true)
    setErrorInfo(null)
    setSelectedStatus(nextStatus)
  }

  const handleRetry = () => {
    setLoading(true)
    setErrorInfo(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleVerifyPickup = async (order: VendorOrder, pickupCode?: string) => {
    await vendorApi.verifyPickup(order.id, { pickup_code: pickupCode })
    setLoading(true)
    setRefreshTrigger((prev) => prev + 1)
  }

  const openDatePicker = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const trigger = document.getElementById('vendor-reservations-date')
    trigger?.focus()
    trigger?.click()
  }

  const authError = errorInfo?.status === 401 || errorInfo?.status === 403

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 pb-12 lg:px-12 lg:py-8">
      <VendorTopBar
        title="همه رزروها"
        storeName={store?.name ?? 'فروشگاه‌های شما'}
        storeAddress={store?.address ?? ''}
        showBackButton={true}
        backTo="/vendor/orders"
      />

      <div className="space-y-6">
        {/* Desktop View: Top summary stats bar */}
        {summary && (
          <OrderStatsSummary summary={summary} store={store ?? undefined} variant="reservations" />
        )}

        {/* Filters and Date Picker row */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <OrderDateSelector
            id="vendor-reservations-date"
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            allowClear
          />
          <div className="max-w-xl flex-1">
            <OrderFilterTabs selectedStatus={selectedStatus} onSelectStatus={handleStatusChange} />
          </div>
        </div>

        {/* Orders list, Error or Empty State */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : errorInfo ? (
          <div className="space-y-4">
            <InlineAlert tone={authError ? 'warning' : 'error'}>{errorInfo.message}</InlineAlert>
            {authError ? (
              <ButtonLink
                to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
                variant="secondary"
                size="md"
              >
                ورود با حساب فروشنده
              </ButtonLink>
            ) : (
              <Button variant="secondary" onClick={handleRetry}>
                تلاش دوباره
              </Button>
            )}
          </div>
        ) : orders.length === 0 ? (
          <VendorOrdersEmptyState dateLabel={dateLabel} onSelectAnotherDate={openDatePicker} />
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-bold text-text-secondary">
              {selectedDate === localDate()
                ? 'سفارشات امروز'
                : selectedDate
                  ? `سفارشات ${dateLabel}`
                  : 'همه رزروها'}{' '}
              {toPersianDigits(orders.length)} رزرو
            </div>

            <div className="space-y-3">
              {orders.map((order) => (
                <VendorOrderCard
                  key={order.id}
                  order={order}
                  onVerifyPickup={(o) => setSelectedOrderForVerification(o)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verify Pickup Modal */}
      <VerifyPickupModal
        order={selectedOrderForVerification}
        isOpen={Boolean(selectedOrderForVerification)}
        onClose={() => setSelectedOrderForVerification(null)}
        onConfirm={handleVerifyPickup}
      />
    </div>
  )
}

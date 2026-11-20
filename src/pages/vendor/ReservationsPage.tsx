import { useEffect, useState } from 'react'
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
import { DEMO_DATES } from '@/features/vendor/utils/dateUtils'
import { toPersianDigits } from '@/lib/digits'
import { Loader2 } from 'lucide-react'

export default function VendorReservationsPage() {
  const [selectedDate, setSelectedDate] = useState<string>('1405-07-27')
  const [selectedStatus, setSelectedStatus] = useState<OrderFilterStatus>('all')

  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [summary, setSummary] = useState<VendorOrderSummary | null>(null)
  const [store, setStore] = useState<VendorStoreActive | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [selectedOrderForVerification, setSelectedOrderForVerification] =
    useState<VendorOrder | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const dateLabel = DEMO_DATES.find((d) => d.value === selectedDate)?.label ?? selectedDate

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        const [storeData, ordersData, summaryData] = await Promise.all([
          vendorApi.getStore(),
          vendorApi.listOrders({ date: selectedDate, status: selectedStatus }),
          vendorApi.getSummary(selectedDate),
        ])
        if (isMounted) {
          setStore(storeData)
          setOrders(ordersData.orders)
          setSummary(summaryData)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load vendor reservations data:', err)
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      isMounted = false
    }
  }, [selectedDate, selectedStatus, refreshTrigger])

  const handleVerifyPickup = async (order: VendorOrder, pickupCode?: string) => {
    await vendorApi.verifyPickup(order.id, { pickup_code: pickupCode })
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Top Bar */}
      <VendorTopBar
        title="رزروها"
        storeName={store?.name ?? 'نان صبحگاهی'}
        storeAddress={store?.address ?? 'تهران، ولیعصر، پلاک ۱۲'}
        showBackButton={true}
        backTo="/vendor/orders"
      />

      <main className="mx-auto max-w-4xl px-4 md:px-8 space-y-6">
        {/* Desktop View: Top summary stats bar */}
        {summary && (
          <OrderStatsSummary summary={summary} store={store ?? undefined} variant="reservations" />
        )}

        {/* Filters and Date Picker row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <OrderDateSelector selectedDate={selectedDate} onDateChange={(d) => setSelectedDate(d)} />
          <div className="flex-1 max-w-xl">
            <OrderFilterTabs
              selectedStatus={selectedStatus}
              onSelectStatus={(s) => setSelectedStatus(s)}
            />
          </div>
        </div>

        {/* Orders list or Empty State */}
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <VendorOrdersEmptyState
            dateLabel={dateLabel}
            onSelectAnotherDate={() => setSelectedDate('1405-07-27')}
          />
        ) : (
          <div className="space-y-4">
            <div className="text-xs font-bold text-text-secondary">
              سفارشات امروز {toPersianDigits(orders.length)} رزرو
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
      </main>

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

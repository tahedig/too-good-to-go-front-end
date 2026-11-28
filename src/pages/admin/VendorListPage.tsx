import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SearchField } from '@/components/ui/SearchField'
import { describeError } from '@/features/vendor-approval/errors'
import type { DescribedError } from '@/features/vendor-approval/errors'
import { vendorApprovalApi } from '@/features/vendor-approval/api'
import { formatVendorDate } from '@/features/vendor-approval/constants'
import type { Vendor, VendorListResponse, VendorStatus } from '@/features/vendor-approval/types'
import { StateCard, VendorStatusBadge } from '@/features/vendor-approval/components/VendorUi'
import { linkButtonClass } from '@/features/vendor-approval/components/linkButtonClass'
import { formatNumber } from '@/lib/format'
import { toPersianDigits } from '@/lib/digits'

export type VendorListMode = 'requests' | 'stores'

type FilterOption = { value: string; label: string; statuses: VendorStatus[]; tone: string }

const MODES: Record<
  VendorListMode,
  {
    heading: string
    basePath: string
    searchLabel: string
    stats: { status: VendorStatus; label: string }[]
    filters: FilterOption[]
    emptyTitle: string
    emptyAll: string
  }
> = {
  requests: {
    heading: 'درخواست‌های فروشگاه',
    basePath: '/admin/store-requests',
    searchLabel: 'جست‌وجوی فروشگاه',
    stats: [
      { status: 'pending', label: 'در انتظار بررسی' },
      { status: 'approved', label: 'تأییدشده' },
      { status: 'rejected', label: 'ردشده' },
    ],
    filters: [
      { value: 'all', label: 'همه', statuses: [], tone: 'bg-surface-sage' },
      { value: 'pending', label: 'در انتظار', statuses: ['pending'], tone: 'bg-surface-sage' },
      {
        value: 'approved',
        label: 'تأییدشده',
        statuses: ['approved'],
        tone: 'bg-surface-sage text-success',
      },
      {
        value: 'rejected',
        label: 'ردشده',
        statuses: ['rejected'],
        tone: 'bg-error-subtle text-error',
      },
    ],
    emptyTitle: 'درخواستی پیدا نشد',
    emptyAll: 'هنوز درخواستی برای افزودن فروشگاه ثبت نشده است.',
  },
  stores: {
    heading: 'فروشگاه‌های فعال و تعلیق‌شده',
    basePath: '/admin/stores',
    searchLabel: 'جست‌وجوی فروشگاه',
    stats: [
      { status: 'approved', label: 'فعال' },
      { status: 'suspended', label: 'تعلیق‌شده' },
    ],
    filters: [
      { value: 'all', label: 'همه', statuses: ['approved', 'suspended'], tone: 'bg-surface-sage' },
      {
        value: 'approved',
        label: 'فعال',
        statuses: ['approved'],
        tone: 'bg-surface-sage text-success',
      },
      {
        value: 'suspended',
        label: 'تعلیق‌شده',
        statuses: ['suspended'],
        tone: 'bg-surface-secondary text-text-secondary',
      },
    ],
    emptyTitle: 'فروشگاهی پیدا نشد',
    emptyAll: 'هنوز فروشگاه تأییدشده‌ای وجود ندارد.',
  },
}

const PAGE_SIZE = 20

function actionFor(vendor: Vendor, mode: VendorListMode) {
  if (vendor.status === 'pending')
    return { label: 'بررسی فروشگاه', mobile: 'بررسی فروشگاه', primary: true }
  if (mode === 'stores') return { label: 'مشاهده', mobile: 'مشاهده و مدیریت', primary: false }
  if (vendor.status === 'approved')
    return { label: 'مشاهده', mobile: 'مشاهده تصمیم', primary: false }
  return { label: 'مشاهده', mobile: 'مشاهده دلیل', primary: false }
}

function SkeletonRows() {
  return (
    <div role="status" aria-label="در حال بارگذاری" className="flex flex-col gap-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-lg bg-surface-secondary motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

export default function VendorListPage({ mode }: { mode: VendorListMode }) {
  const config = MODES[mode]
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const filterValue = config.filters.some((f) => f.value === searchParams.get('status'))
    ? (searchParams.get('status') as string)
    : 'all'
  const search = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const filter = config.filters.find((f) => f.value === filterValue) ?? config.filters[0]

  const [searchInput, setSearchInput] = useState(search)
  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<{
    key: string
    data: VendorListResponse | null
    error: DescribedError | null
  } | null>(null)

  const updateParams = useCallback(
    (changes: Record<string, string | null>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          Object.entries(changes).forEach(([key, value]) =>
            value ? next.set(key, value) : next.delete(key),
          )
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = setTimeout(() => updateParams({ q: searchInput.trim() || null, page: null }), 350)
    return () => clearTimeout(timer)
  }, [searchInput, search, updateParams])

  const requestKey = `${mode}|${filter.value}|${search}|${page}|${reloadCount}`
  useEffect(() => {
    let active = true
    vendorApprovalApi
      .list({ statuses: filter.statuses, search, page, pageSize: PAGE_SIZE })
      .then((data) => {
        if (active) setResult({ key: requestKey, data, error: null })
      })
      .catch((caught) => {
        if (active)
          setResult((previous) => ({
            key: requestKey,
            data: previous?.data ?? null,
            error: describeError(caught, 'اتصال اینترنت را بررسی و دوباره تلاش کنید.'),
          }))
      })
    return () => {
      active = false
    }
  }, [filter, search, page, requestKey])

  const loading = result?.key !== requestKey
  const data = result?.data ?? null
  const error = loading ? null : (result?.error ?? null)
  const load = () => setReloadCount((count) => count + 1)

  const hasFilters = filterValue !== 'all' || Boolean(search)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  function clearFilters() {
    setSearchInput('')
    updateParams({ status: null, q: null, page: null })
  }

  const filterSummary = [search, filterValue !== 'all' ? filter.label : null]
    .filter(Boolean)
    .join(' · ')
  const loginReturnTo = encodeURIComponent(location.pathname + location.search)

  return (
    <div className="mx-auto flex w-full max-w-260 flex-col gap-4">
      {data && (
        <dl className={`grid gap-3 ${config.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {config.stats.map(({ status, label }) => (
            <div
              key={status}
              className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-4 sm:p-5"
            >
              <dt className="text-caption text-text-secondary">{label}</dt>
              <dd className="text-title-xl">{formatNumber(data.counts[status])}</dd>
            </div>
          ))}
        </dl>
      )}

      <SearchField
        label={config.searchLabel}
        placeholder={config.searchLabel}
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        onClear={() => setSearchInput('')}
        className="bg-surface"
      />

      <div
        role="group"
        aria-label="فیلتر وضعیت"
        className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:px-0"
        style={{ gridTemplateColumns: `repeat(${config.filters.length}, minmax(0, 1fr))` }}
      >
        {config.filters.map((option) => {
          const selected = option.value === filterValue
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                updateParams({ status: option.value === 'all' ? null : option.value, page: null })
              }
              className={[
                'h-9 min-w-24 shrink-0 rounded-md px-3 text-start text-label-md transition-shadow',
                option.tone,
                selected
                  ? 'font-bold shadow-[inset_0_0_0_1.5px_var(--color-primary)]'
                  : 'opacity-80 hover:opacity-100',
              ].join(' ')}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {error ? (
        <StateCard
          tone="error"
          title={mode === 'requests' ? 'درخواست‌ها بارگذاری نشد' : 'فروشگاه‌ها بارگذاری نشد'}
          action={
            error.unauthorized || error.forbidden ? (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to={`/admin/login?returnTo=${loginReturnTo}`}
                  className={linkButtonClass('primary', 'w-full')}
                >
                  ورود به پنل مدیریت
                </Link>
                <Button variant="secondary" fullWidth size="md" onClick={load}>
                  تلاش دوباره
                </Button>
              </div>
            ) : (
              <Button fullWidth size="md" onClick={load}>
                تلاش دوباره
              </Button>
            )
          }
        >
          {error.message}
        </StateCard>
      ) : loading && !data ? (
        <SkeletonRows />
      ) : data && data.items.length === 0 ? (
        <>
          {filterSummary && (
            <p className="rounded-lg border border-border-default bg-surface p-4 text-body-md text-text-secondary">
              {filterSummary}
            </p>
          )}
          <StateCard
            tone="empty"
            title={config.emptyTitle}
            action={
              hasFilters && (
                <Button fullWidth size="md" onClick={clearFilters}>
                  پاک کردن فیلترها
                </Button>
              )
            }
          >
            {hasFilters
              ? `برای مشاهدهٔ همهٔ ${mode === 'requests' ? 'درخواست‌ها' : 'فروشگاه‌ها'}، فیلترها را پاک کنید.`
              : config.emptyAll}
          </StateCard>
        </>
      ) : (
        data && (
          <section
            aria-busy={loading}
            className={`rounded-lg border border-border-default bg-surface p-4 transition-opacity sm:p-5 ${loading ? 'opacity-60' : ''}`}
          >
            <h1 className="mb-4 text-title-md">{config.heading}</h1>

            <table className="hidden w-full text-start lg:table">
              <thead>
                <tr className="border-b border-border-default text-caption text-text-secondary">
                  <th scope="col" className="pb-3 text-start font-normal">
                    فروشگاه
                  </th>
                  <th scope="col" className="pb-3 text-start font-normal">
                    مالک و آدرس
                  </th>
                  <th scope="col" className="pb-3 text-start font-normal">
                    تاریخ
                  </th>
                  <th scope="col" className="pb-3 text-start font-normal">
                    وضعیت
                  </th>
                  <th scope="col" className="pb-3 text-start font-normal">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((vendor) => {
                  const action = actionFor(vendor, mode)
                  return (
                    <tr
                      key={vendor.id}
                      className="border-b border-border-default align-top last:border-0"
                    >
                      <td className="max-w-56 py-4 pe-4">
                        <p className="text-label-md">{vendor.storeName}</p>
                        <p className="mt-2 text-caption text-text-secondary">{vendor.category}</p>
                      </td>
                      <td className="py-4 pe-4">
                        <p className="text-label-md">{vendor.ownerName}</p>
                        <p className="mt-2 text-caption text-text-secondary">{vendor.address}</p>
                      </td>
                      <td className="py-4 pe-4 text-caption whitespace-nowrap">
                        {formatVendorDate(vendor.submittedAt)}
                      </td>
                      <td className="py-4 pe-4">
                        <VendorStatusBadge status={vendor.status} className="w-full min-w-28" />
                      </td>
                      <td className="w-48 py-4">
                        <Link
                          to={`${config.basePath}/${encodeURIComponent(vendor.id)}`}
                          state={{ vendor }}
                          aria-label={`${action.label} ${vendor.storeName}`}
                          className={linkButtonClass(
                            action.primary ? 'primary' : 'outline',
                            'h-11 w-full',
                          )}
                        >
                          {action.label}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <ul className="flex flex-col gap-3 lg:hidden">
              {data.items.map((vendor) => {
                const action = actionFor(vendor, mode)
                return (
                  <li
                    key={vendor.id}
                    className="flex flex-col gap-3 rounded-lg border border-border-default p-4"
                  >
                    <h2 className="text-label-lg">{vendor.storeName}</h2>
                    <VendorStatusBadge status={vendor.status} className="w-full" />
                    <dl className="flex flex-col gap-3 text-body-md">
                      {[
                        ['مالک', vendor.ownerName],
                        ['دسته‌بندی', vendor.category],
                        ['تاریخ', formatVendorDate(vendor.submittedAt)],
                        ['آدرس', vendor.address],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between gap-4">
                          <dt className="shrink-0 text-caption text-text-secondary">{label}</dt>
                          <dd className="text-end text-label-md">{value}</dd>
                        </div>
                      ))}
                    </dl>
                    <Link
                      to={`${config.basePath}/${encodeURIComponent(vendor.id)}`}
                      state={{ vendor }}
                      className={linkButtonClass(action.primary ? 'primary' : 'outline', 'w-full')}
                    >
                      {action.mobile}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {totalPages > 1 && (
              <nav
                aria-label="صفحه‌بندی"
                className="mt-4 flex items-center justify-between gap-3 border-t border-border-default pt-4"
              >
                <Button
                  variant="tertiary"
                  size="sm"
                  icon={<ChevronRight className="size-6" />}
                  disabled={page <= 1 || loading}
                  onClick={() => updateParams({ page: String(page - 1) })}
                >
                  قبلی
                </Button>
                <span className="text-caption text-text-secondary">
                  صفحهٔ {toPersianDigits(page)} از {toPersianDigits(totalPages)}
                </span>
                <Button
                  variant="tertiary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => updateParams({ page: String(page + 1) })}
                >
                  بعدی
                  <ChevronLeft className="size-6" />
                </Button>
              </nav>
            )}
          </section>
        )
      )}

      <p className="sr-only" role="status">
        {loading ? 'در حال بارگذاری…' : data ? `${toPersianDigits(data.total)} مورد` : ''}
      </p>
    </div>
  )
}

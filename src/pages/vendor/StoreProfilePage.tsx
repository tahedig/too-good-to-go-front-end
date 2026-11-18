import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { storeService } from '@/services/storeService'
import type {
  OpeningDay,
  StoreLocationDto,
  StoreProfileSource,
  VendorStore,
  VendorStoreForm,
  VendorStoreImage,
} from '@/types/storeTypes'

const CATEGORY_OPTIONS = [
  { value: '1', label: 'رستوران' },
  { value: '2', label: 'فست‌فود' },
  { value: '3', label: 'نانوایی' },
  { value: '4', label: 'قنادی' },
  { value: '5', label: 'کافه' },
  { value: '6', label: 'سوپرمارکت' },
  { value: '7', label: 'میوه و تره‌بار' },
]

const MAP_BOUNDS = { minLatitude: 35.62, maxLatitude: 35.75, minLongitude: 51.3, maxLongitude: 51.48 }

function mapPosition(location: StoreLocationDto) {
  return {
    x: Math.max(
      0,
      Math.min(100, ((location.longitude - MAP_BOUNDS.minLongitude) /
        (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) * 100),
    ),
    y: Math.max(
      0,
      Math.min(100, ((MAP_BOUNDS.maxLatitude - location.latitude) /
        (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) * 100),
    ),
  }
}

function MapPreview({
  location,
  selecting,
  onSelect,
}: {
  location: StoreLocationDto
  selecting: boolean
  onSelect: (location: StoreLocationDto) => void
}) {
  const marker = mapPosition(location)
  return (
    <button
      type="button"
      aria-label={selecting ? 'انتخاب موقعیت روی نقشه' : 'پیش‌نمایش موقعیت فروشگاه'}
      disabled={!selecting}
      onClick={(event) => {
        if (!selecting) return
        const bounds = event.currentTarget.getBoundingClientRect()
        onSelect({
          latitude:
            MAP_BOUNDS.maxLatitude -
            ((event.clientY - bounds.top) / bounds.height) *
              (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude),
          longitude:
            MAP_BOUNDS.minLongitude +
            ((event.clientX - bounds.left) / bounds.width) *
              (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude),
        })
      }}
      className={`relative h-52 w-full overflow-hidden rounded-md border border-border-default bg-[#e6e9dd] text-start ${
        selecting ? 'cursor-crosshair' : 'cursor-default'
      }`}
      style={{
        backgroundImage:
          'linear-gradient(28deg, transparent 46%, #fff 47%, #fff 50%, transparent 51%), linear-gradient(112deg, transparent 38%, #fff 39%, #fff 42%, transparent 43%), linear-gradient(165deg, transparent 65%, #d2ddc9 66%, #d2ddc9 74%, transparent 75%)',
      }}
    >
      <span className="absolute start-[12%] top-[18%] h-1 w-[45%] rotate-[18deg] rounded-full bg-white/90" />
      <span className="absolute end-[10%] top-[62%] h-1 w-[42%] -rotate-[22deg] rounded-full bg-white/90" />
      <span className="absolute bottom-[18%] start-[24%] h-1 w-[58%] -rotate-[10deg] rounded-full bg-white/90" />
      <span
        className="absolute z-10 -translate-x-1/2 -translate-y-full text-error"
        style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
      >
        <MapPin className="size-8 fill-error-subtle" strokeWidth={2} />
      </span>
      <span className="absolute bottom-3 start-3 rounded-md bg-surface/90 px-2 py-1 text-caption text-text-secondary">
        تهران · نقشهٔ آزمایشی
      </span>
    </button>
  )
}

function HoursEditor({
  days,
  onChange,
  disabled = false,
}: {
  days: OpeningDay[]
  onChange: (days: OpeningDay[]) => void
  disabled?: boolean
}) {
  function updateDay(index: number, patch: Partial<OpeningDay>) {
    onChange(days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)))
  }

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 lg:p-5">
      <div>
        <h2 className="text-title-md text-text-primary">ساعت کاری</h2>
        <p className="mt-1 text-body-md text-text-secondary">روزها و ساعت‌های فعالیت فروشگاه</p>
      </div>
      <div className="flex flex-col divide-y divide-border-default">
        {days.map((day, index) => (
          <div key={day.day} className="grid gap-3 py-3 sm:grid-cols-[minmax(96px,1fr)_auto_auto] sm:items-center">
            <label className="flex items-center gap-3 text-label-md text-text-primary">
              <input
                type="checkbox"
                checked={day.enabled}
                disabled={disabled}
                onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                className="size-5 accent-primary"
              />
              {day.day}
            </label>
            {day.enabled ? (
              <>
                <label className="flex items-center gap-2 text-caption text-text-secondary">
                  از
                  <input
                    type="time"
                    aria-label={`${day.day} شروع`}
                    value={day.opensAt}
                    disabled={disabled}
                    onChange={(event) => updateDay(index, { opensAt: event.target.value })}
                    className="h-11 min-w-0 rounded-md border border-border-input bg-surface px-2 text-body-md text-text-primary"
                  />
                </label>
                <label className="flex items-center gap-2 text-caption text-text-secondary">
                  تا
                  <input
                    type="time"
                    aria-label={`${day.day} پایان`}
                    value={day.closesAt}
                    disabled={disabled}
                    onChange={(event) => updateDay(index, { closesAt: event.target.value })}
                    className="h-11 min-w-0 rounded-md border border-border-input bg-surface px-2 text-body-md text-text-primary"
                  />
                </label>
              </>
            ) : (
              <span className="text-body-md text-text-secondary sm:col-span-2">تعطیل</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

export default function StoreProfilePage({ storeId }: { storeId?: string }) {
  const params = useParams()
  const id = storeId ?? params.id ?? ''
  const navigate = useNavigate()
  const [profile, setProfile] = useState<{
    id: string
    store?: VendorStore
    source?: StoreProfileSource
    form?: VendorStoreForm
    originalImages?: VendorStoreImage[]
    error?: string
  } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectingLocation, setSelectingLocation] = useState(false)
  const loading = !profile || profile.id !== id

  useEffect(() => {
    let active = true
    storeService
      .get(id)
      .then(({ store, source }) => {
        if (!active) return
        const form: VendorStoreForm = {
          name: store.name,
          owner: store.owner,
          categoryId: store.categoryId,
          phone: store.phone,
          address: store.address,
          description: store.description,
          pickupInstructions: store.pickupInstructions,
          images: store.images,
          openingHours: store.openingHours,
          workingHoursConfigured: store.workingHoursConfigured,
          location: store.location,
        }
        setProfile({
          id,
          store,
          source,
          form,
          originalImages: store.images,
        })
      })
      .catch((reason: unknown) => {
        if (active)
          setProfile({
            id,
            error:
              reason instanceof Error ? reason.message : 'دریافت اطلاعات فروشگاه ممکن نیست.',
          })
      })
    return () => {
      active = false
    }
  }, [id])

  function updateForm(patch: Partial<VendorStoreForm>) {
    setProfile((current) =>
      current?.id === id && current.form
        ? { ...current, form: { ...current.form, ...patch } }
        : current,
    )
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile?.form || !profile.source || saving) return
    setSaving(true)
    setError('')
    try {
      if (profile.source === 'new-request') {
        await storeService.createRequest(profile.form)
        navigate('/vendor/stores', { state: { message: 'درخواست ثبت فروشگاه ارسال شد.' } })
      } else if (profile.source === 'store') {
        await storeService.update(id, profile.form, profile.originalImages ?? [])
        navigate('/vendor/stores', { state: { message: 'مشخصات فروشگاه ذخیره شد.' } })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ذخیره اطلاعات فروشگاه ممکن نیست.')
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <p role="status" className="p-6">
        در حال دریافت مشخصات فروشگاه...
      </p>
    )

  if (!profile?.store || !profile.form)
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-8">
        <InlineAlert tone="error">{error || profile?.error || 'مشخصات فروشگاه در دسترس نیست.'}</InlineAlert>
        <Link to="/vendor/stores" className="text-label-md text-primary">
          بازگشت به فروشگاه‌ها
        </Link>
      </div>
    )

  const { store, form } = profile
  const source = profile.source ?? 'request'
  const isNewRequest = source === 'new-request'
  const isReadOnly = source === 'request'

  return (
    <form onSubmit={save} className="flex flex-col gap-5 p-4 lg:px-20 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">
          {isNewRequest ? 'ثبت فروشگاه' : 'مشخصات فروشگاه'}
        </h1>
        <div className="flex items-center gap-3">
          {!isNewRequest && (
            <span
              className={`rounded-full px-3 py-1 text-caption font-semibold ${
                store.status === 'approved'
                  ? 'bg-success-subtle text-success'
                  : store.status === 'rejected' || store.status === 'suspended'
                    ? 'bg-error-subtle text-error'
                    : 'bg-warning-subtle text-warning'
              }`}
            >
              {store.statusLabel}
            </span>
          )}
          <Link
            to="/vendor/stores"
            className="flex h-11 items-center gap-2 rounded-md border border-border-default bg-surface px-4 text-label-md text-text-primary hover:bg-surface-secondary"
          >
            <ArrowRight className="size-5" strokeWidth={1.75} />
            بازگشت
          </Link>
        </div>
      </div>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}
      {isNewRequest && (
        <InlineAlert tone="info">
          برای ثبت درخواست، نام فروشگاه، دسته‌بندی، مالک و آدرس به سرور ارسال می‌شوند. سایر
          مشخصات پس از تأیید فروشگاه قابل ویرایش هستند.
        </InlineAlert>
      )}
      {isReadOnly && (
        <InlineAlert tone="info">
          درخواست ثبت‌شده فقط برای مشاهده است و از این بخش قابل ویرایش نیست.
        </InlineAlert>
      )}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 lg:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-title-md text-text-primary">تصویر فروشگاه</h2>
                <p className="mt-1 text-body-md text-text-secondary">تصاویر فروشگاه را انتخاب کنید.</p>
              </div>
              <span className="text-caption text-text-secondary">{form.images.length} تصویر</span>
            </div>

            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {form.images.map((image, index) => (
                  <div key={image.id} className="group relative">
                    <img
                      src={image.url}
                      alt={`تصویر ${store.name} ${index + 1}`}
                      className="h-32 w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      disabled={
                        source !== 'store' ||
                        form.images.length === 1 ||
                        form.images.some((item) => !item.id)
                      }
                      onClick={() =>
                        updateForm({
                          images: form.images.filter((_, itemIndex) => itemIndex !== index),
                        })
                      }
                      aria-label={`حذف تصویر ${index + 1}`}
                      className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-surface text-error shadow-2 disabled:cursor-not-allowed disabled:text-text-disabled"
                    >
                      <Trash2 className="size-5" strokeWidth={1.75} />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-2 start-2 rounded-sm bg-surface/90 px-2 py-1 text-caption text-text-primary">
                        تصویر اصلی
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid min-h-32 place-items-center rounded-md border border-dashed border-border-input text-body-md text-text-secondary">
                هنوز تصویری انتخاب نشده است.
              </div>
            )}

            <div className="flex flex-col items-start gap-2">
              <Button
                type="button"
                variant="secondary"
                icon={<ImagePlus className="size-5" strokeWidth={1.75} />}
                disabled
              >
                افزودن تصویر
              </Button>
              <p className="text-caption text-text-secondary">
                بارگذاری تصویر از طریق API فروشگاه هنوز پشتیبانی نمی‌شود.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 lg:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-title-md text-text-primary">موقعیت مکانی</h2>
                <p className="mt-1 text-body-md text-text-secondary">{form.address}</p>
              </div>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                disabled={source !== 'store'}
                onClick={() => setSelectingLocation((current) => !current)}
              >
                {selectingLocation ? 'لغو انتخاب' : 'تغییر موقعیت'}
              </Button>
            </div>
            {selectingLocation && (
              <p className="text-caption text-primary">برای ثبت موقعیت، نقطهٔ موردنظر را روی نقشه بزنید.</p>
            )}
            <MapPreview
              location={form.location}
              selecting={source === 'store' && selectingLocation}
              onSelect={(location) => {
                updateForm({ location })
                setSelectingLocation(false)
              }}
            />
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-lg bg-surface p-4 lg:p-5">
            <h2 className="text-title-md text-text-primary">
              {store.name || 'مشخصات فروشگاه'}
            </h2>
            <Input
              label="نام فروشگاه"
              value={form.name}
              disabled={isReadOnly}
              onChange={(event) => updateForm({ name: event.target.value })}
              required
            />
            <Select
              label="دسته‌بندی فعالیت"
              value={form.categoryId === null ? '' : String(form.categoryId)}
              onChange={(event) => updateForm({ categoryId: Number(event.target.value) })}
              options={CATEGORY_OPTIONS}
              disabled={isReadOnly}
            />
            <Input
              label="مالک / شخص رابط"
              value={form.owner}
              disabled={!isNewRequest}
              onChange={(event) => updateForm({ owner: event.target.value })}
              required={isNewRequest}
            />
            <Input
              label="شماره تماس"
              type="tel"
              ltrValue
              value={form.phone}
              disabled={source !== 'store'}
              onChange={(event) => updateForm({ phone: event.target.value })}
            />
            <Input
              label="آدرس"
              value={form.address}
              disabled={isReadOnly}
              onChange={(event) => updateForm({ address: event.target.value })}
              required
            />
            <TextArea
              label="توضیحات فروشگاه"
              value={form.description}
              disabled={source !== 'store'}
              onChange={(event) => updateForm({ description: event.target.value })}
              required
              rows={3}
            />
            <TextArea
              label="راهنمای تحویل"
              value={form.pickupInstructions}
              disabled={source !== 'store'}
              onChange={(event) => updateForm({ pickupInstructions: event.target.value })}
              rows={2}
            />
          </section>

          <HoursEditor
            days={form.openingHours}
            onChange={(openingHours) =>
              updateForm({ openingHours, workingHoursConfigured: true })
            }
            disabled={source !== 'store'}
          />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex justify-start">
          <Button type="submit" isLoading={saving} className="w-full sm:w-auto">
            {isNewRequest ? 'ثبت درخواست' : 'ذخیره'}
          </Button>
        </div>
      )}
    </form>
  )
}

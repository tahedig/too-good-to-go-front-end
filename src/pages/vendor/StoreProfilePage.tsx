import { useEffect, useId, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { DEFAULT_STORE_CATEGORIES, storeService } from '@/services/storeService'
import type { StoreCategoryOption } from '@/services/storeService'
import type {
  OpeningDay,
  StoreLocationDto,
  StoreProfileSource,
  VendorStore,
  VendorStoreForm,
  VendorStoreImage,
} from '@/types/storeTypes'

const MAP_BOUNDS = {
  minLatitude: 35.62,
  maxLatitude: 35.75,
  minLongitude: 51.3,
  maxLongitude: 51.48,
}

function mapPosition(location: StoreLocationDto) {
  return {
    x: Math.max(
      0,
      Math.min(
        100,
        ((location.longitude - MAP_BOUNDS.minLongitude) /
          (MAP_BOUNDS.maxLongitude - MAP_BOUNDS.minLongitude)) *
          100,
      ),
    ),
    y: Math.max(
      0,
      Math.min(
        100,
        ((MAP_BOUNDS.maxLatitude - location.latitude) /
          (MAP_BOUNDS.maxLatitude - MAP_BOUNDS.minLatitude)) *
          100,
      ),
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
  <section className="flex flex-col gap-4 rounded-xl bg-surface p-5">
    <div>
      <h2 className="text-title-md text-text-primary">ساعت کاری</h2>
      <p className="mt-1 text-body-md text-text-secondary">روزها و ساعت‌های فعالیت فروشگاه</p>
    </div>
    <div className="flex flex-col divide-y divide-border-default">
      {days.map((day, index) => (
        <div key={day.day} className="flex flex-col gap-2 py-3">
          <label className="flex items-center justify-between gap-3 text-label-md text-text-primary">
            <span>{day.day}</span>
            <span className="relative">
              <input
                type="checkbox"
                checked={day.enabled}
                disabled={disabled}
                onChange={(event) => updateDay(index, { enabled: event.target.checked })}
                className="peer sr-only"
              />
              <span className="block h-7 w-12 rounded-full border border-border-input bg-surface-secondary transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-surface" />
            </span>
          </label>
          {day.enabled ? (
            <div className="flex items-center gap-2 text-caption text-text-secondary">
              <label className="flex flex-1 items-center gap-2 text-caption text-text-secondary">
                از
                <input
                  type="time"
                  aria-label={`${day.day} شروع`}
                  value={day.opensAt}
                  disabled={disabled}
                  onChange={(event) => updateDay(index, { opensAt: event.target.value })}
                  className="h-11 flex-1 rounded-md border border-border-input bg-surface px-2 text-body-md text-text-primary"
                />
              </label>
              <span>تا</span>
              <label className="flex flex-1 items-center gap-2 text-caption text-text-secondary">
                <input
                  type="time"
                  aria-label={`${day.day} پایان`}
                  value={day.closesAt}
                  disabled={disabled}
                  onChange={(event) => updateDay(index, { closesAt: event.target.value })}
                  className="h-11 flex-1 rounded-md border border-border-input bg-surface px-2 text-body-md text-text-primary"
                />
              </label>
            </div>
          ) : (
            <span className="text-body-md text-text-secondary">تعطیل</span>
          )}
        </div>
      ))}
    </div>
  </section>
)
}

export default function StoreProfilePage() {
  const params = useParams()
  const id = params.id ?? ''
  const navigate = useNavigate()
  const uploadId = useId()
  const [profile, setProfile] = useState<{
    id: string
    store?: VendorStore
    source?: StoreProfileSource
    form?: VendorStoreForm
    originalImages?: VendorStoreImage[]
    error?: string
    errorStatus?: number | null
  } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectingLocation, setSelectingLocation] = useState(false)
  const [categories, setCategories] = useState<StoreCategoryOption[]>(DEFAULT_STORE_CATEGORIES)
  const loading = !profile || profile.id !== id

  useEffect(() => {
    const controller = new AbortController()
    storeService
      .get(id, controller.signal)
      .then(({ store, source }) => {
        if (controller.signal.aborted) return
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
        if (!controller.signal.aborted)
          setProfile({
            id,
            error: reason instanceof Error ? reason.message : 'دریافت اطلاعات فروشگاه ممکن نیست.',
          })
      })
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    const controller = new AbortController()
    storeService
      .listCategories(controller.signal)
      .then(setCategories)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

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
      if (profile.source === 'store') {
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

  if (!profile?.store || !profile.form) {
    return (
      <div className="flex flex-col gap-4 p-4 lg:p-8">
        <InlineAlert tone="error">
          {error || profile?.error || 'مشخصات فروشگاه در دسترس نیست.'}
        </InlineAlert>
        <Link to="/vendor/stores" className="text-label-md text-primary">
          بازگشت به فروشگاه‌ها
        </Link>
      </div>
    )
  }

  const { store, form } = profile
  const source = profile.source ?? 'request'
  const isReadOnly = source === 'request'

  return (
    <form onSubmit={save} className="flex flex-col gap-6 p-4 pb-8 lg:p-12">
      <div className="mx-auto flex w-full max-w-[1084px] items-center gap-3">
        <Link
          to="/vendor/stores"
          aria-label="بازگشت"
          className="grid size-11 place-items-center rounded-[10px] border border-border-default bg-surface text-text-primary hover:bg-surface-secondary"
        >
          <ArrowRight className="size-6" strokeWidth={1.75} />
        </Link>
        <h1 className="flex-1 text-[24px] font-bold leading-8 text-text-primary lg:text-[32px] lg:leading-[38px]">
          مشخصات فروشگاه
        </h1>
      </div>

      <div className="mx-auto w-full max-w-[1084px]">
        <span
          className={`inline-flex h-8 min-w-30 items-center rounded-xl px-3 text-[12px] font-bold ${
            store.status === 'approved'
              ? 'bg-success-subtle text-success'
              : store.status === 'rejected' || store.status === 'suspended'
                ? 'bg-error-subtle text-error'
                : 'bg-warning-subtle text-warning'
          }`}
        >
          {store.statusLabel}
        </span>
      </div>

      {error && (
        <div className="mx-auto w-full max-w-[1084px]">
          <InlineAlert tone="error">{error}</InlineAlert>
        </div>
      )}
      {isReadOnly && (
        <InlineAlert tone="info">
          درخواست ثبت‌شده فقط برای مشاهده است و از این بخش قابل ویرایش نیست.
        </InlineAlert>
      )}

      <div className="mx-auto grid w-full max-w-[1084px] items-start gap-6 xl:grid-cols-[556px_minmax(0,504px)] xl:[direction:ltr]">
        <div dir="rtl" className="flex flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-xl bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-title-md text-text-primary">تصویر فروشگاه</h2>
                <p className="mt-1 text-body-md text-text-secondary">
                  تصاویر فروشگاه را انتخاب کنید.
                </p>
              </div>
              <span className="text-caption text-text-secondary">{form.images.length} تصویر</span>
            </div>

            {form.images.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {form.images.map((image, index) => (
                  <div
                    key={image.id}
                    className="group relative h-40 min-w-52 overflow-hidden rounded-[10px]"
                  >
                    <img
                      src={image.url}
                      alt={`تصویر ${store.name} ${index + 1}`}
                      className="size-full object-cover"
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

            {!isReadOnly && (
              <div>
                <label
                  htmlFor={uploadId}
                  className="inline-flex h-12 cursor-pointer items-center gap-2 rounded-[10px] border border-primary px-5 text-[14px] font-medium text-primary"
                >
                  <ImagePlus className="size-5" strokeWidth={1.75} /> افزودن تصویر
                </label>
                <input
                  id={uploadId}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? [])
                    updateForm({
                      images: [
                        ...form.images,
                        ...files.map((file, index) => ({
                          id: `local-${Date.now()}-${index}`,
                          url: URL.createObjectURL(file),
                          is_primary: form.images.length === 0 && index === 0,
                          sort_order: form.images.length + index,
                          local: true,
                        })),
                      ],
                    })
                    event.target.value = ''
                  }}
                />
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-xl bg-surface p-5">
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
              <p className="text-caption text-primary">
                برای ثبت موقعیت، نقطهٔ موردنظر را روی نقشه بزنید.
              </p>
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

        <div dir="rtl" className="flex flex-col gap-5">
          <section className="flex flex-col gap-4 rounded-xl bg-surface p-5">
            <h2 className="text-[18px] font-bold leading-7 text-text-primary">
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
              options={categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
              disabled={isReadOnly}
            />
            <Input label="مالک / شخص رابط" value={form.owner} disabled />
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
            onChange={(openingHours) => updateForm({ openingHours, workingHoursConfigured: true })}
            disabled={source !== 'store'}
          />
        </div>
      </div>

      {!isReadOnly && (
        <div className="mx-auto grid h-12 w-full max-w-[1084px] grid-cols-2 gap-3">
          <Button
            type="button"
            variant="destructive"
            fullWidth
            className="h-12! rounded-xl!"
            onClick={() => navigate('/vendor/stores')}
          >
            لغو
          </Button>
          <Button type="submit" fullWidth isLoading={saving} className="h-12! rounded-xl!">
            ذخیره
          </Button>
        </div>
      )}
    </form>
  )
}

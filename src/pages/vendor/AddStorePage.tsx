import { useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { DEFAULT_STORE_CATEGORIES, storeService } from '@/services/storeService'
import type { StoreCategoryOption } from '@/services/storeService'
import type { OpeningDay, StoreLocationDto, VendorStoreForm } from '@/types/storeTypes'

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه']
const DEFAULT_LOCATION = { latitude: 35.6892, longitude: 51.389 }
const initialForm: VendorStoreForm = {
  name: '',
  owner: '',
  categoryId: null,
  phone: '',
  address: '',
  description: '',
  pickupInstructions: '',
  images: [],
  workingHoursConfigured: true,
  location: DEFAULT_LOCATION,
  openingHours: DAYS.map((day, dayOfWeek) => ({
    day,
    dayOfWeek,
    enabled: dayOfWeek < 5,
    opensAt: '08:00',
    closesAt: '18:00',
  })),
}

function HoursEditor({
  days,
  onChange,
}: {
  days: OpeningDay[]
  onChange: (days: OpeningDay[]) => void
}) {
  const updateDay = (index: number, patch: Partial<OpeningDay>) =>
    onChange(days.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)))

  return (
    <section className="rounded-xl bg-surface p-5">
      <h2 className="mb-4 text-[20px] font-bold leading-7 text-text-primary">ساعت کاری</h2>
      <div className="flex flex-col divide-y divide-border-default">
        {days.map((day, index) => (
          <div key={day.day} className="flex flex-col gap-2 py-3">
            <label className="flex items-center justify-between gap-3 text-[14px] font-medium text-text-primary">
              <span className="flex items-center gap-3">
                <span>{day.day}</span>
                <span className="text-[12px] font-normal text-text-secondary">
                  {day.enabled ? 'روز کاری' : 'روز تعطیل'}
                </span>
              </span>
              <span className="relative">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => updateDay(index, { enabled: e.target.checked })}
                  className="peer sr-only"
                />
                <span className="block h-7 w-12 rounded-full border border-border-input bg-surface-secondary transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-primary after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-surface" />
              </span>
            </label>
            {day.enabled ? (
              <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                <label className="flex flex-1 items-center gap-2 text-[12px] text-text-secondary">
                  از
                  <input
                    type="time"
                    aria-label={`${day.day} شروع`}
                    value={day.opensAt}
                    onChange={(e) => updateDay(index, { opensAt: e.target.value })}
                    className="h-10 flex-1 rounded-[10px] border border-border-input bg-surface px-2 text-center text-[14px] text-text-primary"
                  />
                </label>
                <span>تا</span>
                <label className="flex flex-1 items-center gap-2 text-[12px] text-text-secondary">
                  <input
                    type="time"
                    aria-label={`${day.day} پایان`}
                    value={day.closesAt}
                    onChange={(e) => updateDay(index, { closesAt: e.target.value })}
                    className="h-10 flex-1 rounded-[10px] border border-border-input bg-surface px-2 text-center text-[14px] text-text-primary"
                  />
                </label>
              </div>
            ) : (
              <span className="text-[14px] text-text-secondary">تعطیل</span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function LocationPicker({
  location,
  onChange,
}: {
  location: StoreLocationDto
  onChange: (location: StoreLocationDto) => void
}) {
  return (
    <section className="rounded-xl bg-surface p-5">
      <h2 className="mb-4 text-[20px] font-bold leading-7 text-text-primary">موقعیت مکانی</h2>
      <button
        type="button"
        aria-label="انتخاب موقعیت فروشگاه"
        onClick={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          onChange({
            latitude: 35.75 - ((event.clientY - bounds.top) / bounds.height) * 0.13,
            longitude: 51.3 + ((event.clientX - bounds.left) / bounds.width) * 0.18,
          })
        }}
        className="relative h-50 w-full overflow-hidden rounded-[10px] bg-[#e3e9da]"
        style={{
          backgroundImage:
            'linear-gradient(28deg, transparent 46%, #fff 47%, #fff 50%, transparent 51%), linear-gradient(112deg, transparent 38%, #fff 39%, #fff 42%, transparent 43%), linear-gradient(165deg, transparent 65%, #d2ddc9 66%, #d2ddc9 74%, transparent 75%)',
        }}
      >
        <MapPin
          className="absolute start-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-full fill-error-subtle text-error"
          strokeWidth={1.75}
        />
      </button>
      <p className="mt-3 text-[12px] leading-4 text-text-secondary">
        برای تعیین موقعیت دقیق، نقطه موردنظر را روی نقشه انتخاب کنید.
      </p>
      <p className="sr-only">
        {location.latitude}, {location.longitude}
      </p>
    </section>
  )
}

export default function AddStorePage() {
  const navigate = useNavigate()
  const uploadId = useId()
  const [form, setForm] = useState(initialForm)
  const [categories, setCategories] = useState<StoreCategoryOption[]>(DEFAULT_STORE_CATEGORIES)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const update = (patch: Partial<VendorStoreForm>) =>
    setForm((current) => ({ ...current, ...patch }))

  useEffect(() => {
    const controller = new AbortController()
    storeService
      .listCategories(controller.signal)
      .then(setCategories)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    if (!form.name.trim() || !form.address.trim() || form.categoryId === null) {
      setError('نام فروشگاه، دسته‌بندی و آدرس را کامل کنید.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await storeService.createRequest({
        ...form,
        name: form.name.trim(),
        owner: form.owner.trim(),
        address: form.address.trim(),
      })
      navigate('/vendor/stores', { state: { message: 'فروشگاه با موفقیت ثبت شد.' } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ثبت فروشگاه ممکن نیست.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 p-4 pb-8 lg:gap-4 lg:px-12 lg:py-6">
      <header className="mx-auto flex w-full max-w-[1344px] flex-col gap-2">
        <div className="flex items-center gap-3">
          <Link
            to="/vendor/stores"
            aria-label="بازگشت"
            className="grid size-11 place-items-center rounded-[10px] border border-border-default bg-surface text-text-primary"
          >
            <ArrowRight className="size-6" strokeWidth={1.75} />
          </Link>
          <h1 className="flex-1 text-[24px] font-bold leading-8 text-text-primary lg:text-[32px] lg:leading-[38px]">
            افزودن فروشگاه
          </h1>
        </div>
        <p className="text-[14px] leading-5 text-text-secondary">
          اطلاعات فروشگاه، ساعت کاری، تصاویر و موقعیت مکانی را ثبت کنید.
        </p>
      </header>
      {error && (
        <div className="mx-auto w-full max-w-[1344px]">
          <InlineAlert tone="error">{error}</InlineAlert>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-[1344px] items-start gap-4 xl:grid-cols-[528px_minmax(0,792px)] xl:gap-6 xl:[direction:ltr]">
        <div dir="rtl" className="flex flex-col gap-4">
          <section className="rounded-xl bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-bold leading-7 text-text-primary">تصویر فروشگاه</h2>
              <span className="text-[12px] leading-4 text-text-secondary">
                {form.images.length} تصویر
              </span>
            </div>
            <p className="mb-4 text-[12px] leading-4 text-text-secondary">
              تصویر اول به‌عنوان تصویر اصلی نمایش داده می‌شود.
            </p>
            <div className="flex min-h-40 gap-3 overflow-x-auto pb-1">
              {form.images.map((image, index) => (
                <div
                  key={image.id}
                  className="relative h-40 min-w-52 overflow-hidden rounded-[10px]"
                >
                  <img
                    src={image.url}
                    alt={`تصویر فروشگاه ${index + 1}`}
                    className="size-full object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute bottom-2 start-2 rounded-md bg-surface px-2 py-1 text-[12px] text-text-primary">
                      تصویر اصلی
                    </span>
                  )}
                  <button
                    type="button"
                    aria-label={`حذف تصویر ${index + 1}`}
                    onClick={() =>
                      update({ images: form.images.filter((_, itemIndex) => itemIndex !== index) })
                    }
                    className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-surface text-error shadow-1"
                  >
                    <Trash2 className="size-5" strokeWidth={1.75} />
                  </button>
                </div>
              ))}
              <label
                htmlFor={uploadId}
                className="grid h-40 min-w-52 cursor-pointer place-items-center rounded-[10px] border border-dashed border-border-input bg-background text-text-primary"
              >
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  <ImagePlus className="size-6" strokeWidth={1.75} /> افزودن تصویر
                </span>
              </label>
              <input
                id={uploadId}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  update({
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
          </section>
          <LocationPicker location={form.location} onChange={(location) => update({ location })} />
        </div>

        <div dir="rtl" className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-border-default bg-surface p-5">
            <h2 className="text-[20px] font-bold leading-7 text-text-primary">اطلاعات فروشگاه</h2>
            <Input
              label="نام فروشگاه"
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              required
            />
            <Input
              label="مالک / شخص رابط"
              value={form.owner}
              onChange={(e) => update({ owner: e.target.value })}
            />
            <Select
              label="دسته‌بندی فعالیت"
              placeholder="دسته‌بندی را انتخاب کنید"
              value={form.categoryId === null ? '' : String(form.categoryId)}
              onChange={(e) => update({ categoryId: Number(e.target.value) })}
              options={categories.map((category) => ({
                value: String(category.id),
                label: category.name,
              }))}
              required
            />
            <Input
              label="شماره تماس"
              type="tel"
              ltrValue
              value={form.phone}
              onChange={(e) => update({ phone: e.target.value })}
            />
            <Input
              label="آدرس فروشگاه"
              value={form.address}
              onChange={(e) => update({ address: e.target.value })}
              required
            />
            <TextArea
              label="راهنمای تحویل"
              value={form.pickupInstructions}
              onChange={(e) => update({ pickupInstructions: e.target.value })}
              rows={2}
            />
            <TextArea
              label="توضیحات فروشگاه"
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={4}
            />
          </section>
          <HoursEditor
            days={form.openingHours}
            onChange={(openingHours) => update({ openingHours, workingHoursConfigured: true })}
          />
        </div>
      </div>

      <p className="mx-auto w-full max-w-[1344px] text-[12px] leading-4 text-text-secondary">
        با ثبت فروشگاه، اطلاعات واردشده برای نمایش و مدیریت فروشگاه ذخیره می‌شود.
      </p>
      <div className="mx-auto grid h-13 w-full max-w-[1344px] grid-cols-2 gap-3">
        <Button
          type="button"
          variant="destructive"
          fullWidth
          className="h-13! rounded-[10px]!"
          onClick={() => navigate('/vendor/stores')}
        >
          لغو
        </Button>
        <Button type="submit" fullWidth isLoading={saving} className="h-13! rounded-[10px]!">
          ثبت فروشگاه
        </Button>
      </div>
    </form>
  )
}

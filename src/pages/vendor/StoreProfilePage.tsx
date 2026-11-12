import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ImagePlus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { TextArea } from '@/components/ui/TextArea'
import { storeRepository } from './data/stores'
import type { OpeningDay, VendorStore, VendorStoreInput } from './data/stores'

const CATEGORY_OPTIONS = [
  { value: 'نانوایی', label: 'نانوایی' },
  { value: 'شیرینی‌فروشی', label: 'شیرینی‌فروشی' },
  { value: 'کافه', label: 'کافه' },
  { value: 'رستوران', label: 'رستوران' },
]

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('خواندن تصویر ممکن نیست.'))
    }
    reader.onerror = () => reject(new Error('خواندن تصویر ممکن نیست.'))
    reader.readAsDataURL(file)
  })
}

function MapPreview({
  location,
  selecting,
  onSelect,
}: {
  location: VendorStore['location']
  selecting: boolean
  onSelect: (location: VendorStore['location']) => void
}) {
  return (
    <button
      type="button"
      aria-label={selecting ? 'انتخاب موقعیت روی نقشه' : 'پیش‌نمایش موقعیت فروشگاه'}
      disabled={!selecting}
      onClick={(event) => {
        if (!selecting) return
        const bounds = event.currentTarget.getBoundingClientRect()
        onSelect({
          x: Math.round(((event.clientX - bounds.left) / bounds.width) * 100),
          y: Math.round(((event.clientY - bounds.top) / bounds.height) * 100),
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
        style={{ left: `${location.x}%`, top: `${location.y}%` }}
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
}: {
  days: OpeningDay[]
  onChange: (days: OpeningDay[]) => void
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<{
    id: string
    store?: VendorStore
    form?: VendorStoreInput
    error?: string
  } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectingLocation, setSelectingLocation] = useState(false)
  const loading = !profile || profile.id !== id

  useEffect(() => {
    let active = true
    storeRepository
      .get(id)
      .then((result) => {
        if (!active) return
        if (!result) {
          setProfile({ id, error: 'فروشگاه پیدا نشد.' })
          return
        }
        const form: VendorStoreInput = {
          name: result.name,
          branch: result.branch,
          owner: result.owner,
          category: result.category,
          phone: result.phone,
          address: result.address,
          description: result.description,
          pickupInstructions: result.pickupInstructions,
          images: result.images,
          openingHours: result.openingHours,
          location: result.location,
        }
        setProfile({ id, store: result, form })
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

  function updateForm(patch: Partial<VendorStoreInput>) {
    setProfile((current) =>
      current?.id === id && current.form
        ? { ...current, form: { ...current.form, ...patch } }
        : current,
    )
  }

  async function addImages(files: FileList | null) {
    const form = profile?.id === id ? profile.form : undefined
    if (!files || files.length === 0 || !form) return
    setError('')
    try {
      const newImages = await Promise.all(Array.from(files).map(readImage))
      updateForm({ images: [...form.images, ...newImages] })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'افزودن تصویر ممکن نیست.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = profile?.id === id ? profile.form : undefined
    if (!form || saving) return
    setSaving(true)
    setError('')
    try {
      await storeRepository.save(id, form)
      navigate('/vendor/stores', { state: { message: 'مشخصات فروشگاه ذخیره شد.' } })
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

  return (
    <form onSubmit={save} className="flex flex-col gap-5 p-4 lg:px-20 lg:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">
          {id === 'new' ? 'ثبت فروشگاه' : 'مشخصات فروشگاه'}
        </h1>
        <div className="flex items-center gap-3">
          {id !== 'new' && (
            <span
              className={`rounded-full px-3 py-1 text-caption font-semibold ${
                store.status === 'approved'
                  ? 'bg-success-subtle text-success'
                  : 'bg-warning-subtle text-warning'
              }`}
            >
              {store.status === 'approved' ? 'تأییدشده' : 'در انتظار بررسی'}
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
                  <div key={`${image.slice(0, 40)}-${index}`} className="group relative">
                    <img
                      src={image}
                      alt={`تصویر ${store.name} ${index + 1}`}
                      className="h-32 w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => updateForm({ images: form.images.filter((_, itemIndex) => itemIndex !== index) })}
                      aria-label={`حذف تصویر ${index + 1}`}
                      className="absolute end-2 top-2 grid size-9 place-items-center rounded-full bg-surface text-error shadow-2"
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

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => void addImages(event.target.files)}
              className="sr-only"
              aria-label="انتخاب تصویر فروشگاه"
            />
            <Button
              type="button"
              variant="secondary"
              icon={<ImagePlus className="size-5" strokeWidth={1.75} />}
              onClick={() => fileInputRef.current?.click()}
              className="self-start"
            >
              افزودن تصویر
            </Button>
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
              selecting={selectingLocation}
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
              onChange={(event) => updateForm({ name: event.target.value })}
              required
            />
            <Select
              label="دسته‌بندی فعالیت"
              value={form.category}
              onChange={(event) => updateForm({ category: event.target.value })}
              options={CATEGORY_OPTIONS}
            />
            <Input
              label="مالک / شخص رابط"
              value={form.owner}
              onChange={(event) => updateForm({ owner: event.target.value })}
              required
            />
            <Input
              label="شماره تماس"
              type="tel"
              ltrValue
              value={form.phone}
              onChange={(event) => updateForm({ phone: event.target.value })}
              required
            />
            <Input
              label="آدرس"
              value={form.address}
              onChange={(event) => updateForm({ address: event.target.value })}
              required
            />
            <TextArea
              label="توضیحات فروشگاه"
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              rows={3}
            />
            <TextArea
              label="راهنمای تحویل"
              value={form.pickupInstructions}
              onChange={(event) => updateForm({ pickupInstructions: event.target.value })}
              rows={2}
            />
          </section>

          <HoursEditor
            days={form.openingHours}
            onChange={(openingHours) => updateForm({ openingHours })}
          />
        </div>
      </div>

      <div className="flex justify-start">
        <Button type="submit" isLoading={saving} className="w-full sm:w-auto">
          ذخیره
        </Button>
      </div>
    </form>
  )
}

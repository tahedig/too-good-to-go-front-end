import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, ChevronDown, MoreHorizontal, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Modal } from '@/components/ui/Modal'
import { QuantityStepper } from '@/components/ui/QuantityStepper'
import { toEnglishDigits, toPersianDigits } from '@/lib/digits'
import { formatPrice } from '@/lib/format'
import { productRepository } from './data/products'
import type { ProductInput, StoredProduct } from './data/products'

type FormValues = {
  name: string
  store: string
  category: string
  description: string
  originalPrice: string
  price: string
  quantity: number
  pickupDate: string
  startTime: string
  endTime: string
  cancellationTime: string
  allergens: string
  images: string[]
}
type Errors = Partial<Record<keyof FormValues, string>>
const blank: FormValues = {
  name: '',
  store: '',
  category: '',
  description: '',
  originalPrice: '',
  price: '',
  quantity: 1,
  pickupDate: '',
  startTime: '',
  endTime: '',
  cancellationTime: '',
  allergens: 'unknown',
  images: [],
}
const fieldClass =
  'w-full min-w-0 h-[46px] rounded-[12px] border bg-surface px-3 text-body-md text-text-primary focus-visible:outline-focus'

function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}
function priceNumber(value: string): number {
  const normalized = toEnglishDigits(value).replace(/[٬,\s]/g, '')
  return /^\d+$/.test(normalized) ? Number(normalized) : NaN
}
function validate(v: FormValues, draft: boolean): Errors {
  const errors: Errors = {}
  if (!v.name.trim()) errors.name = 'نام محصول را وارد کنید.'
  if (draft) {
    if (
      v.originalPrice &&
      (!Number.isSafeInteger(priceNumber(v.originalPrice)) || priceNumber(v.originalPrice) <= 0)
    )
      errors.originalPrice = 'قیمت اصلی معتبر وارد کنید.'
    if (v.price && (!Number.isSafeInteger(priceNumber(v.price)) || priceNumber(v.price) <= 0))
      errors.price = 'قیمت معتبر وارد کنید.'
    return errors
  }
  if (!v.store) errors.store = 'فروشگاه را انتخاب کنید.'
  if (!v.category) errors.category = 'دسته‌بندی را انتخاب کنید.'
  if (!v.description.trim()) errors.description = 'توضیحات محصول را وارد کنید.'
  const original = priceNumber(v.originalPrice),
    price = priceNumber(v.price)
  if (!Number.isSafeInteger(original) || original <= 0)
    errors.originalPrice = 'قیمت اصلی معتبر وارد کنید.'
  if (!Number.isSafeInteger(price) || price <= 0) errors.price = 'قیمت معتبر وارد کنید.'
  else if (Number.isSafeInteger(original) && original > 0 && price > original)
    errors.price = 'قیمت پس از تخفیف نمی‌تواند بیشتر از قیمت اصلی باشد.'
  if (!Number.isInteger(v.quantity) || v.quantity < 1)
    errors.quantity = 'تعداد باید عدد صحیح مثبت باشد.'
  if (!v.pickupDate) errors.pickupDate = 'تاریخ تحویل را انتخاب کنید.'
  else if (v.pickupDate < today()) errors.pickupDate = 'تاریخ تحویل گذشته است.'
  if (!v.startTime) errors.startTime = 'ساعت شروع را انتخاب کنید.'
  if (!v.endTime) errors.endTime = 'ساعت پایان را انتخاب کنید.'
  else if (v.startTime && v.endTime <= v.startTime)
    errors.endTime = 'ساعت پایان باید بعد از ساعت شروع باشد.'
  if (!v.cancellationTime) errors.cancellationTime = 'مهلت لغو را انتخاب کنید.'
  else if (v.startTime && v.cancellationTime > v.startTime)
    errors.cancellationTime = 'مهلت لغو نباید بعد از شروع تحویل باشد.'
  return errors
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[12px] bg-surface p-5">
      <h2 className="text-label-lg font-bold">{title}</h2>
      {children}
    </section>
  )
}
function Field({
  id,
  label,
  error,
  children,
}: {
  id: string
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label htmlFor={id} className="text-label-md font-bold">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-caption text-error">
          {error}
        </p>
      )}
    </div>
  )
}
function attrs(id: string, error?: string) {
  return {
    id,
    'aria-invalid': !!error,
    'aria-describedby': error ? `${id}-error` : undefined,
    className: `${fieldClass} ${error ? 'border-error' : 'border-border-default'}`,
  }
}

export default function ProductEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [values, setValues] = useState<FormValues>(blank)
  const [original, setOriginal] = useState<StoredProduct | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [alert, setAlert] = useState('')
  const [preview, setPreview] = useState(false)
  const [menu, setMenu] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!id) return
    let alive = true
    productRepository
      .get(id)
      .then((p) => {
        if (!alive) return
        if (!p) {
          setAlert('محصول پیدا نشد.')
          setLoading(false)
          return
        }
        setOriginal(p)
        setValues({
          name: p.name,
          store: p.store,
          category: p.category,
          description: p.description,
          originalPrice: String(p.originalPrice || ''),
          price: String(p.price || ''),
          quantity: p.inventory.total,
          pickupDate: p.pickupDate,
          startTime: p.startTime,
          endTime: p.endTime,
          cancellationTime: p.cancellationTime,
          allergens: p.allergens,
          images: p.images,
        })
        setLoading(false)
      })
      .catch(() => {
        if (alive) {
          setAlert('دریافت محصول ممکن نیست.')
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [id])
  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }
  async function save(draft: boolean) {
    if (saving) return
    const nextErrors = validate(values, draft)
    if (original && values.quantity < original.inventory.reserved)
      nextErrors.quantity = 'تعداد نمی‌تواند کمتر از تعداد رزرو باشد.'
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      setAlert('فیلدهای مشخص‌شده را اصلاح کنید.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const input: ProductInput = {
      ...values,
      name: values.name.trim(),
      originalPrice: priceNumber(values.originalPrice) || 0,
      price: priceNumber(values.price) || 0,
      status: draft ? 'draft' : 'active',
      imageSrc: values.images[0],
    }
    setSaving(true)
    try {
      await productRepository.save(input, id)
      navigate('/vendor/products', {
        replace: true,
        state: { message: draft ? 'پیش‌نویس ذخیره شد.' : 'محصول منتشر شد.' },
      })
      window.scrollTo({ top: 0 })
    } catch (error) {
      setAlert(error instanceof Error ? error.message : 'ذخیره محصول ممکن نیست.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }
  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return
    if (
      files.length + values.images.length > 5 ||
      files.some((file) => !file.type.startsWith('image/') || file.size > 1024 * 1024)
    ) {
      setAlert('حداکثر ۵ تصویر و حجم هر تصویر حداکثر ۱ مگابایت است.')
      return
    }
    try {
      const urls = await Promise.all(
        files.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result))
              reader.onerror = () => reject(new Error('خواندن تصویر ممکن نیست.'))
              reader.readAsDataURL(file)
            }),
        ),
      )
      setValues((current) => ({ ...current, images: [...current.images, ...urls] }))
    } catch {
      setAlert('خواندن تصویر ممکن نیست.')
    }
  }
  function move(index: number, target: number) {
    if (target < 0 || target >= values.images.length) return
    const images = [...values.images]
    const [item] = images.splice(index, 1)
    images.splice(target, 0, item)
    update('images', images)
    setMenu(null)
  }
  if (loading)
    return (
      <p className="p-6" role="status">
        در حال دریافت محصول...
      </p>
    )
  if (id && !original)
    return (
      <div className="p-6">
        <InlineAlert tone="error">{alert || 'محصول پیدا نشد.'}</InlineAlert>
        <Link className="mt-4 inline-block underline" to="/vendor/products">
          بازگشت به محصولات
        </Link>
      </div>
    )
  const select = (
    key: 'store' | 'category' | 'allergens',
    options: { value: string; label: string }[],
  ) => (
    <div className="relative">
      <select
        {...attrs(key, errors[key])}
        value={values[key]}
        onChange={(e) => update(key, e.target.value)}
        className={`${attrs(key, errors[key]).className} appearance-none pe-10`}
      >
        <option value="">انتخاب کنید</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute end-3 top-3 size-5" />
    </div>
  )
  const text = (
    key:
      | 'name'
      | 'originalPrice'
      | 'price'
      | 'pickupDate'
      | 'startTime'
      | 'endTime'
      | 'cancellationTime',
    type = 'text',
  ) => (
    <input
      {...attrs(key, errors[key])}
      type={type}
      value={values[key]}
      onChange={(e) => update(key, e.target.value)}
    />
  )
  return (
    <div className="flex flex-col gap-6 p-4 lg:p-12">
      <div className="flex items-center gap-3">
        <Link
          to="/vendor/products"
          aria-label="بازگشت به محصولات"
          className="grid size-11 shrink-0 place-items-center rounded-[12px] border border-border-default bg-surface"
        >
          <ArrowRight size={24} />
        </Link>
        <h1 className="text-title-lg font-bold lg:text-title-xl">
          {Object.keys(errors).length ? 'اصلاح اطلاعات محصول' : id ? 'ویرایش محصول' : 'ساخت محصول'}
        </h1>
      </div>
      {alert && (
        <div
          className="flex items-center gap-2 rounded-md border border-error bg-surface shadow-2"
        >
          <InlineAlert tone="error" className="flex-1 bg-surface">
            {alert}
          </InlineAlert>
          <button
            type="button"
            onClick={() => setAlert('')}
            aria-label="بستن پیام"
            className="me-4"
          >
            <X size={20} />
          </button>
        </div>
      )}
      <span className="self-start rounded-[12px] bg-warning-subtle px-3 py-2 text-caption text-warning">
        {original?.status === 'active' ? 'فعال' : 'پیش‌نویس'}
      </span>
      <p className="text-caption font-bold">برای انتشار، همه فیلدها به‌جز تصاویر الزامی هستند.</p>
      <form
        noValidate
        onSubmit={(event: FormEvent) => {
          event.preventDefault()
          void save(false)
        }}
        className="flex flex-col gap-6"
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <Section title="جزئیات محصول">
              <Field id="name" label="نام محصول" error={errors.name}>
                {text('name')}
              </Field>
              <Field id="store" label="فروشگاه" error={errors.store}>
                {select('store', [{ value: 'نان صبحگاهی', label: 'نان صبحگاهی' }])}
              </Field>
              <Field id="category" label="دسته‌بندی" error={errors.category}>
                {select('category', [{ value: 'نانوایی', label: 'نانوایی' }])}
              </Field>
              <Field id="description" label="توضیحات" error={errors.description}>
                <textarea
                  {...attrs('description', errors.description)}
                  value={values.description}
                  onChange={(e) => update('description', e.target.value)}
                  className={`${attrs('description', errors.description).className} h-[74px] resize-y py-3`}
                />
              </Field>
            </Section>
            <Section title="قیمت و موجودی">
              <Field id="originalPrice" label="قیمت اصلی" error={errors.originalPrice}>
                <div className="flex items-center gap-2">
                  {text('originalPrice')}
                  <span>تومان</span>
                </div>
              </Field>
              <Field id="price" label="قیمت پس از تخفیف" error={errors.price}>
                <div className="flex items-center gap-2">
                  {text('price')}
                  <span>تومان</span>
                </div>
              </Field>
              <div className="flex flex-col gap-2">
                <span className="text-label-md font-bold">تعداد بسته‌ها</span>
                <QuantityStepper
                  label="تعداد بسته‌ها"
                  min={Math.max(1, original?.inventory.reserved ?? 0)}
                  value={values.quantity}
                  onChange={(value) => update('quantity', value)}
                />
                {errors.quantity && <p className="text-caption text-error">{errors.quantity}</p>}
              </div>
            </Section>
            <Section title="زمان تحویل">
              <Field id="pickupDate" label="تاریخ تحویل" error={errors.pickupDate}>
                {text('pickupDate', 'date')}
              </Field>
              <Field id="startTime" label="ساعت شروع" error={errors.startTime}>
                {text('startTime', 'time')}
              </Field>
              <Field id="endTime" label="ساعت پایان" error={errors.endTime}>
                {text('endTime', 'time')}
              </Field>
              <Field
                id="cancellationTime"
                label="قانون لغو · مهلت لغو"
                error={errors.cancellationTime}
              >
                {text('cancellationTime', 'time')}
              </Field>
            </Section>
            <Section title="مواد اولیه و حساسیت‌زاها">
              <Field id="allergens" label="حساسیت‌زاهای محصول">
                {select('allergens', [
                  { value: 'unknown', label: 'نامشخص' },
                  { value: 'gluten', label: 'گلوتن' },
                  { value: 'dairy', label: 'لبنیات' },
                  { value: 'nuts', label: 'مغزها' },
                  { value: 'none', label: 'فاقد حساسیت‌زای شناخته‌شده' },
                ])}
              </Field>
            </Section>
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <Section title="تصاویر محصول">
              <p className="text-caption text-text-secondary">
                برای تغییر ترتیب، از منوی تصویر استفاده کنید.{' '}
                {toPersianDigits(values.images.length)} تصویر
              </p>
              {values.images.length ? (
                <div className="grid grid-cols-2 gap-3">
                  {values.images.map((src, index) => (
                    <div
                      key={`${src.slice(-30)}-${index}`}
                      className={`relative min-w-0 rounded-[12px] border bg-background p-2 ${index === 0 ? 'border-primary' : 'border-border-default'}`}
                    >
                      <div className="relative">
                        <img
                          src={src}
                          alt={`تصویر ${toPersianDigits(index + 1)} محصول`}
                          className="h-[138px] w-full rounded-md object-cover"
                        />
                        <span className="absolute start-1 top-1 rounded-sm bg-surface px-2 text-caption">
                          {toPersianDigits(index + 1)}
                        </span>
                        {index === 0 && (
                          <span className="absolute bottom-1 start-1 rounded-sm bg-primary-subtle px-2 text-caption">
                            تصویر اصلی
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        aria-label={`گزینه‌های تصویر ${toPersianDigits(index + 1)}`}
                        aria-expanded={menu === index}
                        onClick={() => setMenu(menu === index ? null : index)}
                        className="mt-2 grid size-11 place-items-center rounded-sm bg-surface"
                      >
                        <MoreHorizontal />
                      </button>
                      {menu === index && (
                        <div className="absolute bottom-12 z-10 flex flex-col rounded-md border border-border-default bg-surface p-2 shadow-2 text-label-md">
                          {index > 0 && (
                            <>
                              <button
                                type="button"
                                className="p-2 text-start"
                                onClick={() => move(index, 0)}
                              >
                                تصویر اصلی
                              </button>
                              <button
                                type="button"
                                className="p-2 text-start"
                                onClick={() => move(index, index - 1)}
                              >
                                انتقال به جلو
                              </button>
                            </>
                          )}
                          {index < values.images.length - 1 && (
                            <button
                              type="button"
                              className="p-2 text-start"
                              onClick={() => move(index, index + 1)}
                            >
                              انتقال به عقب
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-2 text-start text-error"
                            onClick={() => {
                              update(
                                'images',
                                values.images.filter((_, i) => i !== index),
                              )
                              setMenu(null)
                            }}
                          >
                            حذف تصویر
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-primary-subtle p-4 text-body-md">
                  هنوز تصویری اضافه نشده است.
                </p>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => void addImages(e)}
              />
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => fileRef.current?.click()}
              >
                <Plus size={20} /> افزودن تصویر
              </Button>
            </Section>
            <Button variant="secondary" size="md" fullWidth onClick={() => setPreview(true)}>
              پیش‌نمایش
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row-reverse lg:justify-end lg:gap-3">
          <Button type="submit" size="md" disabled={saving} className="lg:w-55">
            انتشار محصول
          </Button>
          <Button
            variant="secondary"
            size="md"
            disabled={saving}
            onClick={() => void save(true)}
            className="lg:w-55"
          >
            ذخیره پیش‌نویس
          </Button>
          <Button
            size="md"
            disabled={saving}
            onClick={() => navigate('/vendor/products')}
            className="border border-error bg-error-subtle text-error hover:bg-error-subtle lg:w-55"
          >
            انصراف
          </Button>
        </div>
      </form>
      <Modal open={preview} onClose={() => setPreview(false)} title="پیش‌نمایش محصول">
        {values.images[0] && (
          <img src={values.images[0]} alt="" className="h-40 w-full rounded-md object-cover" />
        )}
        <h3 className="text-title-md">{values.name || 'نام محصول'}</h3>
        <p className="text-body-md text-text-secondary">
          {values.store || 'فروشگاه'} · {values.category || 'دسته‌بندی'}
        </p>
        <p className="text-body-md">{values.description}</p>
        <p className="text-caption text-text-secondary line-through">
          {formatPrice(priceNumber(values.originalPrice) || 0)}
        </p>
        <p className="text-price-lg">{formatPrice(priceNumber(values.price) || 0)}</p>
      </Modal>
    </div>
  )
}

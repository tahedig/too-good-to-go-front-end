import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock3, ImagePlus, MapPin, Store } from 'lucide-react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { DEFAULT_STORE_CATEGORIES, storeService } from '@/services/storeService'
import type { StoreCategoryOption } from '@/services/storeService'

type AddStoreForm = {
  name: string
  owner: string
  categoryId: string
  address: string
}

const initialForm: AddStoreForm = {
  name: '',
  owner: '',
  categoryId: '',
  address: '',
}

function categoryOptions(categories: StoreCategoryOption[]) {
  return categories.map((category) => ({ value: String(category.id), label: category.name }))
}

export default function AddStorePage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [categories, setCategories] = useState(DEFAULT_STORE_CATEGORIES)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    storeService
      .listCategories(controller.signal)
      .then(setCategories)
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return
        setError(reason instanceof Error ? reason.message : 'دریافت دسته‌بندی‌ها ممکن نیست.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingCategories(false)
      })
    return () => controller.abort()
  }, [])

  function update(patch: Partial<AddStoreForm>) {
    setForm((current) => ({ ...current, ...patch }))
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const name = form.name.trim()
    const owner = form.owner.trim()
    const address = form.address.trim()
    const categoryId = Number(form.categoryId)
    if (!name || !address || !Number.isSafeInteger(categoryId) || categoryId <= 0) {
      setError('نام فروشگاه، دسته‌بندی و آدرس را کامل کنید.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await storeService.createRequest({
        name,
        owner,
        categoryId,
        address,
      })
      navigate('/vendor/stores', {
        state: { message: 'درخواست افزودن فروشگاه با موفقیت ارسال شد.' },
      })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'ارسال درخواست فروشگاه ممکن نیست.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 p-4 pb-8 lg:gap-6 lg:px-12 lg:py-8 xl:px-20"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-title-xl text-text-primary lg:text-display-xl">افزودن فروشگاه</h1>
        <p className="text-body-md text-text-secondary">
          اطلاعات اولیه فروشگاه را وارد کنید. پس از بررسی و تأیید، می‌توانید تصاویر، ساعت کاری و
          موقعیت دقیق را تکمیل کنید.
        </p>
      </header>

      {error && <InlineAlert tone="error">{error}</InlineAlert>}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)] xl:gap-5">
        <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
          <section className="rounded-lg border border-border-default bg-surface p-4 lg:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-title-md text-text-primary">تصویر فروشگاه</h2>
              <span className="text-caption text-text-secondary">۰ تصویر</span>
            </div>
            <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-border-input bg-background px-4 text-center">
              <div className="flex flex-col items-center gap-2 text-text-secondary">
                <ImagePlus className="size-7" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-body-md">پس از تأیید درخواست قابل افزودن است</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-border-default bg-surface p-4 lg:p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="text-title-md text-text-primary">موقعیت مکانی</h2>
            </div>
            <div
              className="relative h-40 overflow-hidden rounded-md border border-border-default bg-[#e6e9dd]"
              style={{
                backgroundImage:
                  'linear-gradient(28deg, transparent 46%, #fff 47%, #fff 50%, transparent 51%), linear-gradient(112deg, transparent 38%, #fff 39%, #fff 42%, transparent 43%)',
              }}
              aria-hidden="true"
            >
              <MapPin
                className="absolute start-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-full fill-error-subtle text-error"
                strokeWidth={2}
              />
            </div>
            <p className="mt-3 text-caption text-text-secondary">
              موقعیت دقیق فروشگاه بعد از تأیید درخواست ثبت می‌شود.
            </p>
          </section>
        </aside>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface p-4 lg:p-5">
            <div className="flex items-center gap-2">
              <Store className="size-5 text-primary" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="text-title-md text-text-primary">اطلاعات فروشگاه</h2>
            </div>
            <Input
              label="نام فروشگاه"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              autoComplete="organization"
              required
            />
            <Input
              label="مالک / شخص رابط"
              value={form.owner}
              onChange={(event) => update({ owner: event.target.value })}
              autoComplete="name"
            />
            <Select
              label="دسته‌بندی فعالیت"
              placeholder={
                loadingCategories ? 'در حال دریافت دسته‌بندی‌ها...' : 'دسته‌بندی را انتخاب کنید'
              }
              value={form.categoryId}
              onChange={(event) => update({ categoryId: event.target.value })}
              options={categoryOptions(categories)}
              disabled={loadingCategories}
              required
            />
            <Input
              label="آدرس فروشگاه"
              value={form.address}
              onChange={(event) => update({ address: event.target.value })}
              autoComplete="street-address"
              required
            />
          </section>

          <section className="rounded-lg border border-border-default bg-surface p-4 lg:p-5">
            <div className="flex items-start gap-3">
              <Clock3
                className="mt-0.5 size-5 shrink-0 text-primary"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div>
                <h2 className="text-title-md text-text-primary">ساعت کاری</h2>
                <p className="mt-1 text-body-md text-text-secondary">
                  تنظیم روزها و ساعت‌های کاری پس از تأیید فروشگاه فعال می‌شود.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <p className="text-caption text-text-secondary">
        درخواست شما برای بررسی ارسال می‌شود و انتشار محصول پس از تأیید فروشگاه امکان‌پذیر است.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="submit" fullWidth isLoading={saving}>
          ثبت درخواست فروشگاه
        </Button>
        <ButtonLink to="/vendor/stores" variant="destructive" fullWidth>
          لغو
        </ButtonLink>
      </div>
    </form>
  )
}

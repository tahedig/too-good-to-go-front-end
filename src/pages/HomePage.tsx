import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FoodListingCard } from '@/components/ui/FoodListingCard';
import { InlineAlert } from '@/components/ui/InlineAlert';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Radio } from '@/components/ui/Radio';
import { SearchField } from '@/components/ui/SearchField';
import { Select } from '@/components/ui/Select';
import { TextArea } from '@/components/ui/TextArea';
import { toEnglishDigits } from '@/lib/digits';

const DEMO_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#e8b477"/><stop offset="1" stop-color="#b9824a"/></linearGradient></defs>' +
      '<rect width="400" height="300" fill="url(#g)"/></svg>',
  );

const offer = {
  merchantName: 'نان صبحگاهی',
  category: 'نانوایی',
  distanceKm: 0.6,
  description: 'ترکیبی از نان‌ها و شیرینی‌های باقی‌مانده‌ی پخت امروز. محتویات دقیق ممکن است متفاوت باشد.',
  price: 4,
  referenceValue: 11.5,
  pickup: 'امروز، ۱۸:۰۰–۱۹:۰۰',
  imageSrc: DEMO_IMAGE,
} as const;

const sortOptions = [
  { value: 'distance', label: 'فاصله' },
  { value: 'price', label: 'قیمت' },
  { value: 'time', label: 'زمان تحویل' },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-lg border border-border-default bg-surface p-5">
      <h2 className="text-title-md">{title}</h2>
      {children}
    </section>
  );
}

export default function HomePage() {
  // رزرو (نمونه‌ی ConfirmDialog)
  const [reserveOpen, setReserveOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [reserveError, setReserveError] = useState<string>();
  const [failedOnce, setFailedOnce] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [saved, setSaved] = useState(false);

  // فیلترها (نمونه‌ی Modal به‌صورت sheet)
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState('distance');

  // فرم
  const [phone, setPhone] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [qty, setQty] = useState(1);
  const [query, setQuery] = useState('');

  const phoneInvalid = phoneTouched && phone !== '' && !/^09\d{9}$/.test(toEnglishDigits(phone));

  function closeReserve() {
    setReserveOpen(false);
    setReserveError(undefined);
  }

  // شبیه‌سازی درخواست: بار اول خطا می‌دهد تا حالت error دیده شود، بار دوم موفق می‌شود
  function handleReserve() {
    setIsPending(true);
    setReserveError(undefined);
    window.setTimeout(() => {
      setIsPending(false);
      if (!failedOnce) {
        setFailedOnce(true);
        setReserveError('رزرو انجام نشد. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید.');
        return;
      }
      setReserveOpen(false);
      setReserved(true);
      setFailedOnce(false);
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-title-xl">صفحه اصلی</h1>

      {reserved && <InlineAlert tone="success">رزرو شما ثبت شد. در بازه‌ی تحویل به نانوایی مراجعه کنید.</InlineAlert>}

      <Section title="کارت پیشنهاد و مودال تأیید">
        <p className="text-body-md text-text-secondary">
          روی کارت یا دکمه‌ی «رزرو کنید» بزن. بار اول رزرو با خطا مواجه می‌شود و بار دوم موفق است.
        </p>

        <div className="max-w-sm space-y-3">
          <FoodListingCard
            {...offer}
            saved={saved}
            onSaveChange={setSaved}
            // کل کارت یک دکمه می‌شود که مودال را باز می‌کند
            renderLink={(p) => (
              <button type="button" {...p} className={`${p.className} text-start`} onClick={() => setReserveOpen(true)}>
                {p.children}
              </button>
            )}
          />
          <div className="flex gap-3">
            <Button fullWidth onClick={() => setReserveOpen(true)}>
              رزرو کنید
            </Button>
            <Button fullWidth variant="secondary" onClick={() => setSaved(false)}>
              انصراف
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FoodListingCard {...offer} status="soldOut" soldOutNote="این پیشنهاد فروخته شد." />
          <FoodListingCard state="loading" />
          <FoodListingCard state="error" onRetry={() => undefined} />
        </div>
      </Section>

      <Section title="فیلترها (مودال پایینی)">
        <Button variant="secondary" onClick={() => setFiltersOpen(true)}>
          باز کردن فیلترها
        </Button>
      </Section>

      <Section title="فیلدهای فرم">
        <div className="grid gap-4 sm:grid-cols-2">
          <PhoneInput
            label="شماره موبایل"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setPhoneTouched(true)}
            error={phoneInvalid ? 'شمارهٔ موبایل را به‌صورت ۰۹۱۲۳۴۵۶۷۸۹ وارد کنید.' : undefined}
            helperText="برای ارسال کد تأیید"
          />
          <Input label="ایمیل" type="email" placeholder="ایمیل خود را وارد کنید" />
          <Input label="رمز عبور" type="password" helperText="حداقل ۱۲ نویسه" />
          <Input label="ایمیل (خطا)" type="email" defaultValue="leyla@" error="ایمیلی مانند name@example.com وارد کنید." />
          <Input label="برچسب (غیرفعال)" placeholder="در دسترس نیست" disabled />
          <Select
            label="تاریخ تحویل"
            placeholder="یک تاریخ انتخاب کنید"
            helperText="ساعت‌ها در منطقه‌ی زمانی محلی فروشنده است."
            options={[
              { value: 'today', label: 'امروز' },
              { value: 'tomorrow', label: 'فردا' },
            ]}
          />
        </div>

        <TextArea label="یادداشت تحویل (اختیاری)" placeholder="یادداشت کوتاهی اضافه کنید…" helperText="از یادداشت برای درخواست حساسیت غذایی استفاده نکنید." />

        <SearchField placeholder="جستجوی نانوایی، غذا، خواربار…" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="flex items-center justify-between gap-4">
          <span className="text-label-md">تعداد کیسه</span>
          <QuantityStepper label="تعداد کیسه" min={1} max={5} value={qty} onChange={setQty} />
        </div>
      </Section>

      <Section title="هشدارها">
        <div className="space-y-3">
          <InlineAlert tone="info">محتویات دقیق ممکن است متفاوت باشد.</InlineAlert>
          <InlineAlert tone="success">ترجیحات به‌روز شد.</InlineAlert>
          <InlineAlert tone="warning">حساسیت‌زاها نامشخص‌اند. پیش از رزرو با فروشنده تماس بگیرید.</InlineAlert>
          <InlineAlert tone="error">پرداخت ناموفق بود. رزروی انجام نشد؛ دوباره تلاش کنید.</InlineAlert>
        </div>
      </Section>

      <ConfirmDialog
        open={reserveOpen}
        onClose={closeReserve}
        onConfirm={handleReserve}
        title="این پیشنهاد رزرو شود؟"
        description="بسته‌ی نان صبحگاهی برای شما نگه داشته می‌شود. تحویل امروز بین ۱۸:۰۰ تا ۱۹:۰۰ است."
        confirmLabel="رزرو"
        cancelLabel="انصراف"
        isLoading={isPending}
        error={reserveError}
      />

      <Modal
        variant="sheet"
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="فیلترها"
        headerAction={
          <Button variant="tertiary" size="sm" onClick={() => setSort('distance')}>
            پاک کردن همه
          </Button>
        }
        footer={
          <Button fullWidth onClick={() => setFiltersOpen(false)}>
            نمایش نتایج
          </Button>
        }
      >
        <fieldset>
          <legend className="mb-1 text-label-md">مرتب‌سازی بر اساس</legend>
          {sortOptions.map((o) => (
            <Radio key={o.value} name="sort" label={o.label} checked={sort === o.value} onChange={() => setSort(o.value)} />
          ))}
        </fieldset>
      </Modal>
    </div>
  );
}
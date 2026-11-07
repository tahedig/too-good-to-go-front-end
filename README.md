# Tahe Dig Frontend

React + TypeScript + Vite + Tailwind CSS v4.

## Getting started

    npm install
    copy .env.example .env
    npm run dev

## Scripts

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run format` — Prettier

## Folder structure

- `src/app` — router, App root
- `src/config` — env config
- `src/layouts` — Public / Vendor / Admin layouts
- `src/pages` — route pages
- `src/features` — feature modules (auth, offers, orders, ...)
- `src/components/ui` — design-system components
- `src/lib` — API client, helpers
- `src/hooks`, `src/types`

## Authentication API placeholders

The login and account-recovery screens are implemented under `src/features/auth`.
Set `VITE_API_BASE_URL` in `.env`, then adapt the endpoint paths and response types
in `src/features/auth/api/authApi.ts` when the backend is ready:

- `POST /auth/login`
- `POST /auth/recovery/otp`
- `POST /auth/recovery/otp/verify`

## Design system

Tokens are defined in `src/index.css` (`@theme`) following the approved Figma
design system: colors, Vazirmatn typography, 4px spacing grid, radius, shadows.
RTL is enabled globally (`<html lang="fa" dir="rtl">`).

## Card components

- `src/components/ui/FoodListingCard.tsx` — کارت پیشنهاد سمت مشتری (عرض ۲۸۰،
  مدیا ۱۸۰، دکمه‌ی اقدام ۳۶ سرتاسری). حالت‌ها: `state: ready | loading | error`،
  وضعیت: `status: available | soldOut`.
- `src/components/ui/ProductRecordCard.tsx` — کارت رکورد سمت فروشنده/ادمین
  (Figma: `FA VendorAdminProductCard`). حالت‌ها با `status` انتخاب می‌شوند:
  `active` | `pending` | `completed`.
- `src/components/ui/StatusBadge.tsx` — نشان وضعیت مشترک بین هر دو کارت.

## Navigation

`src/components/ui/SidebarNav.tsx` — ناوبری نقش‌ها با یک آرایه‌ی `items` برای هر
دو حالت دسکتاپ و موبایل:

- `variant="sidebar"` — سایدبار عمودی سمت راست (عرض ۲۶۰، هر مقصد ۴۸)
- `variant="bottom"` — نوار پایین موبایل (ارتفاع ۷۵، هر مقصد ۵۵)
- `variant="responsive"` (پیش‌فرض) — نوار پایین در موبایل، سایدبار از `lg` به بالا

هر مقصد `{ id, label, icon, badge?, href?, onClick?, disabled?, children? }`
است و زیرمنو (`children`) فقط وقتی مقصد فعال است باز می‌شود — مثل زیرمنوی هفت‌تایی
«مالی» در پنل ادمین. `activeId` / `activeSubId` مقصد فعال را مشخص می‌کنند و
`onSelect(id, subId)` در کلیک صدا زده می‌شود. برای اتصال به مسیریاب `renderLink`
و `renderSubLink` را بدهید.

`src/components/ui/NavDrawer.tsx` — کشوی ناوبری ادمین در موبایل: به‌جای نوار
پایین، با دکمه‌ی همبرگریِ هدر باز می‌شود، از سمت راست می‌آید و روی یک backdrop
تیره می‌نشیند. همان `items` و همان منطقِ فعال‌بودن را می‌گیرد.

مقصدهای آماده‌ی هر نقش در `src/config/navigation.ts` هستند: `vendorNavItems`
(۶ مقصد)، `customerNavItems` (۴ مقصد: اکتشاف / ذخیره‌ها / سفارشات / پروفایل) و
`adminNavItems` (۹ مقصد که «مالی» زیرمنو دارد).

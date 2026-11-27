const numberFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });
const distanceFormat = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

/** ۱۲۰۰۰ → ۱۲٬۰۰۰ — ارقام و جداکننده‌ی فارسی */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** ۴ → «۴ تومان» */
export function formatPrice(value: number): string {
  return `${numberFormat.format(value)} تومان`;
}

/** ۰٫۶ → «۰٫۶ کیلومتر» */
export function formatDistanceKm(km: number): string {
  return `${distanceFormat.format(km)} کیلومتر`;
}
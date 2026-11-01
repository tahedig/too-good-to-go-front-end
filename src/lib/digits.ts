const FA = '۰۱۲۳۴۵۶۷۸۹';
const AR = '٠١٢٣٤٥٦٧٨٩';

/** هر عدد یا رشته‌ای را با ارقام فارسی نمایش می‌دهد: 123 → ۱۲۳ */
export function toPersianDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => FA[Number(d)]);
}

/** ارقام فارسی و عربی را به انگلیسی تبدیل می‌کند: ۱۲۳ → 123 (برای اعتبارسنجی و ارسال به سرور) */
export function toEnglishDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR.indexOf(d)));
}

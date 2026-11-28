import { toEnglishDigits } from '@/lib/digits'
import type { PayoutInput } from './financeTypes'

type PayoutFields = { amount: string; accountHolder: string; iban: string }

export function normalizeSheba(value: string): string | null {
  const raw = toEnglishDigits(value).replace(/[\s-]/g, '').toUpperCase()
  const iban = raw.startsWith('IR') ? raw : `IR${raw}`
  if (!/^IR[0-9]{24}$/.test(iban)) return null

  // ISO 13616 checksum: move country/check digits to the end (IR → 1827).
  let remainder = 0
  for (const digit of `${iban.slice(4)}1827${iban.slice(2, 4)}`) {
    remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1 ? iban : null
}

export function validatePayout(fields: PayoutFields, available: number) {
  const text = toEnglishDigits(fields.amount).trim()
  const isInteger = /^[0-9]+$/.test(text) || /^[0-9]{1,3}(?:[٬, ][0-9]{3})+$/.test(text)
  const amount = isInteger ? Number(text.replace(/[٬, ]/g, '')) : NaN
  const accountHolder = fields.accountHolder.trim()
  const iban = normalizeSheba(fields.iban)
  const errors: Partial<Record<keyof PayoutFields, string>> = {}
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    errors.amount = 'مبلغ را به تومان و به‌صورت عدد صحیح مثبت وارد کنید.'
  } else if (amount > available) {
    errors.amount = 'مبلغ درخواست نمی‌تواند بیشتر از موجودی قابل درخواست باشد.'
  }
  if (!accountHolder) errors.accountHolder = 'نام دارنده حساب را وارد کنید.'
  if (!iban) errors.iban = 'شماره شبای معتبر ایران با ۲۴ رقم بعد از IR وارد کنید.'

  const input: PayoutInput | null =
    Object.keys(errors).length || !iban ? null : { amount, accountHolder, iban }
  return { errors, input }
}

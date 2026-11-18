import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight, Check, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { InlineAlert } from '@/components/ui/InlineAlert'
import { Input } from '@/components/ui/Input'
import { ApiError } from '@/lib/api/client'
import { profileApi } from '@/features/profile/api/profileApi'
import { CustomerProfileShell } from '@/features/profile/components/CustomerProfileShell'
import { ProfileLoading } from '@/features/profile/components/ProfileLoading'
import type { CustomerProfile } from '@/features/profile/types'

type NameErrors = Partial<Record<'firstName' | 'lastName', string>>
const namePattern = /^[\p{L}\p{M}][\p{L}\p{M}\s\-'‌]{1,49}$/u

function validateName(value: string, label: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return `وارد کردن ${label} الزامی است.`
  if (trimmed.length < 2) return `${label} باید حداقل ۲ حرف باشد.`
  if (!namePattern.test(trimmed)) return `${label} فقط می‌تواند شامل حروف، فاصله و نیم‌فاصله باشد.`
  return undefined
}

export default function PersonalInfoPage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [errors, setErrors] = useState<NameErrors>({})
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    profileApi
      .getCurrent()
      .then((data) => {
        if (!active) return
        setProfile(data)
        setFirstName(data.firstName)
        setLastName(data.lastName)
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setLoadError(
          requestError instanceof ApiError ? requestError.message : 'اطلاعات شخصی بارگذاری نشد.',
        )
      })
    return () => {
      active = false
    }
  }, [retryKey])

  function validate(): boolean {
    const nextErrors = {
      firstName: validateName(firstName, 'نام'),
      lastName: validateName(lastName, 'نام خانوادگی'),
    }
    setErrors(nextErrors)
    return !nextErrors.firstName && !nextErrors.lastName
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaveError('')
    setSuccess('')
    if (!validate()) return

    setSaving(true)
    try {
      const updated = await profileApi.updateCurrent({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })
      setProfile(updated)
      setFirstName(updated.firstName)
      setLastName(updated.lastName)
      setSuccess('اطلاعات شخصی با موفقیت ذخیره شد.')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setErrors({
          firstName:
            requestError.fieldErrors.firstName?.[0] ?? requestError.fieldErrors.first_name?.[0],
          lastName:
            requestError.fieldErrors.lastName?.[0] ?? requestError.fieldErrors.last_name?.[0],
        })
        setSaveError(requestError.message)
      } else {
        setSaveError('ذخیره اطلاعات انجام نشد. لطفاً دوباره تلاش کنید.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <CustomerProfileShell>
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-32 pt-5 sm:px-8 sm:pb-12 sm:pt-10 lg:px-20">
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <Link
            to="/profile"
            aria-label="بازگشت به پروفایل"
            className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary hover:bg-surface-secondary"
          >
            <ArrowRight strokeWidth={1.75} />
          </Link>
          <h1 className="text-title-xl text-primary sm:text-display-xl">اطلاعات شخصی</h1>
        </div>

        {!profile && !loadError ? (
          <div className="mx-auto max-w-[568px]">
            <ProfileLoading form />
          </div>
        ) : loadError ? (
          <div className="mx-auto max-w-[568px] space-y-4">
            <InlineAlert tone="error">{loadError}</InlineAlert>
            <Button
              fullWidth
              onClick={() => {
                setLoadError('')
                setRetryKey((value) => value + 1)
              }}
            >
              تلاش دوباره
            </Button>
          </div>
        ) : profile ? (
          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,568px)] lg:justify-center">
            <aside className="hidden self-start rounded-lg bg-surface p-4 lg:block">
              <p className="flex items-center gap-2 px-3 py-2 text-title-sm text-primary">
                <UserRound className="size-6" strokeWidth={1.75} />
                {profile.displayName}
              </p>
              <nav className="mt-2 space-y-2" aria-label="بخش‌های پروفایل">
                <span className="block rounded-md bg-primary-subtle px-4 py-3 text-label-md text-primary">
                  اطلاعات شخصی
                </span>
                <span className="block px-4 py-3 text-body-md text-text-secondary">
                  مکان ترجیحی
                </span>
                <span className="block px-4 py-3 text-body-md text-text-secondary">
                  راهنمایی و پشتیبانی
                </span>
              </nav>
            </aside>

            <form onSubmit={handleSubmit} noValidate className="rounded-lg bg-surface p-5 sm:p-8">
              <p className="mb-6 flex items-center gap-2 text-title-md text-primary">
                <UserRound className="size-6" strokeWidth={1.75} />
                {profile.displayName}
              </p>

              <div className="space-y-5">
                <Input
                  label="نام"
                  name="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  error={errors.firstName}
                  success={
                    !errors.firstName &&
                    firstName !== profile.firstName &&
                    !validateName(firstName, 'نام')
                      ? 'نام معتبر است.'
                      : undefined
                  }
                  onChange={(event) => {
                    setFirstName(event.target.value)
                    setErrors((current) => ({ ...current, firstName: undefined }))
                    setSuccess('')
                  }}
                  required
                />
                <Input
                  label="نام خانوادگی"
                  name="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  error={errors.lastName}
                  success={
                    !errors.lastName &&
                    lastName !== profile.lastName &&
                    !validateName(lastName, 'نام خانوادگی')
                      ? 'نام خانوادگی معتبر است.'
                      : undefined
                  }
                  onChange={(event) => {
                    setLastName(event.target.value)
                    setErrors((current) => ({ ...current, lastName: undefined }))
                    setSuccess('')
                  }}
                  required
                />
                <Input
                  label="شماره تلفن"
                  value={profile.phoneNumber}
                  readOnly
                  ltrValue
                  helperText={
                    profile.phoneVerified
                      ? 'شماره تلفن تاییدشده است و از اینجا قابل تغییر نیست.'
                      : 'این شماره تلفن هنوز تایید نشده است.'
                  }
                  endAdornment={
                    profile.phoneVerified ? (
                      <Check aria-label="شماره تلفن تاییدشده" className="size-5 text-success" />
                    ) : undefined
                  }
                />
              </div>

              {saveError && (
                <InlineAlert tone="error" className="mt-5">
                  {saveError}
                </InlineAlert>
              )}
              {success && (
                <InlineAlert tone="success" className="mt-5">
                  {success}
                </InlineAlert>
              )}

              <Button
                type="submit"
                fullWidth
                isLoading={saving}
                disabled={
                  saving ||
                  (firstName.trim() === profile.firstName && lastName.trim() === profile.lastName)
                }
                className="mt-6"
              >
                {saving ? 'در حال ذخیره…' : 'ذخیره'}
              </Button>
            </form>
          </div>
        ) : null}
      </main>
    </CustomerProfileShell>
  )
}

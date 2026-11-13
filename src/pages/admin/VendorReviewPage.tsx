import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { getErrorMessage } from '@/features/auth/utils'
import { ApiError } from '@/lib/api/client'
import { toPersianDigits } from '@/lib/digits'
import { vendorApprovalApi } from '@/features/vendor-approval/api'
import { formatVendorDate, reasonLabel } from '@/features/vendor-approval/constants'
import { DecisionDialog } from '@/features/vendor-approval/components/DecisionDialog'
import {
  BackToListLink,
  StateCard,
  VendorStatusBadge,
  VendorSummaryCard,
} from '@/features/vendor-approval/components/VendorUi'
import { linkButtonClass } from '@/features/vendor-approval/components/linkButtonClass'
import type { Vendor, VendorDecisionPayload, VendorStatus } from '@/features/vendor-approval/types'
import type { VendorListMode } from './VendorListPage'

type DialogKind = 'approve' | 'reject' | 'suspend' | 'reactivate' | null
type Outcome = 'approved' | 'rejected' | 'suspended' | 'reactivated'

const OUTCOME_COPY: Record<Outcome, { title: string; text: string }> = {
  approved: { title: 'فروشگاه تأیید شد', text: 'فروشنده می‌تواند محصولات را مدیریت کند.' },
  rejected: { title: 'درخواست رد شد', text: 'دلیل رد درخواست برای فروشنده ارسال شد.' },
  suspended: {
    title: 'فروشگاه تعلیق شد',
    text: 'محصولات این فروشگاه دیگر به مشتریان نمایش داده نمی‌شود.',
  },
  reactivated: {
    title: 'تعلیق فروشگاه برداشته شد',
    text: 'فروشگاه دوباره می‌تواند محصولات را منتشر کند.',
  },
}

const CHECK_LABEL: Record<VendorStatus, string> = {
  pending: 'در انتظار بررسی',
  approved: 'تأییدشده',
  suspended: 'تأییدشده',
  rejected: 'ردشده',
}

const LIST: Record<VendorListMode, { path: string; label: string }> = {
  requests: { path: '/admin/store-requests', label: 'درخواست فروشگاه‌ها' },
  stores: { path: '/admin/stores', label: 'فروشگاه‌ها' },
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 lg:grid lg:grid-cols-2">
      <dt className="shrink-0 text-caption text-text-secondary">{label}</dt>
      <dd className="text-end text-label-md lg:text-start">{children}</dd>
    </div>
  )
}

export default function VendorReviewPage({ mode }: { mode: VendorListMode }) {
  const { vendorId = '' } = useParams()
  const location = useLocation()
  const listLink = LIST[mode]
  const preview = (location.state as { vendor?: Vendor } | null)?.vendor

  const [reloadCount, setReloadCount] = useState(0)
  const [result, setResult] = useState<{
    key: string
    vendor: Vendor | null
    error: { message: string; notFound: boolean } | null
  } | null>(null)
  const [dialog, setDialog] = useState<DialogKind>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  // State is only set from the request callbacks; loading is derived from the request key.
  const requestKey = `${vendorId}|${reloadCount}`
  useEffect(() => {
    let active = true
    vendorApprovalApi
      .get(vendorId)
      .then((loaded) => {
        if (active) setResult({ key: requestKey, vendor: loaded, error: null })
      })
      .catch((caught) => {
        if (!active) return
        const notFound = caught instanceof ApiError && caught.status === 404
        setResult({
          key: requestKey,
          vendor: null,
          error: {
            notFound,
            message: notFound
              ? 'این فروشگاه وجود ندارد یا حذف شده است.'
              : getErrorMessage(caught, 'اتصال اینترنت را بررسی و دوباره تلاش کنید.'),
          },
        })
      })
    return () => {
      active = false
    }
  }, [vendorId, requestKey])

  const isCurrent = result?.key === requestKey
  const vendor = isCurrent ? result.vendor : null
  const loadError = isCurrent ? result.error : null
  const load = () => setReloadCount((count) => count + 1)
  const setVendor = (updated: Vendor) =>
    setResult({ key: requestKey, vendor: updated, error: null })

  function openDialog(kind: DialogKind) {
    setActionError('')
    setDialogKey((key) => key + 1)
    setDialog(kind)
  }

  async function runAction(action: () => Promise<Vendor>, result: Outcome) {
    setActing(true)
    setActionError('')
    try {
      setVendor(await action())
      setDialog(null)
      setOutcome(result)
      window.scrollTo({ top: 0 })
    } catch (caught) {
      setActionError(getErrorMessage(caught, 'انجام نشد. لطفاً دوباره تلاش کنید.'))
    } finally {
      setActing(false)
    }
  }

  async function submitDecision(payload: VendorDecisionPayload) {
    if (!vendor) return
    const isReject = dialog === 'reject'
    // Errors propagate to the dialog so it can show field-level messages.
    const updated = isReject
      ? await vendorApprovalApi.reject(vendor.id, payload)
      : await vendorApprovalApi.suspend(vendor.id, payload)
    setVendor(updated)
    setDialog(null)
    setOutcome(isReject ? 'rejected' : 'suspended')
    window.scrollTo({ top: 0 })
  }

  const container = 'mx-auto flex w-full max-w-160 flex-col gap-4'

  if (loadError) {
    return (
      <div className={container}>
        <StateCard
          tone="error"
          title={loadError.notFound ? 'فروشگاه پیدا نشد' : 'درخواست بارگذاری نشد'}
          action={
            !loadError.notFound && (
              <Button fullWidth size="md" onClick={load}>
                تلاش دوباره
              </Button>
            )
          }
        >
          {loadError.message}
        </StateCard>
        {preview && <VendorSummaryCard vendor={preview} />}
        <BackToListLink
          to={listLink.path}
          label={mode === 'requests' ? 'بازگشت به درخواست‌ها' : 'بازگشت به فروشگاه‌ها'}
        />
      </div>
    )
  }

  if (!vendor) {
    return (
      <div role="status" aria-label="در حال بارگذاری" className={`${container} lg:max-w-280`}>
        <div className="h-96 animate-pulse rounded-lg bg-surface-secondary motion-reduce:animate-none" />
        <div className="h-40 animate-pulse rounded-lg bg-surface-secondary motion-reduce:animate-none" />
      </div>
    )
  }

  if (outcome) {
    return (
      <div className={container}>
        <StateCard
          tone="success"
          title={OUTCOME_COPY[outcome].title}
          action={
            <Link to={listLink.path} className={linkButtonClass('primary', 'w-full')}>
              {listLink.label}
            </Link>
          }
        >
          {OUTCOME_COPY[outcome].text}
        </StateCard>
        <VendorSummaryCard vendor={vendor} showStatus />
      </div>
    )
  }

  const decision = vendor.decision
  const decisionLabel = decision?.type === 'rejection' ? 'دلیل رد' : 'دلیل تعلیق'

  return (
    <div className={`${container} lg:max-w-280`}>
      <section className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface p-4 lg:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-label-lg">
            {mode === 'requests' ? 'درخواست افزودن فروشگاه' : 'اطلاعات فروشگاه'}
          </h2>
          <VendorStatusBadge status={vendor.status} />
        </div>
        <h1 className="text-title-lg lg:text-title-xl">{vendor.storeName}</h1>
        <dl className="flex flex-col gap-4">
          <DetailRow label="مالک">{vendor.ownerName}</DetailRow>
          <DetailRow label="دسته‌بندی">{vendor.category}</DetailRow>
          <DetailRow label="تاریخ">{formatVendorDate(vendor.submittedAt)}</DetailRow>
          <DetailRow label="آدرس">{vendor.address}</DetailRow>
          <DetailRow label="شماره تماس">
            <a href={`tel:${vendor.phone}`} dir="ltr" className="hover:underline">
              {toPersianDigits(vendor.phone.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3'))}
            </a>
          </DetailRow>
          {vendor.email && (
            <DetailRow label="ایمیل">
              <span dir="ltr">{vendor.email}</span>
            </DetailRow>
          )}
        </dl>
        {vendor.imageUrl && (
          <img
            src={vendor.imageUrl}
            alt={`نمای فروشگاه ${vendor.storeName}`}
            className="aspect-[16/9] w-full rounded-lg object-cover lg:aspect-[6/1]"
          />
        )}
        {vendor.description && <p className="text-body-md">{vendor.description}</p>}
      </section>

      <section className="flex flex-col gap-4 rounded-lg border border-border-default bg-surface p-4 lg:p-5">
        <h2 className="text-title-md">بررسی اطلاعات</h2>
        <dl className="flex flex-col gap-4">
          <DetailRow label="اطلاعات مالک">{CHECK_LABEL[vendor.status]}</DetailRow>
          <DetailRow label="نشانی و تماس">{CHECK_LABEL[vendor.status]}</DetailRow>
          {vendor.status !== 'pending' && (
            <DetailRow label="تاریخ آخرین تغییر">
              {formatVendorDate(vendor.statusUpdatedAt)}
            </DetailRow>
          )}
          {decision && (
            <>
              <DetailRow label={decisionLabel}>
                {reasonLabel(decision.type, decision.reasonCode)}
              </DetailRow>
              <div className="flex flex-col gap-2">
                <dt className="text-caption text-text-secondary">پیام به فروشنده</dt>
                <dd className="rounded-md bg-surface-secondary p-3 text-body-md">
                  {decision.message}
                </dd>
              </div>
            </>
          )}
        </dl>

        {vendor.status === 'pending' && (
          <div className="grid grid-cols-2 gap-4">
            <Button variant="destructive" size="md" onClick={() => openDialog('reject')}>
              رد درخواست
            </Button>
            <Button size="md" onClick={() => openDialog('approve')}>
              تأیید
            </Button>
          </div>
        )}
        {vendor.status === 'approved' && (
          <Button variant="destructive" size="md" fullWidth onClick={() => openDialog('suspend')}>
            تعلیق فروشگاه
          </Button>
        )}
        {vendor.status === 'suspended' && (
          <Button size="md" fullWidth onClick={() => openDialog('reactivate')}>
            رفع تعلیق
          </Button>
        )}
        {vendor.status === 'rejected' && (
          <p className="text-body-md text-text-secondary">
            این درخواست رد شده است. فروشنده پس از اصلاح اطلاعات می‌تواند درخواست جدید ثبت کند.
          </p>
        )}
      </section>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={() => runAction(() => vendorApprovalApi.approve(vendor.id), 'approved')}
        title="فروشگاه تأیید شود؟"
        description={
          <>
            {vendor.storeName}
            <br />
            پس از تأیید، فروشنده می‌تواند محصولات را مدیریت کند.
          </>
        }
        cancelLabel="لغو"
        confirmLabel="تأیید"
        isLoading={acting}
        error={actionError}
      />
      <ConfirmDialog
        open={dialog === 'reactivate'}
        onClose={() => setDialog(null)}
        onConfirm={() => runAction(() => vendorApprovalApi.reactivate(vendor.id), 'reactivated')}
        title="تعلیق فروشگاه برداشته شود؟"
        description={
          <>
            {vendor.storeName}
            <br />
            پس از رفع تعلیق، محصولات فروشگاه دوباره به مشتریان نمایش داده می‌شود.
          </>
        }
        cancelLabel="لغو"
        confirmLabel="رفع تعلیق"
        isLoading={acting}
        error={actionError}
      />
      {(dialog === 'reject' || dialog === 'suspend') && (
        <DecisionDialog
          key={dialogKey}
          open
          type={dialog === 'reject' ? 'rejection' : 'suspension'}
          vendor={vendor}
          onClose={() => setDialog(null)}
          onSubmit={submitDecision}
        />
      )}
    </div>
  )
}

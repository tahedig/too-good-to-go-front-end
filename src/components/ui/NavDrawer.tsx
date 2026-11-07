import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { X } from 'lucide-react'
import { SidebarNavList } from './SidebarNav'
import type { SidebarNavItem } from './SidebarNav'
import { cx } from '@/lib/cx'

export interface NavDrawerProps {
  open: boolean
  onClose: () => void
  /** عنوان بالای کشو، مثلاً «ته‌دیگ · مدیریت» */
  title?: string
  items: SidebarNavItem[]
  activeId?: string
  activeSubId?: string
  onSelect?: (id: string, subId?: string) => void
  renderLink?: (props: {
    item: SidebarNavItem
    className: string
    children: React.ReactNode
    'aria-current'?: 'page'
  }) => React.ReactNode
  /** برچسب کشو برای screen reader */
  label?: string
  closeLabel?: string
  className?: string
}

/**
 * کشوی ناوبری ادمین در موبایل (Figma: `Admin drawer · right-side`) — با دکمه‌ی
 * همبرگریِ هدر باز می‌شود، از سمت راست می‌آید و روی یک backdrop تیره می‌نشیند.
 */
export function NavDrawer({
  open,
  onClose,
  title,
  items,
  activeId,
  activeSubId,
  onSelect,
  renderLink,
  label = 'منوی ناوبری',
  closeLabel = 'بستن منو',
  className,
}: NavDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressStartedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleMouseDown(event: MouseEvent<HTMLDialogElement>) {
    pressStartedOnBackdrop.current = event.target === event.currentTarget
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && pressStartedOnBackdrop.current) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={cx(
        // چسبیده به لبه‌ی راست (ابتدای خوانش در RTL)، تمام‌ارتفاع، عرض ۲۶۰
        // در RTL، margin-inline-end خودکار (= سمت چپ) کشو را به لبه‌ی راست می‌چسباند
        'my-0 ms-0 me-auto h-dvh max-h-none w-65 max-w-full border-l border-border-default',
        'bg-surface p-0 text-text-primary',
        'open:flex open:flex-col',
        'translate-x-full open:translate-x-0 starting:open:translate-x-full',
        'transition-[translate,display,overlay] transition-discrete duration-200 ease-out motion-reduce:transition-none',
        'backdrop:bg-primary/15 backdrop:opacity-0 open:backdrop:opacity-100',
        'starting:backdrop:opacity-0',
        'backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-200',
        className,
      )}
    >
      <div className="flex h-[76px] w-full shrink-0 flex-row items-center justify-between gap-3 border-b border-border-default p-4">
        {/* در RTL دکمه‌ی بستن ابتدای ردیف (سمت راست) و عنوان بعد از آن است */}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="grid size-11 shrink-0 place-items-center rounded-md border border-border-default bg-surface text-primary transition-colors hover:bg-surface-secondary active:bg-surface-sage"
        >
          <X className="size-6" strokeWidth={1.75} />
        </button>
        {title && (
          <span className="min-w-0 flex-1 text-start text-[18px] leading-[1.6] font-semibold text-text-primary">
            {title}
          </span>
        )}
      </div>

      <div className="flex min-h-0 w-full flex-1 flex-col gap-1 overflow-y-auto p-4">
        <SidebarNavList
          layout="sidebar"
          items={items}
          activeId={activeId}
          activeSubId={activeSubId}
          onSelect={onSelect}
          renderLink={renderLink}
        />
      </div>
    </dialog>
  )
}

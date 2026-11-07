import { Fragment, useId, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'

/** نحوه‌ی چیدمان مقصدها */
export type SidebarNavLayout = 'sidebar' | 'bottom' | 'responsive'

export type SidebarNavSubItem = {
  id: string
  label: string
  href?: string
  onClick?: () => void
  disabled?: boolean
}

export type SidebarNavItem = {
  id: string
  label: string
  /** کامپوننت آیکون lucide؛ اندازه (۲۴) و ضخامت stroke (۱.۷۵) را خود کامپوننت تنظیم می‌کند */
  icon: LucideIcon
  /** نشان کوچک روی آیتم، مثلاً تعداد سفارش‌های جدید */
  badge?: string | number
  /**
   * زیرمنو (مثل زیرمنوی «مالی» در پنل ادمین). مقصدی که زیرمنو دارد با کلیک فقط
   * باز/بسته می‌شود و `onSelect` را صدا نمی‌زند؛ انتخاب نهایی فقط با کلیک روی
   * یکی از زیرآیتم‌ها انجام می‌شود و `onSelect(id, subId)` را اجرا می‌کند.
   */
  children?: SidebarNavSubItem[]
  href?: string
  onClick?: () => void
  disabled?: boolean
}

export interface SidebarNavLinkProps {
  item: SidebarNavItem
  className: string
  children: ReactNode
  'aria-current'?: 'page'
}

export interface SidebarNavSubLinkProps {
  item: SidebarNavSubItem
  className: string
  children: ReactNode
  'aria-current'?: 'page'
}

export interface SidebarNavListProps {
  /** مقصدها به ترتیب نمایش (در RTL از راست به چپ) */
  items: SidebarNavItem[]
  /** id مقصد فعال */
  activeId?: string
  /** id زیرصفحه‌ی فعال (مثلاً «کمیسیون» زیرِ «مالی») */
  activeSubId?: string
  /** فقط برای مقصدهای بدون زیرمنو و برای زیرآیتم‌ها صدا زده می‌شود */
  onSelect?: (id: string, subId?: string) => void
  /** برای مسیریاب: renderLink={({ item, className, children }) => <Link to={item.href} className={className}>{children}</Link>} */
  renderLink?: (props: SidebarNavLinkProps) => ReactNode
  renderSubLink?: (props: SidebarNavSubLinkProps) => ReactNode
  layout?: SidebarNavLayout
}

/* عرض ۲۶۰ و border-left #E0DED4 در دسکتاپ؛ نوار پایین با padding ۸ و radius ۱۲ در موبایل */
const SIDEBAR_FRAME =
  'sticky top-0 z-40 flex w-65 shrink-0 flex-col items-stretch gap-1 border-l border-[#E0DED4] p-4'

const BOTTOM_FRAME =
  'sticky bottom-0 z-40 flex flex-row items-center gap-1 rounded-t-[12px] border-t ' +
  'border-border-default bg-surface p-2 shadow-3'

/** breakpoint `lg` در src/index.css برابر ۶۴rem (۱۰۲۴px) است */
const LG_QUERY = '(min-width: 64rem)'

/**
 * فقط برای حالت responsive لازم است: در موبایل زیرمنو جایی برای نمایش ندارد،
 * بنابراین مقصدِ والد باید مثل قبل «انتخاب» شود تا دکمه بی‌اثر نماند.
 */
function useIsLg(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(LG_QUERY)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(LG_QUERY).matches,
    () => false,
  )
}

function containerClasses(variant: SidebarNavLayout, fullHeight: boolean): string {
  if (variant === 'bottom') return BOTTOM_FRAME

  const height = fullHeight ? 'h-dvh' : 'h-full'

  if (variant === 'sidebar') return cx(SIDEBAR_FRAME, height)

  return cx(
    BOTTOM_FRAME,
    'lg:static lg:w-65 lg:shrink-0 lg:flex-col lg:items-stretch lg:gap-1 lg:rounded-none',
    'lg:border-t-0 lg:border-l lg:border-[#E0DED4] lg:p-4 lg:shadow-none',
    fullHeight ? 'lg:h-dvh' : 'lg:h-full',
  )
}

function itemClasses(layout: SidebarNavLayout, active: boolean, disabled: boolean): string {
  const base = 'flex select-none items-center justify-center rounded-[12px] transition-colors'

  const geometry = {
    responsive:
      'h-[55px] flex-1 flex-col gap-1 p-1 ' +
      'lg:h-12 lg:w-full lg:flex-none lg:flex-row lg:gap-3 lg:p-3',
    sidebar: 'h-12 w-full flex-row gap-3 p-3',
    bottom: 'h-[55px] flex-1 flex-col gap-1 p-1',
  }[layout]

  const state = active
    ? 'bg-success-subtle'
    : disabled
      ? 'text-text-disabled'
      : 'hover:bg-surface-secondary active:bg-surface-sage'

  return cx(base, geometry, state)
}

function iconClasses(layout: SidebarNavLayout, active: boolean): string {
  const color =
    active || layout === 'sidebar'
      ? 'text-text-primary'
      : layout === 'bottom'
        ? 'text-text-secondary'
        : 'text-text-secondary lg:text-text-primary'

  return cx('size-6 shrink-0', color)
}

function labelClasses(layout: SidebarNavLayout, active: boolean): string {
  // دسکتاپ: ۱۴/۶۰۰ با line-height ۱۶۰٪ و رنگ ثابت — موبایل: ۱۰px که با فعال‌بودن پررنگ می‌شود
  const desktop =
    'lg:order-2 lg:w-auto lg:min-w-0 lg:flex-1 lg:text-start lg:text-label-md ' +
    'lg:leading-[1.6] lg:font-semibold lg:text-text-primary'

  if (layout === 'sidebar') {
    return 'order-2 min-w-0 flex-1 text-start text-label-md leading-[1.6] font-semibold text-text-primary'
  }

  const mobile = cx(
    'w-full text-center text-[10px] leading-[1.55]',
    active ? 'font-semibold text-text-primary' : 'font-normal text-text-secondary',
  )

  return layout === 'bottom' ? mobile : cx(mobile, desktop)
}

function badgeClasses(layout: SidebarNavLayout): string {
  return cx(
    'inline-flex min-w-5 shrink-0 items-center justify-center rounded-full bg-error px-1.5 py-0.5 ' +
      'text-caption font-bold leading-[1.55] text-on-primary',
    layout === 'sidebar' ? 'order-3' : layout === 'responsive' ? 'lg:order-3' : undefined,
  )
}

/** فلش باز/بسته شدن زیرمنو — در انتهای خوانش (سمت چپ در RTL) قرار می‌گیرد */
function chevronClasses(layout: SidebarNavLayout, expanded: boolean): string {
  return cx(
    'size-6 shrink-0 text-text-secondary transition-transform motion-reduce:transition-none',
    expanded && 'rotate-180',
    layout === 'sidebar' ? 'order-4' : 'hidden lg:order-4 lg:block',
  )
}

/* زیرمنو: padding ۴/۱۲/۸/۰ (فاصله از لبه‌ی شروع ۱۲)، آیتم ۳۶ با متن ۱۳/۶۰۰ */
function subItemClasses(active: boolean): string {
  return cx(
    'flex h-9 w-full items-center justify-start gap-3 rounded-[12px] px-3 py-[7px] transition-colors',
    'text-[13px] leading-[1.6] font-semibold text-text-primary',
    active ? 'bg-success-subtle' : 'hover:bg-surface-secondary active:bg-surface-sage',
  )
}

/**
 * فهرست مقصدها — در سایدبار دسکتاپ، نوار پایین موبایل و کشوی ادمین به‌طور مشترک
 * استفاده می‌شود. ترتیب نمایش در RTL همان ترتیب آرایه است (از راست به چپ) و
 * آیکون هر مقصد در ابتدای خوانش (سمت راست) قرار می‌گیرد.
 */
export function SidebarNavList({
  items,
  activeId,
  activeSubId,
  onSelect,
  renderLink,
  renderSubLink,
  layout = 'sidebar',
}: SidebarNavListProps) {
  const uid = useId()
  const isLg = useIsLg()

  // زیرمنو در نوار پایین و در موبایلِ حالت responsive جایی برای نمایش ندارد
  const submenusVisible = layout === 'sidebar' || (layout === 'responsive' && isLg)

  const activeWithChildren = (id?: string) =>
    items.find((item) => item.id === id && item.children?.length)?.id

  // زیرمنوی مقصدِ فعال به‌طور پیش‌فرض باز است
  const [expandedId, setExpandedId] = useState<string | undefined>(() =>
    activeWithChildren(activeId),
  )

  // اگر مقصدِ فعال از بیرون عوض شد (مثلاً از روی URL)، زیرمنوی آن را باز کن
  const [lastActiveId, setLastActiveId] = useState(activeId)
  if (activeId !== lastActiveId) {
    setLastActiveId(activeId)
    setExpandedId(activeWithChildren(activeId))
  }

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon
        const active = item.id === activeId
        const expandable = Boolean(item.children?.length) && submenusVisible
        const expanded = expandable && expandedId === item.id
        const subNavId = `${uid}-${item.id}`

        const content = (
          <>
            <Icon className={iconClasses(layout, active)} strokeWidth={1.75} />
            {item.badge !== undefined && <span className={badgeClasses(layout)}>{item.badge}</span>}
            <span className={labelClasses(layout, active)}>{item.label}</span>
            {expandable && (
              <ChevronDown className={chevronClasses(layout, expanded)} strokeWidth={1.75} />
            )}
          </>
        )

        const shared = {
          className: itemClasses(layout, active, Boolean(item.disabled)),
          'aria-current': active ? ('page' as const) : undefined,
          'aria-expanded': expandable ? expanded : undefined,
          'aria-controls': expandable ? subNavId : undefined,
          onClick: () => {
            if (item.disabled) return
            item.onClick?.()

            // مقصدِ زیرمنودار فقط باز/بسته می‌شود؛ انتخاب نهایی با زیرآیتم‌هاست
            if (expandable) {
              setExpandedId((current) => (current === item.id ? undefined : item.id))
              return
            }

            onSelect?.(item.id)
          },
        }

        return (
          <Fragment key={item.id}>
            {renderLink ? (
              renderLink({ item, className: shared.className, children: content })
            ) : item.href ? (
              <a href={item.href} {...shared}>
                {content}
              </a>
            ) : (
              <button type="button" disabled={item.disabled} {...shared}>
                {content}
              </button>
            )}

            {expanded && (
              <div id={subNavId} className="flex w-full flex-col gap-1 pb-2 ps-3 pt-1">
                {item.children?.map((sub) => {
                  const subActive = sub.id === activeSubId
                  const subLabel = <span className="min-w-0 flex-1 text-start">{sub.label}</span>
                  const subShared = {
                    className: subItemClasses(subActive),
                    'aria-current': subActive ? ('page' as const) : undefined,
                    onClick: () => {
                      if (sub.disabled) return
                      sub.onClick?.()
                      setExpandedId(item.id)
                      onSelect?.(item.id, sub.id)
                    },
                  }

                  if (renderSubLink) {
                    return (
                      <Fragment key={sub.id}>
                        {renderSubLink({
                          item: sub,
                          className: subShared.className,
                          children: subLabel,
                        })}
                      </Fragment>
                    )
                  }

                  if (sub.href) {
                    return (
                      <a key={sub.id} href={sub.href} {...subShared}>
                        {subLabel}
                      </a>
                    )
                  }

                  return (
                    <button key={sub.id} type="button" disabled={sub.disabled} {...subShared}>
                      {subLabel}
                    </button>
                  )
                })}
              </div>
            )}
          </Fragment>
        )
      })}
    </>
  )
}

export interface SidebarNavProps extends SidebarNavListProps {
  /** نام برند در بالای سایدبار (فقط حالت sidebar / دسکتاپ) */
  brand?: string
  /** آیکون کنار نام برند؛ پیش‌فرض user-round */
  brandIcon?: LucideIcon
  /**
   * responsive (پیش‌فرض): نوار پایین در موبایل و سایدبار از `lg` به بالا
   * sidebar: همیشه سایدبار عمودی (عرض ۲۶۰، چسبیده به راست)
   * bottom: همیشه نوار پایین (ارتفاع ۷۵)
   */
  variant?: SidebarNavLayout
  /** ارتفاع تمام‌صفحه برای حالت سایدبار؛ false برای قرار گرفتن در یک باکس با ارتفاع دلخواه */
  fullHeight?: boolean
  /** برچسب ناوبری برای screen reader */
  label?: string
  className?: string
}

/**
 * ناوبری نقش‌ها (فروشنده / مشتری / ادمین) — Figma: `VendorNavigation`،
 * `Desktop role sidebar` و `Desktop Sidebar / Admin`.
 */
export function SidebarNav({
  items,
  activeId,
  activeSubId,
  onSelect,
  renderLink,
  renderSubLink,
  layout,
  brand,
  brandIcon: BrandIcon = UserRound,
  variant = 'responsive',
  fullHeight = true,
  label = 'ناوبری اصلی',
  className,
}: SidebarNavProps) {
  const brandVisibility = {
    responsive: 'hidden lg:flex',
    sidebar: 'flex',
    bottom: 'hidden',
  }[variant]

  return (
    <nav
      aria-label={label}
      className={cx('bg-surface', containerClasses(variant, fullHeight), className)}
    >
      {brand && (
        <div
          className={cx(
            'w-full flex-row items-center gap-3 border-b border-border-default p-3',
            brandVisibility,
          )}
        >
          {/* در RTL آیکون ابتدای ردیف (سمت راست) قرار می‌گیرد */}
          <BrandIcon className="size-6 shrink-0 text-text-primary" strokeWidth={1.75} />
          <span className="min-w-0 flex-1 text-start text-[18px] leading-[1.6] font-semibold text-text-primary">
            {brand}
          </span>
        </div>
      )}

      <SidebarNavList
        items={items}
        activeId={activeId}
        activeSubId={activeSubId}
        onSelect={onSelect}
        renderLink={renderLink}
        renderSubLink={renderSubLink}
        layout={layout ?? variant}
      />
    </nav>
  )
}
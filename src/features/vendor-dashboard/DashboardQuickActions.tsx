import { CirclePlus, CreditCard, Package, Plus, ReceiptText, Store } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

type Action = { href: string; label: string; Icon: LucideIcon; addStore?: boolean }

const actions = {
  products: { href: '/vendor/products', label: 'محصولات', Icon: Package },
  orders: { href: '/vendor/orders', label: 'سفارشات', Icon: ReceiptText },
  finance: { href: '/vendor/finance/overview', label: 'مالی', Icon: CreditCard },
  addStore: { href: '/vendor/stores/new', label: 'افزودن فروشگاه', Icon: Store, addStore: true },
  addProduct: { href: '/vendor/products/new', label: 'ساخت محصول', Icon: CirclePlus },
} satisfies Record<string, Action>

function ActionList({ items, className }: { items: Action[]; className: string }) {
  return (
    <ul className={className}>
      {items.map(({ href, label, Icon, addStore }) => (
        <li key={href} className="min-w-0">
          <Link
            to={href}
            className="flex h-full min-h-26 flex-col items-start gap-2 rounded-lg border border-border-default bg-surface-sage p-3 text-label-md text-text-primary transition-colors hover:bg-primary-subtle active:bg-surface-secondary sm:rounded-md sm:p-4 sm:text-label-lg lg:px-3 lg:max-xl:text-label-md min-[1600px]:px-4"
          >
            <span
              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-subtle sm:size-10 sm:rounded-md"
              aria-hidden="true"
            >
              <span className="relative">
                <Icon className="size-6" strokeWidth={1.75} />
                {addStore && (
                  <Plus
                    className="absolute -end-0.5 -top-0.5 size-2.5 rounded-full bg-primary-subtle"
                    strokeWidth={2}
                  />
                )}
              </span>
            </span>
            {label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function DashboardQuickActions({ storeProfilePath }: { storeProfilePath: string }) {
  const profile = { href: storeProfilePath, label: 'مشخصات فروشگاه', Icon: Store }
  const { products, orders, finance, addStore, addProduct } = actions

  return (
    <nav
      aria-labelledby="vendor-quick-actions"
      className="flex flex-col gap-3 rounded-lg border border-border-default bg-surface p-4 sm:gap-4 sm:p-6"
    >
      <h2 id="vendor-quick-actions" className="text-title-md">
        اقدام‌های سریع
      </h2>
      <ActionList
        items={[profile, products, orders, finance, addStore, addProduct]}
        className="grid grid-cols-3 gap-3 sm:gap-x-6 sm:gap-y-4 lg:hidden"
      />
      <ActionList
        items={[addStore, profile, products, orders, addProduct]}
        className="hidden w-full max-w-[972px] grid-cols-5 gap-3 lg:grid xl:w-[max(80%,50rem)]"
      />
    </nav>
  )
}

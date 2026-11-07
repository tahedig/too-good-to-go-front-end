import {
  Compass,
  Heart,
  LayoutDashboard,
  PackageCheck,
  ShoppingBag,
  Store,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { SidebarNavItem } from '@/components/ui/SidebarNav'

/** مقصدهای پنل فروشنده (Vendor) */
export const vendorNavItems: SidebarNavItem[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'products', label: 'محصولات', icon: ShoppingBag },
  { id: 'orders', label: 'سفارشات', icon: PackageCheck },
  { id: 'stores', label: 'فروشگاه‌ها', icon: Store },
  { id: 'finance', label: 'مالی', icon: Wallet },
  { id: 'account', label: 'حساب فروشنده', icon: UserRound },
]

/** مقصدهای حساب مشتری (Customer) */
export const customerNavItems: SidebarNavItem[] = [
  { id: 'explore', label: 'اکتشاف', icon: Compass },
  { id: 'saved', label: 'ذخیره‌ها', icon: Heart },
  { id: 'orders', label: 'سفارشات', icon: PackageCheck },
  { id: 'profile', label: 'پروفایل', icon: UserRound },
]

/** مقصدهای پنل ادمین (Admin) — «مالی» زیرمنوی اختصاصی دارد */
export const adminNavItems: SidebarNavItem[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'storeRequests', label: 'درخواست فروشگاه‌ها', icon: PackageCheck },
  { id: 'stores', label: 'فروشگاه‌ها', icon: Store },
  { id: 'customers', label: 'مشتریان', icon: UserRound },
  { id: 'products', label: 'محصولات', icon: ShoppingBag },
  { id: 'orders', label: 'سفارشات', icon: PackageCheck },
  {
    id: 'finance',
    label: 'مالی',
    icon: Wallet,
    children: [
      { id: 'overview', label: 'مرور کلی' },
      { id: 'plans', label: 'طرح‌ها' },
      { id: 'commission', label: 'کمیسیون' },
      { id: 'subscriptions', label: 'اشتراک‌ها' },
      { id: 'transactions', label: 'تراکنش‌ها' },
      { id: 'settlements', label: 'تسویه‌ها' },
      { id: 'financialReport', label: 'گزارش مالی' },
    ],
  },
  { id: 'reports', label: 'گزارش‌ها', icon: Compass },
  { id: 'settings', label: 'تنظیمات', icon: PackageCheck },
]

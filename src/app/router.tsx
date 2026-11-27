import { createBrowserRouter } from 'react-router-dom'
import UserLayout from '@/layouts/UserLayout'
import AuthLayout from '@/layouts/AuthLayout'
import VendorLayout from '@/layouts/VendorLayout'
import AdminLayout from '@/layouts/AdminLayout'
import RequireRole from '@/features/auth/components/RequireRole'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import VendorDashboardPage from '@/pages/vendor/DashboardPage'
import VendorProductsPage from '@/pages/vendor/ProductsPage'
import VendorStoresPage from '@/pages/vendor/StoresPage'
import VendorStoreProfilePage from '@/pages/vendor/StoreProfilePage'
import ProductEditorPage from '@/pages/vendor/ProductEditorPage'
import ReservationsPages from '@/pages/vendor/ReservationsPages'
import VendorComingSoonPage from '@/pages/vendor/ComingSoonPage'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminComingSoonPage from '@/pages/admin/ComingSoonPage'
import VendorListPage from '@/pages/admin/VendorListPage'
import VendorReviewPage from '@/pages/admin/VendorReviewPage'
import MapPage from '@/pages/MapPage'
import SearchResultsPage from '@/pages/SearchResultsPage'
import OfferCollectionPage from '@/pages/OfferCollectionPage'
import OrdersPage from '@/pages/OrdersPage'
import PublicStorePage from '@/pages/PublicStorePage'
import ProfilePage from '@/pages/ProfilePage'
import HelpSupportPage from '@/pages/HelpSupportPage'
import PersonalInfoPage from '@/pages/PersonalInfoPage'
import ProductDetailsPage from '@/pages/ProductDetailsPage'
import CheckoutPage from '@/pages/CheckoutPage'
import ReservationConfirmationPage from '@/pages/ReservationConfirmationPage'

export const router = createBrowserRouter([
  {
    path: '/products/:productId',
    element: <ProductDetailsPage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/reservations/:reservationId/confirmation',
    element: <ReservationConfirmationPage />,
  },
  {
    path: '/',
    element: <UserLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'map', element: <MapPage /> },
      { path: 'search', element: <SearchResultsPage /> },
      { path: 'today', element: <OfferCollectionPage /> },
      { path: 'popular-nearby', element: <OfferCollectionPage /> },
      { path: 'favorites', element: <OfferCollectionPage /> },
      { path: 'last-chance', element: <OfferCollectionPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'stores/:storeId', element: <PublicStorePage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'profile/personal', element: <PersonalInfoPage /> },
      { path: 'profile/support', element: <HelpSupportPage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    path: '/vendor',
    element: <VendorLayout />,
    children: [
      {
        index: true,
        element: <VendorDashboardPage />,
      },
      {
        path: 'products',
        element: <VendorProductsPage />,
      },
      {
        path: 'products/new',
        element: <ProductEditorPage />,
      },
      {
        path: 'products/:id/edit',
        element: <ProductEditorPage />,
      },
      {
        path: 'orders',
        element: <ReservationsPages key="orders" view="orders" />,
      },
      { path: 'orders/daily', element: <ReservationsPages key="daily" view="daily" /> },
      { path: 'orders/reservations', element: <ReservationsPages key="reservations" /> },
      {
        path: 'stores',
        element: <VendorStoresPage />,
      },
      {
        path: 'stores/new',
        element: <VendorStoreProfilePage storeId="new" />,
      },
      {
        path: 'stores/:id',
        element: <VendorStoreProfilePage />,
      },
      {
        path: 'finance',
        element: <VendorComingSoonPage title="مالی" />,
      },
      {
        path: 'finance/:section',
        element: <VendorComingSoonPage title="مالی" />,
      },
      {
        element: <VendorComingSoonPage title="فروشگاه‌ها" />,
      },
      {
        path: 'finance',
        element: <VendorComingSoonPage title="مالی" />,
      },
      {
        path: 'account',
        element: <VendorComingSoonPage title="حساب فروشنده" />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireRole role="admin">
        <AdminLayout />
      </RequireRole>
    ),
    children: [
      { index: true, element: <AdminDashboardPage />, handle: { title: 'داشبورد' } },
      {
        path: 'store-requests',
        element: <VendorListPage key="requests" mode="requests" />,
        handle: { title: 'درخواست فروشگاه‌ها' },
      },
      {
        path: 'store-requests/:vendorId',
        element: <VendorReviewPage key="request-review" mode="requests" />,
        handle: { title: 'بررسی درخواست', backTo: '/admin/store-requests' },
      },
      {
        path: 'stores',
        element: <VendorListPage key="stores" mode="stores" />,
        handle: { title: 'فروشگاه‌ها' },
      },
      {
        path: 'stores/:vendorId',
        element: <VendorReviewPage key="store-details" mode="stores" />,
        handle: { title: 'جزئیات فروشگاه', backTo: '/admin/stores' },
      },
      {
        path: 'customers',
        element: <AdminComingSoonPage title="مشتریان" />,
        handle: { title: 'مشتریان' },
      },
      {
        path: 'products',
        element: <AdminComingSoonPage title="محصولات" />,
        handle: { title: 'محصولات' },
      },
      {
        path: 'orders',
        element: <AdminComingSoonPage title="سفارشات" />,
        handle: { title: 'سفارشات' },
      },
      { path: 'finance', element: <AdminComingSoonPage title="مالی" />, handle: { title: 'مالی' } },
      {
        path: 'finance/:section',
        element: <AdminComingSoonPage title="مالی" />,
        handle: { title: 'مالی' },
      },
      {
        path: 'support',
        element: <AdminComingSoonPage title="پشتیبانی" />,
        handle: { title: 'پشتیبانی' },
      },
      {
        path: 'settings',
        element: <AdminComingSoonPage title="تنظیمات" />,
        handle: { title: 'تنظیمات' },
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

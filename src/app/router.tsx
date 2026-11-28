import { createBrowserRouter, replace } from 'react-router-dom'
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
import AddStorePage from '@/pages/vendor/AddStorePage'
import ProductEditorPage from '@/pages/vendor/ProductEditorPage'
import ReservationsPages from '@/pages/vendor/ReservationsPages'
import VendorOrdersPage from '@/pages/vendor/OrdersPage'
import VendorReservationsPage from '@/pages/vendor/ReservationsPage'
import VendorAccountPage from '@/pages/vendor/AccountPage'
import VendorLoginPage from '@/pages/vendor/LoginPage'
import VendorFinancePage from '@/pages/vendor/FinancePage'
import { FINANCE_ITEMS } from '@/features/vendor-finance/navigation'
import AdminDashboardPage from '@/pages/admin/DashboardPage'
import AdminComingSoonPage from '@/pages/admin/ComingSoonPage'
import AdminLoginPage from '@/pages/admin/LoginPage'
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
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
      { path: '/vendor/login', element: <VendorLoginPage /> },
    ],
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
        path: 'dashboard',
        loader: ({ request }) => replace(`/vendor${new URL(request.url).search}`),
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
      { path: 'orders', element: <VendorOrdersPage /> },
      { path: 'orders/daily', element: <ReservationsPages key="daily" view="daily" /> },
      { path: 'orders/reservations', element: <VendorReservationsPage /> },
      { path: 'orders/list', element: <VendorOrdersPage /> },
      { path: 'reservations', element: <VendorReservationsPage /> },
      {
        path: 'stores',
        element: <VendorStoresPage />,
      },
      {
        path: 'stores/new',
        element: <AddStorePage />,
      },
      {
        path: 'stores/:id',
        element: <VendorStoreProfilePage />,
      },
      {
        path: 'finance',
        children: [
          {
            index: true,
            loader: ({ request }) =>
              replace(`/vendor/finance/overview${new URL(request.url).search}`),
          },
          ...FINANCE_ITEMS.map(([section]) => ({
            path: section,
            element: <VendorFinancePage section={section} />,
          })),
        ],
      },
      {
        path: 'account',
        element: <VendorAccountPage />,
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
      {
        index: true,
        element: <AdminDashboardPage />,
        handle: { title: 'داشبورد' },
      },
      {
        path: 'dashboard',
        loader: ({ request }) => replace(`/admin${new URL(request.url).search}`),
      },
      {
        path: 'store-requests',
        element: <VendorListPage key="requests" mode="requests" />,
        handle: { title: 'درخواست فروشگاه‌ها' },
      },
      {
        path: 'store-requests/:vendorId',
        element: <VendorReviewPage key="request-review" mode="requests" />,
        handle: {
          title: 'بررسی درخواست',
          backTo: '/admin/store-requests',
        },
      },
      {
        path: 'stores',
        element: <VendorListPage key="stores" mode="stores" />,
        handle: { title: 'فروشگاه‌ها' },
      },
      {
        path: 'stores/:vendorId',
        element: <VendorReviewPage key="store-details" mode="stores" />,
        handle: {
          title: 'جزئیات فروشگاه',
          backTo: '/admin/stores',
        },
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
      {
        path: 'finance',
        element: <AdminComingSoonPage title="مالی" />,
        handle: { title: 'مالی' },
      },
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

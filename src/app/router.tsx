import { createBrowserRouter, replace } from 'react-router-dom'
import UserLayout from '@/layouts/UserLayout'
import AuthLayout from '@/layouts/AuthLayout'
import VendorLayout from '@/layouts/VendorLayout'
import AdminLayout from '@/layouts/AdminLayout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import VendorDashboardPage from '@/pages/vendor/DashboardPage'
import VendorProductsPage from '@/pages/vendor/ProductsPage'
import VendorStoresPage from '@/pages/vendor/StoresPage'
import VendorStoreProfilePage from '@/pages/vendor/StoreProfilePage'
import ProductEditorPage from '@/pages/vendor/ProductEditorPage'
import ReservationsPages from '@/pages/vendor/ReservationsPages'
import VendorOrdersPage from '@/pages/vendor/OrdersPage'
import VendorReservationsPage from '@/pages/vendor/ReservationsPage'
import VendorAccountPage from '@/pages/vendor/AccountPage'
import VendorLoginPage from '@/pages/vendor/LoginPage'
import { FINANCE_ITEMS } from '@/features/vendor-finance/navigation'
import VendorFinancePage from '@/pages/vendor/FinancePage'
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
import PersonalInfoPage from '@/pages/PersonalInfoPage'
import HelpSupportPage from '@/pages/HelpSupportPage'

function normalizeTrailingSlashLoader({ request }: { request: Request }) {
  const url = new URL(request.url)
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    return replace(`${url.pathname.replace(/\/+$/, '')}${url.search}${url.hash}`)
  }
  return null
}

export const router = createBrowserRouter([
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
      { path: '/vendor/login', element: <VendorLoginPage /> },
      { path: '/admin/login', element: <AdminLoginPage /> },
    ],
  },
  {
    path: '/vendor',
    loader: normalizeTrailingSlashLoader,
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
        element: <VendorStoreProfilePage storeId="new" />,
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
    loader: normalizeTrailingSlashLoader,
    element: <AdminLayout />,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      {
        path: 'dashboard',
        loader: ({ request }) => replace(`/admin${new URL(request.url).search}`),
      },
      { path: 'store-requests', element: <VendorListPage key="requests" mode="requests" /> },
      {
        path: 'store-requests/:vendorId',
        element: <VendorReviewPage key="request-review" mode="requests" />,
      },
      { path: 'stores', element: <VendorListPage key="stores" mode="stores" /> },
      {
        path: 'stores/:vendorId',
        element: <VendorReviewPage key="store-details" mode="stores" />,
      },
      { path: 'customers', element: <AdminComingSoonPage title="مشتریان" /> },
      { path: 'products', element: <AdminComingSoonPage title="محصولات" /> },
      { path: 'orders', element: <AdminComingSoonPage title="سفارشات" /> },
      { path: 'finance', element: <AdminComingSoonPage title="مالی" /> },
      { path: 'finance/:section', element: <AdminComingSoonPage title="مالی" /> },
      { path: 'support', element: <AdminComingSoonPage title="پشتیبانی" /> },
      { path: 'settings', element: <AdminComingSoonPage title="تنظیمات" /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

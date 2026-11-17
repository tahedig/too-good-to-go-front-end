import { createBrowserRouter, Navigate } from 'react-router-dom';
import PublicLayout from '@/layouts/PublicLayout';
import AuthLayout from '@/layouts/AuthLayout';
import VendorLayout from '@/layouts/VendorLayout';
import AdminLayout from '@/layouts/AdminLayout';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import NotFoundPage from '@/pages/NotFoundPage';
import VendorOrdersPage from '@/pages/vendor/OrdersPage';
import VendorReservationsPage from '@/pages/vendor/ReservationsPage';
import AdminDashboardPage from '@/pages/admin/DashboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <LoginPage /> }],
  },
  {
    path: '/vendor',
    element: <VendorLayout />,
    children: [
      { index: true, element: <Navigate to="/vendor/orders" replace /> },
      { path: 'orders', element: <VendorOrdersPage /> },
      { path: 'reservations', element: <VendorReservationsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [{ index: true, element: <AdminDashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);

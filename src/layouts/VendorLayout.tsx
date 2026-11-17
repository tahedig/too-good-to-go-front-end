import { Outlet } from 'react-router-dom';

export default function VendorLayout() {
  return (
    <div className="min-h-screen bg-background text-text-primary dir-rtl">
      <Outlet />
    </div>
  );
}

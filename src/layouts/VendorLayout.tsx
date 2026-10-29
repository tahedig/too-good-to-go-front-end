import { Outlet } from 'react-router-dom'

export default function VendorLayout() {
  return (
    <div className="min-h-screen">
      <header className="border-b p-4 font-bold">پنل فروشنده</header>
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}

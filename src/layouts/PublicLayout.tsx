import { Outlet, Link } from 'react-router-dom'
import { env } from '@/config/env'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b p-4 flex items-center justify-between">
        <Link to="/" className="font-bold">
          {env.appName}
        </Link>
        <Link to="/login">ورود</Link>
      </header>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  )
}

import { Outlet, Link } from 'react-router-dom';
import { Store } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <header className="border-b border-border-default bg-surface px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight text-primary">
          ته‌دیگ
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            to="/vendor/orders"
            className="flex items-center gap-1.5 rounded-lg bg-surface-secondary px-3 py-1.5 text-text-primary hover:bg-surface-sage transition-colors"
          >
            <Store className="size-4 text-primary" />
            <span>پنل فروشنده</span>
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-border-default px-3 py-1.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            ورود
          </Link>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

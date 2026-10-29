import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">۴۰۴ - صفحه پیدا نشد</h1>
      <Link to="/" className="underline">
        بازگشت به خانه
      </Link>
    </div>
  )
}

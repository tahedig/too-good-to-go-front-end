import {Button} from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import {Input} from '@/components/ui/Input'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-title-xl">صفحه اصلی</h1>
      <Card className="space-y-4">
        <Input label="شماره موبایل" placeholder="۰۹۱۲..." />
        <div className="flex gap-3">
          <Button>رزرو کنید</Button>
          <Button variant="secondary">انصراف</Button>
        </div>
      </Card>
    </div>
  )
}

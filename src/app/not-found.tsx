import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <BookOpen className="mx-auto h-16 w-16 text-amber-200" />
        <h1 className="mt-6 font-serif text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-gray-500">未找到该页面</p>
        <p className="mt-1 text-sm text-gray-400">
          可能这本书不在我们的馆藏中
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/">
            <Button variant="primary">返回首页</Button>
          </Link>
          <Link href="/library">
            <Button variant="secondary">浏览书库</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

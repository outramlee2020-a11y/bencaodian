'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, ChevronRight, BookOpen } from 'lucide-react'

interface HistoryItem {
  id: string
  bookId: string
  chapterId: string | null
  pageNumber: number | null
  progress: number
  lastReadAt: string
}

export default function HistoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/history')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setHistory(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  function formatRelativeTime(dateStr: string) {
    const now = Date.now()
    const date = new Date(dateStr).getTime()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 小时前`
    if (days < 7) return `${days} 天前`
    return new Date(dateStr).toLocaleDateString('zh-CN')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-900">阅读历史</h1>
        <p className="mt-1 text-sm text-gray-500">最近阅读的古籍</p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">暂无阅读记录</p>
          <p className="mt-1 text-xs text-gray-300">开始阅读后，历史记录将显示在这里</p>
          <Link
            href="/library"
            className="mt-4 inline-block text-sm font-medium text-amber-700 hover:text-amber-600"
          >
            去书库浏览 →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Link
              key={item.id}
              href={item.chapterId ? `/book/${item.bookId}/chapter/${item.chapterId}` : `/book/${item.bookId}`}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                  <BookOpen className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    古籍 #{item.bookId.slice(0, 8)}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                    <span>进度 {Math.round(item.progress)}%</span>
                    <span>·</span>
                    <span>{formatRelativeTime(item.lastReadAt)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 h-1.5 w-32 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all"
                      style={{ width: `${Math.min(item.progress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

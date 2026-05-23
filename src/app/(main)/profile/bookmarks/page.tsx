'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bookmark, ChevronRight, Trash2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BookmarkItem {
  id: string
  bookId: string
  chapterId: string | null
  pageNumber: number | null
  text: string | null
  note: string | null
  createdAt: string
}

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/bookmarks')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setBookmarks(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/bookmarks?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setBookmarks((prev) => prev.filter((b) => b.id !== id))
    }
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
        <h1 className="font-serif text-2xl font-bold text-gray-900">我的书签</h1>
        <p className="mt-1 text-sm text-gray-500">共 {bookmarks.length} 个书签</p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Bookmark className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">还没有书签</p>
          <p className="mt-1 text-xs text-gray-300">阅读古籍时点击书签按钮即可添加</p>
          <Link
            href="/library"
            className="mt-4 inline-block text-sm font-medium text-amber-700 hover:text-amber-600"
          >
            去书库浏览 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-200"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/book/${bookmark.bookId}`}
                    className="text-sm font-medium text-amber-800 hover:text-amber-600"
                  >
                    {bookmark.bookId}
                  </Link>
                  {bookmark.chapterId && (
                    <Link
                      href={`/book/${bookmark.bookId}/chapter/${bookmark.chapterId}`}
                      className="ml-2 text-xs text-gray-400 hover:text-gray-600"
                    >
                      · 章节
                    </Link>
                  )}
                  {bookmark.text && (
                    <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">
                      &ldquo;{bookmark.text}&rdquo;
                    </p>
                  )}
                  {bookmark.note && (
                    <p className="mt-1 text-xs text-gray-400">
                      📝 {bookmark.note}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-300">
                    {new Date(bookmark.createdAt).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(bookmark.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title="删除书签"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

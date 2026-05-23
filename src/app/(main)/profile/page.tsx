'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bookmark, BookOpen, FileText, Clock, ChevronRight, User, Mail, Calendar } from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: string
  _count: {
    bookmarks: number
    notes: number
    histories: number
  }
  recentHistory: Array<{
    id: string
    bookId: string
    chapterId: string | null
    progress: number
    lastReadAt: string
  }>
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/user')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setProfile(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (!profile) return null

  const statCards = [
    { label: '书签', value: profile._count.bookmarks, icon: Bookmark, href: '/profile/bookmarks' },
    { label: '笔记', value: profile._count.notes, icon: FileText, href: '/profile/notes' },
    { label: '阅读记录', value: profile._count.histories, icon: Clock, href: '/profile/history' },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-800">
            {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">
              {profile.name || '用户'}
            </h1>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500">
              <Mail className="h-3.5 w-3.5" />
              {profile.email}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar className="h-3 w-3" />
              注册于 {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="group p-4 text-center transition-colors hover:border-amber-200">
                <Icon className="mx-auto h-5 w-5 text-amber-600" />
                <div className="mt-1.5 text-xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Reading */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">最近阅读</h2>
          <Link
            href="/profile/history"
            className="text-xs font-medium text-amber-700 hover:text-amber-600"
          >
            查看全部 →
          </Link>
        </div>
        {profile.recentHistory.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-sm text-gray-400">暂无阅读记录</p>
            <Link
              href="/library"
              className="mt-3 inline-block text-sm font-medium text-amber-700 hover:text-amber-600"
            >
              去书库浏览
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profile.recentHistory.map((h) => (
              <Link
                key={h.id}
                href={`/book/${h.bookId}`}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-colors hover:border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-gray-700">书籍 #{h.bookId.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    进度 {Math.round(h.progress)}%
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

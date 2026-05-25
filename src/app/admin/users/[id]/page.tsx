'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Bookmark, BookOpen, FileText, Shield, ShieldOff } from 'lucide-react'

interface RecentBookmark {
  id: string
  bookId: string
  book: { title: string }
  chapterId: string | null
  createdAt: string
}

interface RecentHistory {
  id: string
  bookId: string
  book: { title: string }
  chapterId: string | null
  chapter: { title: string } | null
  lastReadAt: string
}

interface UserDetail {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
  _count: { bookmarks: number; histories: number; notes: number }
  recentBookmarks: RecentBookmark[]
  recentHistories: RecentHistory[]
}

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const fetchUser = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      const json = await res.json()
      if (json.success) setUser(json.data)
      else setError('加载失败')
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchUser() }, [fetchUser])

  async function toggleRole() {
    if (!user) return
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? '提升为管理员' : '降级为普通用户'
    if (!confirm(`确定要${action}吗？`)) return

    setSaving(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      const json = await res.json()
      if (json.success) {
        setUser(prev => prev ? { ...prev, role: newRole } : null)
        setSuccessMsg(`角色已更改为 ${newRole === 'admin' ? '管理员' : '普通用户'}`)
      } else {
        setError(json.error || '修改失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-stone-400">加载中...</div>
    )
  }

  if (error && !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/users"
        className="mb-6 inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回用户列表
      </Link>

      <h1 className="mb-8 font-serif text-2xl font-bold text-gray-900">
        {user?.email || '用户详情'}
      </h1>

      {successMsg && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{successMsg}</div>
      )}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* User Info */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">用户信息</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="ID" value={user?.id} />
            <InfoItem label="用户名" value={user?.name} />
            <InfoItem label="邮箱" value={user?.email} />
            <div>
              <dt className="text-xs font-medium uppercase text-gray-400">角色</dt>
              <dd className="mt-1 flex items-center gap-2">
                <Badge variant={user?.role === 'admin' ? 'primary' : 'default'}>
                  {user?.role === 'admin' ? '管理员' : '用户'}
                </Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleRole}
                  disabled={saving}
                >
                  {user?.role === 'admin' ? (
                    <><ShieldOff className="mr-1 h-3.5 w-3.5" />取消管理员</>
                  ) : (
                    <><Shield className="mr-1 h-3.5 w-3.5" />设为管理员</>
                  )}
                </Button>
              </dd>
            </div>
            <InfoItem label="注册时间" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'} />
          </dl>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">数据统计</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <StatCard icon={<Bookmark className="h-5 w-5" />} label="收藏数" value={user?._count.bookmarks ?? 0} color="amber" />
            <StatCard icon={<BookOpen className="h-5 w-5" />} label="阅读历史数" value={user?._count.histories ?? 0} color="blue" />
            <StatCard icon={<FileText className="h-5 w-5" />} label="笔记数" value={user?._count.notes ?? 0} color="green" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Bookmarks */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">最近收藏</h2>
        </CardHeader>
        <CardContent>
          {!user?.recentBookmarks?.length ? (
            <p className="py-6 text-center text-sm text-stone-400">暂无数据</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {user.recentBookmarks.map(bm => (
                <div key={bm.id} className="flex items-center justify-between py-3">
                  <Link href={`/book/${bm.bookId}`} className="text-sm font-medium text-amber-800 hover:text-amber-600 hover:underline">
                    {bm.book.title}
                  </Link>
                  <span className="text-xs text-stone-400">{new Date(bm.createdAt).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">最近阅读</h2>
        </CardHeader>
        <CardContent>
          {!user?.recentHistories?.length ? (
            <p className="py-6 text-center text-sm text-stone-400">暂无数据</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {user.recentHistories.map(h => (
                <div key={h.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/book/${h.bookId}`} className="text-sm font-medium text-amber-800 hover:text-amber-600 hover:underline">
                      {h.book.title}
                    </Link>
                    {h.chapter && <span className="ml-2 text-xs text-stone-400">- {h.chapter.title}</span>}
                  </div>
                  <span className="text-xs text-stone-400">{new Date(h.lastReadAt).toLocaleDateString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase text-gray-400">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.amber}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="mt-1 text-xs font-medium opacity-75">{label}</div>
    </div>
  )
}

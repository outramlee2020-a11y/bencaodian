'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Files, Tags, Users, AlertCircle, CheckCircle2, Clock, Upload } from 'lucide-react'

interface DashboardData {
  books: number
  chapters: number
  pageContents: number
  categories: number
  users: number
  contentBooks: number
  booksByQuality: { quality: string; _count: number }[]
  recentBooks: { id: string; title: string; author: string | null; quality: string; createdAt: string }[]
  reviewedCount: number
  pendingReview: number
  importJobs: { status: string; _count: number }[]
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData(json.data)
        } else {
          setError('加载失败')
        }
      })
      .catch(() => setError('网络错误'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-stone-400 text-sm">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 rounded-lg px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const totalQuality = data.booksByQuality.reduce((sum, q) => sum + q._count, 0)
  const roughCount = data.booksByQuality.find((q) => q.quality === 'rough')?._count ?? 0
  const polishedCount = data.booksByQuality.find((q) => q.quality === 'polished')?._count ?? 0
  const roughPercent = totalQuality ? Math.round((roughCount / totalQuality) * 100) : 0
  const polishedPercent = totalQuality ? Math.round((polishedCount / totalQuality) * 100) : 0

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">仪表盘</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard icon={<BookOpen className="h-5 w-5 text-amber-600" />} count={data.books} label="古籍总数" />
        <StatCard icon={<FileText className="h-5 w-5 text-blue-600" />} count={data.chapters} label="章节总数" />
        <StatCard icon={<Files className="h-5 w-5 text-green-600" />} count={data.pageContents} label="正文数量" />
        <StatCard icon={<Tags className="h-5 w-5 text-purple-600" />} count={data.categories} label="分类数量" />
        <StatCard icon={<Users className="h-5 w-5 text-stone-600" />} count={data.users} label="用户数量" />
      </div>

      {/* Data Quality + Review Status */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent>
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">数据质量</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-stone-600">待整理 (rough)</span>
                  <span className="text-stone-500">{roughCount} ({roughPercent}%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3">
                  <div className="bg-amber-200 h-3 rounded-full transition-all" style={{ width: `${roughPercent}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-stone-600">已整理 (polished)</span>
                  <span className="text-stone-500">{polishedCount} ({polishedPercent}%)</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3">
                  <div className="bg-green-300 h-3 rounded-full transition-all" style={{ width: `${polishedPercent}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">审定概况</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-1.5 text-stone-600">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    已审定
                  </span>
                  <span className="text-stone-500">{data.reviewedCount}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3">
                  <div className="bg-green-400 h-3 rounded-full transition-all" style={{ width: `${data.books ? Math.round((data.reviewedCount / data.books) * 100) : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-1.5 text-stone-600">
                    <Clock className="h-4 w-4 text-amber-500" />
                    待审定
                  </span>
                  <span className="text-stone-500">{data.pendingReview}</span>
                </div>
                <div className="w-full bg-stone-100 rounded-full h-3">
                  <div className="bg-amber-300 h-3 rounded-full transition-all" style={{ width: `${data.books ? Math.round((data.pendingReview / data.books) * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Queue Status */}
      {/* Quick actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        <a
          href="/admin/books?filter=no-content"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
        >
          <FileText className="h-4 w-4" />
          查看无章节内容的书籍
        </a>
        <a
          href="/admin/import"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 transition-colors"
        >
          <Upload className="h-4 w-4" />
          管理数据导入
        </a>
      </div>

      <Card className="mb-8">
        <CardContent>
          <h2 className="font-serif text-lg font-semibold text-stone-900 mb-4">最近入库</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <Th>书名</Th>
                  <Th>作者</Th>
                  <Th>质量</Th>
                  <Th>入库时间</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentBooks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400">暂无数据</td>
                  </tr>
                ) : (
                  data.recentBooks.map((book) => (
                    <tr key={book.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-3 pr-4 font-medium text-stone-900">{book.title}</td>
                      <td className="py-3 pr-4 text-stone-600">{book.author || '-'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={book.quality === 'polished' ? 'success' : 'warning'}>
                          {book.quality === 'polished' ? 'polished' : 'rough'}
                        </Badge>
                      </td>
                      <td className="py-3 text-stone-500">
                        {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, count, label }: { icon: React.ReactNode; count: number; label: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-1">{icon}</div>
        <div className="text-3xl font-bold text-stone-900">{count}</div>
        <div className="text-sm text-stone-500 mt-1">{label}</div>
      </CardContent>
    </Card>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="py-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
      {children}
    </th>
  )
}

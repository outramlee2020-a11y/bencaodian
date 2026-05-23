'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface BookItem {
  id: string
  title: string
  titleCn: string | null
  author: string | null
  authorDynasty: string | null
  dynasty: string | null
  edition: string | null
  categoryId: string | null
  dataSource: string
  totalChapters: number
  chapterCount: number
  createdAt: string
}

interface Stats {
  books: number
  chapters: number
  pageContents: number
  categories: number
}

interface ApiResponse {
  success: boolean
  data: {
    books: BookItem[]
    stats: Stats
    pagination: { total: number; offset: number; limit: number }
  }
}

const SOURCE_LABELS: Record<string, string> = {
  shidianguji: '识典古籍',
  manual: '手动录入',
}

export default function AdminImportPage() {
  const [data, setData] = useState<ApiResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  async function fetchBooks() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (sourceFilter) params.set('source', sourceFilter)
      params.set('limit', '500')
      const res = await fetch(`/api/admin/books?${params}`)
      const json: ApiResponse = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError('加载失败')
      }
    } catch (e) {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBooks() }, [sourceFilter])

  const filteredBooks = data?.books.filter(b => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      b.id.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      (b.author || '').toLowerCase().includes(q) ||
      (b.authorDynasty || '').toLowerCase().includes(q)
    )
  }) ?? []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">数据导入管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          管理从识典古籍导入的古籍数据
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="古籍总数" value={data?.stats.books ?? '-'} color="amber" />
        <StatCard label="章节数" value={data?.stats.chapters ?? '-'} color="blue" />
        <StatCard label="正文内容" value={data?.stats.pageContents ?? '-'} color="green" />
        <StatCard label="分类数" value={data?.stats.categories ?? '-'} color="purple" />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="搜索书籍 ID、名称、作者..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部来源</option>
          <option value="shidianguji">识典古籍</option>
          <option value="manual">手动录入</option>
        </select>
        <button
          onClick={fetchBooks}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          刷新
        </button>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div className="py-20 text-center text-gray-400">加载中...</div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {/* Book Table */}
      {data && !loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th>书名</Th>
                <Th>作者</Th>
                <Th>朝代</Th>
                <Th>来源</Th>
                <Th>章节</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {book.title || book.titleCn || book.id}
                      </div>
                      <div className="text-xs text-gray-400">{book.id}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {book.author || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {book.authorDynasty || book.dynasty || '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        book.dataSource === 'shidianguji'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {SOURCE_LABELS[book.dataSource] || book.dataSource}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {book.chapterCount}/{book.totalChapters || '?'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/book/${book.id}`}
                        className="rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                      >
                        查看
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer info */}
      {data && (
        <p className="mt-4 text-xs text-gray-400">
          共 {data.pagination.total} 条记录，显示 {data.books.length} 条
        </p>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.amber}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs font-medium opacity-75">{label}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </th>
  )
}

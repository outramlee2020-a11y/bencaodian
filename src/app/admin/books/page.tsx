'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface BookItem {
  id: string
  title: string
  titleCn: string | null
  author: string | null
  authorDynasty: string | null
  dynasty: string | null
  edition: string | null
  quality: string
  dataSource: string
  totalChapters: number
  chapterCount: number
  reviewedAt: string | null
  coverUrl: string | null
  createdAt: string
}

interface BooksApiResponse {
  success: boolean
  data: {
    books: BookItem[]
    stats: { books: number; chapters: number; pageContents: number; categories: number }
    pagination: { total: number; offset: number; limit: number }
  }
}

const SOURCE_LABELS: Record<string, string> = {
  shidianguji: '识典古籍',
  manual: '手动录入',
}
const QUALITY_LABELS: Record<string, string> = { rough: '粗校', polished: '精校' }

export default function AdminBooksPage() {
  const [data, setData] = useState<BooksApiResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  const [contentFilter, setContentFilter] = useState('')
  const [currentOffset, setCurrentOffset] = useState(0)
  const limit = 50

  const fetchBooks = useCallback(async (offset: number) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (sourceFilter) params.set('source', sourceFilter)
      if (qualityFilter) params.set('quality', qualityFilter)
      if (contentFilter) params.set('filter', contentFilter)
      if (searchQuery) params.set('search', searchQuery)
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const res = await fetch(`/api/admin/books?${params}`)
      const json: BooksApiResponse = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError('加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [sourceFilter, qualityFilter, searchQuery, contentFilter])

  useEffect(() => { fetchBooks(currentOffset) }, [currentOffset, fetchBooks])

  const total = data?.pagination.total ?? 0
  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(currentOffset / limit) + 1
  const filteredBooks = data?.books ?? []
  const withContent = filteredBooks.filter(b => b.chapterCount > 0).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">书籍管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理所有古籍数据</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <StatCard label="古籍总数" value={total} color="amber" />
        <StatCard label="有内容" value={withContent} color="green" />
        <StatCard label="无内容" value={total - withContent} color="gray" />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="搜索书籍 ID、名称、作者..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setCurrentOffset(0); fetchBooks(0) } }}
          />
        </div>
        <select
          value={sourceFilter}
          onChange={e => { setSourceFilter(e.target.value); setCurrentOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部来源</option>
          <option value="shidianguji">识典古籍</option>
          <option value="manual">手动录入</option>
        </select>
        <select
          value={qualityFilter}
          onChange={e => { setQualityFilter(e.target.value); setCurrentOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部品质</option>
          <option value="rough">粗校</option>
          <option value="polished">精校</option>
        </select>
        <select
          value={contentFilter}
          onChange={e => { setContentFilter(e.target.value); setCurrentOffset(0) }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部章节状态</option>
          <option value="no-content">无章节内容</option>
        </select>
        <Button variant="primary" size="md" onClick={() => fetchBooks(currentOffset)}>刷新</Button>
      </div>

      {loading && (
        <div className="py-20 text-center text-gray-400">加载中...</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {data && !loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <Th>ID</Th>
                <Th>书名</Th>
                <Th>作者</Th>
                <Th>朝代</Th>
                <Th>来源</Th>
                <Th>品质</Th>
                <Th>章节数</Th>
                <Th>审定</Th>
                <Th>创建时间</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-400">
                      {book.id.slice(0, 8)}...
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {book.title || book.titleCn || '-'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {book.author || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-md bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                        {book.authorDynasty || book.dynasty || '-'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={book.dataSource === 'shidianguji' ? 'info' : 'default'}>
                        {SOURCE_LABELS[book.dataSource] || book.dataSource}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={book.quality === 'polished' ? 'success' : 'warning'}>
                        {QUALITY_LABELS[book.quality] || book.quality}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {book.chapterCount}/{book.totalChapters || '?'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {book.reviewedAt ? (
                        <Badge variant="success" className="bg-green-50 text-green-700">
                          已审
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-gray-100 text-gray-500">
                          待审
                        </Badge>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                      {new Date(book.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/books/${book.id}`}
                          className="rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          编辑
                        </Link>
                        <Link
                          href={`/book/${book.id}`}
                          className="rounded-md bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                        >
                          查看
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            共 {total} 条记录，第 {currentPage}/{totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentOffset === 0}
              onClick={() => setCurrentOffset(o => Math.max(0, o - limit))}
            >
              上一页
            </Button>
            <span className="px-2 text-xs text-gray-400">{currentPage}/{totalPages}</span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentOffset + limit >= total}
              onClick={() => setCurrentOffset(o => o + limit)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-stone-50 text-stone-600 border-stone-200',
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
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
      {children}
    </th>
  )
}

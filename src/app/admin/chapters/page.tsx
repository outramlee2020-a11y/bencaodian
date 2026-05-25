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
}

interface ChapterItem {
  id: string
  bookId: string
  book: { id: string; title: string }
  title: string
  chapterLevel: number
  orderNum: number
  wordCount: number
  hasMainContent: boolean
  createdAt: string
}

interface ChapterApiResponse {
  success: boolean
  data: {
    chapters: ChapterItem[]
    pagination: { total: number; offset: number; limit: number }
  }
}

interface BooksApiResponse {
  success: boolean
  data: { books: BookItem[] }
}

export default function AdminChaptersPage() {
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [pagination, setPagination] = useState({ total: 0, offset: 0, limit: 50 })
  const [books, setBooks] = useState<BookItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [bookFilter, setBookFilter] = useState('')
  const [currentOffset, setCurrentOffset] = useState(0)
  const limit = 50

  const fetchChapters = useCallback(async (offset: number) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (bookFilter) params.set('bookId', bookFilter)
      if (searchQuery) params.set('search', searchQuery)
      params.set('limit', String(limit))
      params.set('offset', String(offset))
      const res = await fetch(`/api/admin/chapters?${params}`)
      const json: ChapterApiResponse = await res.json()
      if (json.success) {
        setChapters(json.data.chapters)
        setPagination(json.data.pagination)
      } else {
        setError('加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [bookFilter, searchQuery])

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/books?limit=500')
      const json: BooksApiResponse = await res.json()
      if (json.success) {
        setBooks(json.data.books)
      }
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => { fetchBooks() }, [fetchBooks])
  useEffect(() => { fetchChapters(currentOffset) }, [currentOffset, fetchChapters])

  const totalPages = Math.ceil(pagination.total / limit)
  const currentPage = Math.floor(currentOffset / limit) + 1

  function handleSearch() {
    setCurrentOffset(0)
    fetchChapters(0)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">章节管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理所有古籍章节数据</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="搜索章节标题..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          />
        </div>
        <select
          value={bookFilter}
          onChange={e => { setBookFilter(e.target.value); setCurrentOffset(0) }}
          className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
        >
          <option value="">全部书籍</option>
          {books.map(b => (
            <option key={b.id} value={b.id}>
              {b.title || b.titleCn || b.id}
            </option>
          ))}
        </select>
        <Button variant="primary" size="md" onClick={handleSearch}>刷新</Button>
      </div>

      {loading && (
        <div className="py-20 text-center text-gray-400">加载中...</div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!loading && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <Th>书名</Th>
                <Th>章节标题</Th>
                <Th>层级</Th>
                <Th>字数</Th>
                <Th>有内容</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {chapters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                chapters.map(ch => (
                  <tr key={ch.id} className="hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        onClick={() => { setBookFilter(ch.bookId); setCurrentOffset(0) }}
                        className="text-left font-medium text-amber-800 hover:text-amber-600 hover:underline"
                      >
                        {ch.book?.title || ch.bookId.slice(0, 8)}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/chapters/${ch.id}`}
                        className="font-medium text-gray-900 hover:text-amber-800 hover:underline"
                      >
                        {ch.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {ch.chapterLevel}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {ch.wordCount || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Badge variant={ch.hasMainContent ? 'success' : 'default'}>
                        {ch.hasMainContent ? '是' : '否'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        href={`/admin/chapters/${ch.id}`}
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

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            共 {pagination.total} 条记录，第 {currentPage}/{totalPages} 页
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
            <Button
              variant="secondary"
              size="sm"
              disabled={currentOffset + limit >= pagination.total}
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

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
      {children}
    </th>
  )
}

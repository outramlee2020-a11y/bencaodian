'use client'

import { useEffect, useState, useCallback } from 'react'
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
  reviewedAt: string | null
  createdAt: string
}

interface Stats {
  books: { total: number; fromShidianguji: number; manual: number }
  chapters: number
  pageContents: number
  categories: number
}

interface ImportJob {
  id: string
  bookId: string
  bookTitle: string | null
  status: string
  progress: number
  totalChapters: number
  importedChapters: number
  error: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
}

const SOURCE_LABELS: Record<string, string> = {
  shidianguji: '识典古籍',
  manual: '手动录入',
}

const JOB_STATUS_LABELS: Record<string, string> = {
  pending: '等待中',
  running: '导入中',
  completed: '已完成',
  failed: '失败',
}

export default function AdminImportPage() {
  const [data, setData] = useState<{ books: BookItem[]; stats: Stats; pagination: { total: number } } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [showJobPanel, setShowJobPanel] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  async function fetchBooks() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (sourceFilter) params.set('source', sourceFilter)
      params.set('limit', '500')
      const res = await fetch(`/api/admin/books?${params}`)
      const json = await res.json()
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
  }

  async function fetchJobs() {
    try {
      const res = await fetch('/api/admin/import')
      const json = await res.json()
      if (json.success) setJobs(json.data)
    } catch { /* ignore */ }
  }

  useEffect(() => { fetchBooks() }, [sourceFilter])
  useEffect(() => {
    if (showJobPanel) {
      fetchJobs()
      const interval = setInterval(fetchJobs, 3000)
      return () => clearInterval(interval)
    }
  }, [showJobPanel])

  const handleBatchSearch = useCallback(async () => {
    if (!confirm('将批量搜索中医关键词并在数据库中建立书目记录，继续？')) return
    setError('')
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: '', action: 'batch' }),
      })
      const json = await res.json()
      if (json.success) {
        alert(`批量搜索完成，发现 ${json.data.found} 本书，已保存 ${json.data.saved} 本`)
        fetchBooks()
      } else {
        setError(json.error || '批量搜索失败')
      }
    } catch {
      setError('批量搜索请求失败')
    }
  }, [])

  const handleImport = useCallback(async (bookId: string, bookTitle: string) => {
    if (!confirm(`为「${bookTitle || bookId}」创建导入任务？`)) return
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, action: 'import' }),
      })
      const json = await res.json()
      if (json.success) {
        setShowJobPanel(true)
        fetchJobs()
      } else {
        alert(json.error || '创建导入任务失败')
      }
    } catch {
      alert('创建导入任务请求失败')
    }
  }, [])

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

  const filteredJobs = jobs.filter(j => {
    if (!statusFilter) return true
    return j.status === statusFilter
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">数据导入管理</h1>
          <p className="mt-1 text-sm text-gray-500">管理从识典古籍导入的古籍数据</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJobPanel(v => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              showJobPanel
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            导入队列 {jobs.filter(j => j.status === 'running' || j.status === 'pending').length > 0 &&
              `(${jobs.filter(j => j.status === 'running' || j.status === 'pending').length})`}
          </button>
          <button
            onClick={handleBatchSearch}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            批量搜索中医古籍
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="古籍总数" value={data?.stats.books?.total ?? '-'} color="amber" />
        <StatCard label="章节数" value={data?.stats.chapters ?? '-'} color="blue" />
        <StatCard label="正文内容" value={data?.stats.pageContents ?? '-'} color="green" />
        <StatCard label="分类数" value={data?.stats.categories ?? '-'} color="purple" />
      </div>

      {/* Import Jobs Panel */}
      {showJobPanel && (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-amber-800">导入队列</h3>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="rounded border border-amber-200 bg-white px-2 py-1 text-xs"
              >
                <option value="">全部状态</option>
                <option value="pending">等待中</option>
                <option value="running">导入中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
              </select>
              <button onClick={fetchJobs} className="text-xs text-amber-600 hover:underline">刷新</button>
            </div>
          </div>
          {filteredJobs.length === 0 ? (
            <p className="py-4 text-center text-xs text-amber-500">暂无导入任务</p>
          ) : (
            <div className="space-y-2">
              {filteredJobs.slice(0, 20).map(job => (
                <div key={job.id} className="flex items-center gap-4 rounded bg-white px-3 py-2 text-sm shadow-sm">
                  <Link href={`/book/${job.bookId}`} className="min-w-0 flex-1 truncate font-medium text-gray-800 hover:text-amber-700">
                    {job.bookTitle || job.bookId}
                  </Link>
                  <span className="text-xs text-gray-400">{job.bookId}</span>
                  {job.status === 'running' ? (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${job.progress}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs text-gray-500">
                        {job.importedChapters}/{job.totalChapters}
                      </span>
                    </div>
                  ) : (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-700' :
                      job.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {JOB_STATUS_LABELS[job.status] || job.status}
                    </span>
                  )}
                  {job.error && (
                    <span className="text-xs text-red-500" title={job.error}>错误</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                <Th>质量</Th>
                <Th>操作</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                filteredBooks.map(book => (
                  <tr key={book.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/admin/books/${book.id}`} className="font-medium text-gray-900 hover:text-amber-700">
                        {book.title || book.titleCn || book.id}
                      </Link>
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
                      {book.reviewedAt ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          已审
                        </span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          待审
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/book/${book.id}`}
                          className="rounded-md bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          查看
                        </Link>
                        {book.dataSource === 'shidianguji' && (
                          <button
                            onClick={() => handleImport(book.id, book.title || book.titleCn || book.id)}
                            className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                            disabled={jobs.some(j => j.bookId === book.id && (j.status === 'pending' || j.status === 'running'))}
                          >
                            导入正文
                          </button>
                        )}
                      </div>
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

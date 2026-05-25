'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

interface BookDetail {
  id: string
  title: string
  titleCn: string | null
  alias: string | null
  author: string | null
  authorDynasty: string | null
  dynasty: string | null
  edition: string | null
  description: string | null
  quality: string
  dataSource: string
  coverUrl: string | null
  totalChapters: number
  contentCount: number
  reviewedAt: string | null
  reviewedBy: string | null
  _count: { chapters: number; bookmarks: number; histories: number; notes: number }
  category: { id: string; name: string; nameEn: string } | null
  createdAt: string
  updatedAt: string
}

interface ChapterItem {
  id: string
  bookId: string
  title: string
  chapterLevel: number
  orderNum: number
  wordCount: number
  hasMainContent: boolean
}

interface ChapterListResponse {
  success: boolean
  data: {
    chapters: ChapterItem[]
    pagination: { total: number; offset: number; limit: number }
  }
}

const QUALITY_OPTIONS = ['rough', 'polished']
const SOURCE_OPTIONS = ['shidianguji', 'manual']

export default function AdminBookEditPage() {
  const params = useParams()
  const bookId = params.id as string

  const [book, setBook] = useState<BookDetail | null>(null)
  const [chapters, setChapters] = useState<ChapterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [form, setForm] = useState({
    title: '',
    titleCn: '',
    author: '',
    authorDynasty: '',
    dynasty: '',
    edition: '',
    description: '',
    quality: 'rough',
    dataSource: 'shidianguji',
    coverUrl: '',
    reviewedAt: '',
    reviewedBy: '',
  })

  const fetchBook = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bookRes, chapterRes] = await Promise.all([
        fetch(`/api/admin/books/${bookId}`).then(r => r.json()),
        fetch(`/api/admin/books/${bookId}/chapters?limit=500`).then(r => r.json()),
      ])
      if (bookRes.success) {
        setBook(bookRes.data)
        setForm({
          title: bookRes.data.title || '',
          titleCn: bookRes.data.titleCn || '',
          author: bookRes.data.author || '',
          authorDynasty: bookRes.data.authorDynasty || '',
          dynasty: bookRes.data.dynasty || '',
          edition: bookRes.data.edition || '',
          description: bookRes.data.description || '',
          quality: bookRes.data.quality || 'rough',
          dataSource: bookRes.data.dataSource || 'shidianguji',
          coverUrl: bookRes.data.coverUrl || '',
          reviewedAt: bookRes.data.reviewedAt || '',
          reviewedBy: bookRes.data.reviewedBy || '',
        })
      } else {
        setError('加载书籍失败')
      }
      if (chapterRes.success) {
        setChapters(chapterRes.data.chapters)
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useEffect(() => { fetchBook() }, [fetchBook])

  async function handleSave() {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch(`/api/admin/books/${bookId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        setError('保存失败')
      }
    } catch {
      setError('保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (error && !book) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/books"
        className="mb-6 inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回书籍列表
      </Link>

      <h1 className="mb-8 font-serif text-2xl font-bold text-gray-900">
        {book?.title || book?.titleCn || '编辑书籍'}
      </h1>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {saveSuccess && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">保存成功</div>
      )}

      {/* Section 1: Basic Info */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">基本信息</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <InfoItem label="ID" value={book?.id} />
            <InfoItem label="书名" value={book?.title} />
            <InfoItem label="繁体名" value={book?.titleCn} />
            <InfoItem label="别名" value={book?.alias} />
            <InfoItem label="版本" value={book?.edition} />
          </dl>
        </CardContent>
      </Card>

      {/* Section 2: Edit Metadata */}
      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">编辑元数据</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="书名"
                id="title"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
              <Input
                label="繁体名"
                id="titleCn"
                value={form.titleCn}
                onChange={e => setForm(f => ({ ...f, titleCn: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="作者"
                id="author"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
              />
              <Input
                label="作者朝代"
                id="authorDynasty"
                value={form.authorDynasty}
                onChange={e => setForm(f => ({ ...f, authorDynasty: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="朝代"
                id="dynasty"
                value={form.dynasty}
                onChange={e => setForm(f => ({ ...f, dynasty: e.target.value }))}
              />
              <Input
                label="版本"
                id="edition"
                value={form.edition}
                onChange={e => setForm(f => ({ ...f, edition: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="description">
                描述
              </label>
              <textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="quality">
                  品质
                </label>
                <select
                  id="quality"
                  value={form.quality}
                  onChange={e => setForm(f => ({ ...f, quality: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {QUALITY_OPTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="dataSource">
                  数据来源
                </label>
                <select
                  id="dataSource"
                  value={form.dataSource}
                  onChange={e => setForm(f => ({ ...f, dataSource: e.target.value }))}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  {SOURCE_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">审定状态</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reviewedAt">
                    审定时间
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="reviewedAt"
                      type="datetime-local"
                      value={form.reviewedAt ? form.reviewedAt.slice(0, 16) : ''}
                      onChange={e => setForm(f => ({ ...f, reviewedAt: e.target.value ? new Date(e.target.value).toISOString() : '' }))}
                      className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    {!form.reviewedAt && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, reviewedAt: new Date().toISOString() }))}
                        className="whitespace-nowrap rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700"
                      >
                        标记已审
                      </button>
                    )}
                    {form.reviewedAt && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, reviewedAt: '' }))}
                        className="whitespace-nowrap rounded-lg bg-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-300"
                      >
                        清除
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="reviewedBy">
                    审定人
                  </label>
                  <input
                    id="reviewedBy"
                    type="text"
                    placeholder="审定人名称"
                    value={form.reviewedBy}
                    onChange={e => setForm(f => ({ ...f, reviewedBy: e.target.value }))}
                    className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
              {form.reviewedAt && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ 已于 {new Date(form.reviewedAt).toLocaleString('zh-CN')} 审定
                  {form.reviewedBy ? `（${form.reviewedBy}）` : ''}
                </p>
              )}
            </div>
            <Input
              label="封面URL"
              id="coverUrl"
              value={form.coverUrl}
              onChange={e => setForm(f => ({ ...f, coverUrl: e.target.value }))}
            />
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Chapter List */}
      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">
            章节列表
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({chapters.length})
            </span>
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50">
                <tr>
                  <Th>序号</Th>
                  <Th>标题</Th>
                  <Th>层级</Th>
                  <Th>有内容</Th>
                  <Th>字数</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {chapters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  chapters.map(ch => (
                    <tr key={ch.id} className="hover:bg-stone-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {ch.orderNum}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/chapters/${ch.id}`}
                          className="font-medium text-amber-800 hover:text-amber-600 hover:underline"
                        >
                          {ch.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {ch.chapterLevel}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={ch.hasMainContent ? 'success' : 'default'}>
                          {ch.hasMainContent ? '是' : '否'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {ch.wordCount || '-'}
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

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '-'}</dd>
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

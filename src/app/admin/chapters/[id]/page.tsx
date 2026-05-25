'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'

interface ChapterDetail {
  id: string
  bookId: string
  title: string
  chapterLevel: number
  chapterType: string
  parentId: string | null
  orderNum: number
  hasMainContent: boolean
  book: {
    id: string
    title: string
    titleCn: string | null
    author: string | null
    authorDynasty: string | null
    dynasty: string | null
    edition: string | null
    coverUrl: string | null
    quality: string
  }
  content: {
    content: string
    wordCount: number
    imageUrls: string[]
  } | null
  createdAt: string
  updatedAt: string
}

interface ChapterApiResponse {
  success: boolean
  data: ChapterDetail
}

export default function AdminChapterViewPage() {
  const params = useParams()
  const chapterId = params.id as string

  const [chapter, setChapter] = useState<ChapterDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/admin/chapters/${chapterId}`)
        const json: ChapterApiResponse = await res.json()
        if (json.success) {
          setChapter(json.data)
        } else {
          setError('加载章节失败')
        }
      } catch {
        setError('网络错误')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [chapterId])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  if (error || !chapter) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error || '加载失败'}</div>
      </div>
    )
  }

  const hasImages = chapter.content?.imageUrls && chapter.content.imageUrls.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/admin/chapters"
        className="mb-6 inline-flex items-center gap-1 text-sm text-amber-800 hover:text-amber-600"
      >
        <ArrowLeft className="h-4 w-4" />
        返回章节列表
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-900">{chapter.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          <Link
            href={`/admin/books/${chapter.bookId}`}
            className="text-amber-800 hover:text-amber-600 hover:underline"
          >
            {chapter.book?.title || chapter.book?.titleCn || chapter.bookId}
          </Link>
          {chapter.book?.author && ` · ${chapter.book.author}`}
        </p>
      </div>

      {/* Metadata Card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <MetaItem label="章节ID" value={chapter.id.slice(0, 12)} />
            <MetaItem label="层级" value={String(chapter.chapterLevel)} />
            <MetaItem label="排序" value={String(chapter.orderNum)} />
            <MetaItem label="字数" value={String(chapter.content?.wordCount ?? 0)} />
            <MetaItem label="有页面图片" value={hasImages ? '是' : '否'} />
          </dl>
        </CardContent>
      </Card>

      {/* Content Viewer */}
      <Card>
        <CardHeader>
          <h2 className="font-serif text-lg font-semibold text-gray-900">正文内容</h2>
        </CardHeader>
        <CardContent>
          {chapter.content?.content ? (
            <div className="reader-text font-serif leading-relaxed text-justify text-gray-800">
              {chapter.content.content.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="mb-4 text-base leading-7">{para}</p>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-400">暂无正文内容</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image URLs */}
      {hasImages && (
        <Card className="mt-6">
          <CardHeader>
            <h2 className="font-serif text-lg font-semibold text-gray-900">
              页面图片
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({chapter.content!.imageUrls.length} 张)
              </span>
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {chapter.content!.imageUrls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-stone-50"
                >
                  <img
                    src={url}
                    alt={`第 ${i + 1} 页`}
                    className="max-h-full max-w-full object-contain"
                    onError={e => {
                      const img = e.target as HTMLImageElement
                      img.style.display = 'none'
                      const fallback = document.createElement('div')
                      fallback.className = 'flex flex-col items-center justify-center p-4'
                      fallback.innerHTML = '<p class="text-xs text-gray-400">图片加载失败</p>'
                      img.parentElement?.appendChild(fallback)
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                    <ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                    {i + 1}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-400 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

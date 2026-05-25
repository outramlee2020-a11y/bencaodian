import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@/lib/auth'
import { getBookById, getChapters, getUserBookHistory } from '@/lib/db-service'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Clock, Layers, User, Users, ChevronRight, ChevronDown, ArrowRight } from 'lucide-react'

interface BookPageProps {
  params: Promise<{ id: string }>
}

/** Parse contributors from JSON string */
function parseContributors(data: string | any[] | null | undefined): any[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  try {
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** Recursively render a chapter tree */
function ChapterList({
  chapters,
  parentId,
  bookId,
  depth,
}: {
  chapters: any[]
  parentId: string | null
  bookId: string
  depth: number
}) {
  const children = chapters.filter((c) => c.parentId === parentId)
  if (children.length === 0) return null

  return (
    <ul className={depth > 0 ? 'ml-4 border-l border-amber-100 pl-3' : ''}>
      {children.map((chapter) => {
        const hasChildren = chapters.some((c) => c.parentId === chapter.id)
        return (
          <li key={chapter.id}>
            <Link
              href={`/book/${bookId}/chapter/${chapter.id}`}
              className={`flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-amber-50 rounded-lg ${
                depth === 0 ? 'font-medium text-gray-900' : 'text-gray-600'
              }`}
            >
              <span className="flex items-center gap-2">
                {hasChildren && <ChevronDown className="h-3 w-3 text-gray-300" />}
                <span>{chapter.title}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
            </Link>
            {hasChildren && (
              <ChapterList
                chapters={chapters}
                parentId={chapter.id}
                bookId={bookId}
                depth={depth + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default async function BookDetailPage({ params }: BookPageProps) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id

  const [book, chapters] = await Promise.all([
    getBookById(id),
    getChapters(id),
  ])

  if (!book) {
    notFound()
  }

  // Find first chapter for "start reading" link
  const firstChapter = chapters[0] || null

  // Fetch reading history for logged-in user
  const history = userId ? await getUserBookHistory(userId, id) : null

  // Count chapters by level for stats
  const level1Count = chapters.filter((c: any) => c.level === 1).length
  const totalChapters = chapters.length

  // Determine "resume reading" chapter
  const resumeChapter = history?.chapterId
    ? chapters.find((c: any) => c.id === history.chapterId) || firstChapter
    : firstChapter

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-amber-700">首页</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/library" className="hover:text-amber-700">书库</Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/library?category=${book.category.id}`}
          className="hover:text-amber-700"
        >
          {book.category.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-900">{book.titleCn || book.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Cover & Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            {/* Cover */}
            <div className="relative aspect-[3/4] w-full max-w-xs mx-auto overflow-hidden rounded-xl bg-amber-50 shadow-lg">
              {book.coverUrl && !book.coverUrl.includes('default') && !book.coverUrl.includes('lf-welfare') ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="300px"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="mx-auto h-16 w-16 text-amber-300" />
                    <div className="mt-4 font-serif text-7xl text-amber-200">
                      {book.title.charAt(0)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              {resumeChapter && (
                <Link href={`/book/${book.id}/chapter/${resumeChapter.id}`}>
                  <Button variant="primary" size="lg" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    {history ? '继续阅读' : '开始阅读'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Reading progress (logged-in users only) */}
            {history && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-amber-800">阅读进度</span>
                  <span className="text-xs text-amber-600">{Math.round(history.progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-amber-200/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-600 transition-all"
                    style={{ width: `${Math.min(100, Math.round(history.progress))}%` }}
                  />
                </div>
                {history.chapter && (
                  <p className="mt-2 text-xs text-amber-700 truncate">
                    上次读到：{history.chapter.title}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-amber-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(history.lastReadAt).toLocaleDateString('zh-CN', {
                    month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
                <Link
                  href={`/book/${book.id}/chapter/${history.chapterId}`}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
                >
                  继续上次阅读 <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {/* Metadata */}
            <div className="mt-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              {book.author && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">
                    {book.authorDynasty && `${book.authorDynasty} · `}{book.author}
                  </span>
                </div>
              )}
              {book.dynasty && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{book.dynasty}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Layers className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {level1Count > 0 ? `${level1Count} 卷 · ` : ''}
                  {totalChapters} 章节
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="primary">{book.category.name}</Badge>
                {book.subcategory && <Badge>{book.subcategory}</Badge>}
                <Badge variant={book.quality === 'polished' ? 'success' : 'warning'}>
                  {book.quality === 'polished' ? '精校' : '粗校'}
                </Badge>
                {book.reviewedAt ? (
                  <Badge variant="success" className="border-green-400 bg-green-50 text-green-700">
                    已审
                  </Badge>
                ) : (
                  <Badge variant="default" className="bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-300">
                    待审
                  </Badge>
                )}
              </div>
              {book.reviewedAt && (
                <p className="mt-1 text-[10px] text-gray-400">
                  审定时间：{new Date(book.reviewedAt).toLocaleDateString('zh-CN')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Info & Chapters */}
        <div className="lg:col-span-2">
          {/* Title & Description */}
          <div>
            <h1 className="font-serif text-3xl font-bold text-gray-900">
              {book.titleCn || book.title}
            </h1>
            {book.titleCn !== book.title && (
              <p className="mt-1 text-base text-gray-400">{book.title}</p>
            )}
            {book.description && (
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                {book.description}
              </p>
            )}
            {book.edition && (
              <p className="mt-2 text-xs text-gray-400">
                版本：{book.edition}
              </p>
            )}

            {/* Team & Contributors */}
            {book.teamName && (
              <div className="mt-6 rounded-lg bg-amber-50/60 border border-amber-100 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800 mb-2">
                  <Users className="h-4 w-4" />
                  <span>整理团队</span>
                </div>
                <p className="text-sm text-gray-700">{book.teamName}</p>
                {(book.contributors ? parseContributors(book.contributors) : []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {parseContributors(book.contributors).map((c: any, i: number) => (
                      <Badge key={i} variant="info" className="text-xs">
                        {c.name || c.userName || c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chapter List */}
          <div className="mt-10">
            <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
              目录
              <span className="ml-2 text-sm font-normal text-gray-400">
                （共 {totalChapters} 章节）
              </span>
            </h2>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {totalChapters > 0 ? (
                <ChapterList
                  chapters={chapters}
                  parentId={null}
                  bookId={book.id}
                  depth={0}
                />
              ) : (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  暂无目录数据
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

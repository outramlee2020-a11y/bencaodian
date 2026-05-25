'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X, BookOpen, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const categories = [
  { id: 'all', name: '全部' },
  { id: 'jing', name: '经部' },
  { id: 'shi', name: '史部' },
  { id: 'zi', name: '子部' },
  { id: 'ji', name: '集部' },
  { id: 'fo', name: '佛教部' },
  { id: 'dao', name: '道教部' },
]

interface SearchResultChapter {
  chapterId: string
  bookId: string
  bookTitle: string
  chapterTitle: string
  snippet: string
  matchCount: number
}

interface SearchResultBook {
  id: string
  title: string
  author: string
  authorDynasty: string
  description: string
  quality: string
  dynasty: string
}

interface SearchPageClientProps {
  initialQuery: string
  initialCategory: string
  initialBooks: SearchResultBook[]
  initialBookTotal: number
  initialChapters: SearchResultChapter[]
  initialChapterTotal: number
}

export function SearchPageClient({
  initialQuery,
  initialCategory,
  initialBooks,
  initialBookTotal,
  initialChapters,
  initialChapterTotal,
}: SearchPageClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'time'>('relevance')
  const [fuzzy, setFuzzy] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'books' | 'chapters'>('all')

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (category !== 'all') params.set('category', category)
      params.set('sort', sortBy)
      if (fuzzy) params.set('fuzzy', '1')
      router.push(`/search?${params.toString()}`)
    },
    [query, category, sortBy, fuzzy, router]
  )

  const clearFilters = () => {
    setCategory('all')
    setSortBy('relevance')
    setFuzzy(true)
    setActiveTab('all')
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
  }

  const hasFilters = category !== 'all' || sortBy !== 'relevance' || !fuzzy
  const totalResults = initialBookTotal + initialChapterTotal

  /** Highlight keyword in text */
  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text
    const parts = text.split(new RegExp(`(${escapeRegex(keyword)})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase()
        ? <mark key={i} className="rounded-sm bg-amber-200 px-0.5 text-amber-900">{part}</mark>
        : part
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">古籍搜索</h1>
        <p className="mt-1 text-sm text-gray-500">
          全文检索 {totalResults > 0 ? `找到 ${initialBookTotal} 部书 · ${initialChapterTotal} 条内容匹配` : ''}
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入关键词搜索古籍全文..."
              className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-base shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>
          <Button type="submit" size="lg">
            搜索
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'border-amber-300 bg-amber-50' : ''}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">高级筛选</h3>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-600"
              >
                <X className="h-3 w-3" />
                清除筛选
              </button>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-600">古籍分类</label>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      category === cat.id
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-600">排序方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('relevance')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    sortBy === 'relevance'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  按相关度
                </button>
                <button
                  onClick={() => setSortBy('time')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    sortBy === 'time'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  按时间
                </button>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-600">搜索选项</label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fuzzy}
                  onChange={(e) => setFuzzy(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-amber-700 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-600">模糊搜索</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasFilters && !showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">当前筛选：</span>
          {category !== 'all' && (
            <Badge variant="primary">
              分类：{categories.find((c) => c.id === category)?.name}
              <button onClick={() => setCategory('all')} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortBy !== 'relevance' && (
            <Badge>排序：按时间</Badge>
          )}
        </div>
      )}

      {/* Tabs: All / Books / Chapters */}
      {initialQuery && totalResults > 0 && (
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
          {(['all', 'books', 'chapters'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'all' && `全部(${totalResults})`}
              {tab === 'books' && `书籍(${initialBookTotal})`}
              {tab === 'chapters' && `章节(${initialChapterTotal})`}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {initialQuery && (
        <div className="mt-2">
          {totalResults === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="h-12 w-12 mb-4" />
              <p className="text-base">未找到相关结果</p>
              <p className="mt-1 text-sm">试试更换关键词或调整筛选条件</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Book Results */}
              {(activeTab === 'all' || activeTab === 'books') && initialBooks.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      相关古籍（{initialBookTotal}）
                    </h2>
                  )}
                  <div className="space-y-3">
                    {initialBooks.map((result) => (
                      <Link
                        key={result.id}
                        href={`/book/${result.id}`}
                        className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-200"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-serif font-semibold text-gray-900">
                              {highlightText(result.title, query)}
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {result.authorDynasty}·{result.author}
                            </p>
                          </div>
                          <Badge variant={result.quality === 'polished' ? 'success' : 'warning'}>
                            {result.quality === 'polished' ? '精校' : '粗校'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                          {highlightText(result.description?.slice(0, 200) || '', query)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <span>{result.dynasty}</span>
                          {result.dynasty && <span>·</span>}
                          <span className="flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" />
                            查看详情
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Chapter Content Results */}
              {(activeTab === 'all' || activeTab === 'chapters') && initialChapters.length > 0 && (
                <section>
                  {activeTab === 'all' && (
                    <h2 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      内容匹配（{initialChapterTotal}）
                    </h2>
                  )}
                  <div className="space-y-3">
                    {initialChapters.map((result, idx) => (
                      <Link
                        key={`${result.chapterId}-${idx}`}
                        href={`/book/${result.bookId}/chapter/${result.chapterId}?highlight=${encodeURIComponent(query)}`}
                        className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="font-serif font-semibold text-gray-900 truncate">
                              {result.bookTitle}
                            </h3>
                            <p className="mt-0.5 text-sm text-amber-700">
                              {result.chapterTitle}
                            </p>
                          </div>
                          <Badge variant="info" className="ml-3 flex-shrink-0">
                            {result.matchCount} 处匹配
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600">
                          {highlightText(result.snippet, query)}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                          <FileText className="h-3 w-3" />
                          <span>{result.chapterTitle}</span>
                          <ChevronRight className="h-3 w-3" />
                          <span>阅读此章节</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      )}

      {/* No query state */}
      {!initialQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search className="h-16 w-16 mb-4" />
          <p className="text-lg">输入关键词开始搜索</p>
          <p className="mt-1 text-sm">支持书名、作者、全文内容检索，结果高亮显示</p>
        </div>
      )}
    </div>
  )
}

/** Escape regex special characters */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

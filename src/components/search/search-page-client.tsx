'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X } from 'lucide-react'

const categories = [
  { id: 'all', name: '全部' },
  { id: 'jing', name: '经部' },
  { id: 'shi', name: '史部' },
  { id: 'zi', name: '子部' },
  { id: 'ji', name: '集部' },
  { id: 'fo', name: '佛教部' },
  { id: 'dao', name: '道教部' },
]

const dynasties = [
  '全部',
  '战国',
  '东汉',
  '晋代',
  '唐代',
  '宋代',
  '明代',
  '清代',
]

interface SearchPageClientProps {
  initialQuery: string
  initialCategory: string
  initialResults: any[]
  initialTotal: number
}

export function SearchPageClient({
  initialQuery,
  initialCategory,
  initialResults,
  initialTotal,
}: SearchPageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'relevance' | 'time'>('relevance')
  const [fuzzy, setFuzzy] = useState(true)

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
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    router.push(`/search?${params.toString()}`)
  }

  const hasFilters = category !== 'all' || sortBy !== 'relevance' || !fuzzy

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">古籍搜索</h1>
        <p className="mt-1 text-sm text-gray-500">
          全文检索 {initialTotal > 0 ? `${initialTotal.toLocaleString()} 条结果` : ''}
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

      {/* Results */}
      {initialQuery && (
        <div className="mt-2">
          {initialResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search className="h-12 w-12 mb-4" />
              <p className="text-base">未找到相关结果</p>
              <p className="mt-1 text-sm">试试更换关键词或调整筛选条件</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                找到约 {initialTotal} 条结果
              </p>
              {initialResults.map((result: any, idx: number) => (
                <a
                  key={idx}
                  href={`/book/${result.bookId}`}
                  className="block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-amber-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-serif font-semibold text-gray-900">
                        {result.titleCn || result.title}
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
                    {result.snippet || result.description?.slice(0, 200)}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span>{result.dynasty}</span>
                    <span>·</span>
                    <span>{result.edition?.slice(0, 20)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No query state */}
      {!initialQuery && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Search className="h-16 w-16 mb-4" />
          <p className="text-lg">输入关键词开始搜索</p>
          <p className="mt-1 text-sm">支持书名、作者、全文内容检索</p>
        </div>
      )}
    </div>
  )
}

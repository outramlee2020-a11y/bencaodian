import { Suspense } from 'react'
import { getBooks, getCategories } from '@/lib/db-service'
import { BookGrid } from '@/components/book/book-grid'
import Link from 'next/link'

interface LibraryPageProps {
  searchParams: Promise<{
    category?: string
    subcategory?: string
  }>
}

async function LibraryContent({ searchParams }: LibraryPageProps) {
  const params = await searchParams
  const activeCategory = params.category || 'all'
  const activeSubcategory = params.subcategory || ''
  const categories = getCategories()
  const books = await getBooks(activeCategory === 'all' ? undefined : activeCategory)

  const filteredBooks = activeSubcategory
    ? books.filter(b => b.subcategory === activeSubcategory)
    : books

  const subcategories: string[] = activeCategory !== 'all'
    ? [...new Set(books.map(b => b.subcategory).filter((s): s is string => !!s))]
    : []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">古籍书库</h1>
        <p className="mt-1 text-sm text-gray-500">
          共收录 {books.length} 部中医经典古籍
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/library"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeCategory === 'all'
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/library?category=${cat.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Subcategory filters */}
      {subcategories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={`/library?category=${activeCategory}`}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              !activeSubcategory
                ? 'bg-amber-50 text-amber-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            全部
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub}
              href={`/library?category=${activeCategory || ''}&subcategory=${encodeURIComponent(sub)}`}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                activeSubcategory === sub
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              {sub}
            </Link>
          ))}
        </div>
      )}

      {/* Book Grid */}
      {filteredBooks.length > 0 ? (
        <BookGrid books={filteredBooks} />
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400">暂未收录相关古籍</p>
        </div>
      )}
    </div>
  )
}

export default function LibraryPage(props: LibraryPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="mb-8 h-8 w-48 rounded bg-gray-200" />
            <div className="mb-6 flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-16 rounded-full bg-gray-100" />
              ))}
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <LibraryContent searchParams={props.searchParams} />
    </Suspense>
  )
}

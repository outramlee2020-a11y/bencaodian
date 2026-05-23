import { Suspense } from 'react'
import { SearchPageClient } from '@/components/search/search-page-client'
import { searchBooks } from '@/lib/db-service'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    sort?: string
    fuzzy?: string
  }>
}

async function SearchPageInner({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const query = params.q || ''
  const category = params.category || 'all'
  const sort = params.sort || 'relevance'

  let results: any[] = []
  let total = 0

  if (query) {
    const filtered = await searchBooks(query, category)
    results = filtered
    total = filtered.length
  }

  return (
    <SearchPageClient
      initialQuery={query}
      initialCategory={category}
      initialResults={results}
      initialTotal={total}
    />
  )
}

export default function SearchPage(props: SearchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 h-10 w-full max-w-xl rounded-full bg-gray-100 animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      }
    >
      <SearchPageInner searchParams={props.searchParams} />
    </Suspense>
  )
}

import type { Book } from '@/types'
import { BookCard } from './book-card'

interface BookGridProps {
  books: Book[]
  variant?: 'default' | 'compact'
  columns?: 2 | 3 | 4 | 5
}

const gridCols = {
  2: 'grid-cols-2 sm:grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
}

export function BookGrid({ books, variant = 'default', columns = 4 }: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <p className="text-sm">暂无古籍数据</p>
      </div>
    )
  }

  return (
    <div className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} variant={variant} />
      ))}
    </div>
  )
}

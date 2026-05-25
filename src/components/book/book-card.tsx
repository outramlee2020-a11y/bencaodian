import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { Book } from '@/types'

interface BookCardProps {
  book: Book
  variant?: 'default' | 'compact'
}

export function BookCard({ book, variant = 'default' }: BookCardProps) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/book/${book.id}`}
        className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-amber-200"
      >
        {/* Cover */}
        <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-amber-50">
          {book.coverUrl && !book.coverUrl.includes('default') ? (
            <Image
              src={book.coverUrl}
              alt={book.title}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl font-serif text-amber-300">
              {book.title.charAt(0)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base font-semibold text-gray-900 group-hover:text-amber-800 truncate">
            {book.titleCn || book.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {book.authorDynasty}·{book.author}
          </p>
          <p className="mt-1 line-clamp-2 text-xs text-gray-500">{book.description}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/book/${book.id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-amber-200 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-amber-50">
        {book.coverUrl && !book.coverUrl.includes('default') ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="font-serif text-5xl text-amber-300">
                {book.title.charAt(0)}
              </div>
              <div className="mt-2 text-xs text-amber-200">
                {book.category.name}
              </div>
            </div>
          </div>
        )}

        {/* Quality & review badges */}
        <div className="absolute right-2 top-2 flex flex-col gap-1">
          <Badge
            variant={book.quality === 'polished' ? 'success' : 'warning'}
          >
            {book.quality === 'polished' ? '精校' : '粗校'}
          </Badge>
          {book.reviewedAt ? (
            <Badge variant="success" className="border-green-400 bg-green-50 text-green-700">
              已审
            </Badge>
          ) : (
            <Badge variant="default" className="bg-white/80 text-gray-400 ring-1 ring-inset ring-gray-300">
              待审
            </Badge>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-base font-semibold text-gray-900 group-hover:text-amber-800 line-clamp-1">
          {book.titleCn || book.title}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">
          {book.authorDynasty}·{book.author}
        </p>
        <p className="mt-2 line-clamp-2 text-xs text-gray-500 flex-1">
          {book.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-gray-400">{book.edition?.slice(0, 12)}</span>
          <Badge variant="primary">{book.subcategory || book.category.name}</Badge>
        </div>
      </div>
    </Link>
  )
}

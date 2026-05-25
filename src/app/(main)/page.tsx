import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { HeroBanner } from '@/components/home/hero-banner'
import { BookGrid } from '@/components/book/book-grid'
import { getFeaturedBooks, getBooksByCategory, getUserRecentHistory } from '@/lib/db-service'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default async function HomePage() {
  const session = await auth()
  const userId = session?.user?.id

  const [featuredBooks, medicalBooks] = await Promise.all([
    getFeaturedBooks(),
    getBooksByCategory('zi'),
  ])

  // Fetch recent reading history if logged in
  const recentHistory = userId ? await getUserRecentHistory(userId, 6) : []

  return (
    <div>
      <HeroBanner />

      {/* Continue Reading — only for logged-in users with history */}
      {recentHistory.length > 0 && (
        <section className="bg-amber-50/40 border-b border-amber-100">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-amber-700" />
                <h2 className="font-serif text-xl font-bold text-gray-900">继续阅读</h2>
              </div>
              <Link
                href="/profile/history"
                className="flex items-center gap-1 text-sm font-medium text-amber-800 hover:text-amber-600 transition-colors"
              >
                阅读历史
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentHistory.map((h) => (
                <Link
                  key={h.id}
                  href={h.chapterId
                    ? `/book/${h.bookId}/chapter/${h.chapterId}`
                    : `/book/${h.bookId}`
                  }
                  className="group flex items-center gap-4 rounded-xl border border-amber-200/60 bg-white p-4 shadow-sm hover:shadow-md hover:border-amber-300 transition-all"
                >
                  {/* Mini cover */}
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-amber-50">
                    {h.book.coverUrl && !h.book.coverUrl.includes('default') ? (
                      <Image
                        src={h.book.coverUrl}
                        alt={h.book.title}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-lg text-amber-300 font-serif">
                        {h.book.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate group-hover:text-amber-800 transition-colors">
                      {h.book.titleCn || h.book.title}
                    </p>
                    {h.chapter && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        上次阅读：{h.chapter.title}
                      </p>
                    )}
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: `${Math.round(h.progress)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {Math.round(h.progress)}%
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(h.lastReadAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Books */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-gray-900">精选古籍</h2>
            <p className="mt-1 text-sm text-gray-500">精校版本，优先推荐</p>
          </div>
          <Link
            href="/library"
            className="text-sm font-medium text-amber-800 hover:text-amber-600 transition-colors"
          >
            浏览全部 →
          </Link>
        </div>
        <BookGrid books={featuredBooks} />
      </section>

      {/* Medical Books */}
      <section className="bg-stone-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl font-bold text-gray-900">医家典籍</h2>
              <p className="mt-1 text-sm text-gray-500">
                共收录 {medicalBooks.length} 部中医经典古籍
              </p>
            </div>
            <Link
              href="/library?category=zi"
              className="text-sm font-medium text-amber-800 hover:text-amber-600 transition-colors"
            >
              更多医书 →
            </Link>
          </div>
          <BookGrid books={medicalBooks.slice(0, 8)} />
        </div>
      </section>

      {/* TCM Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-8">分类浏览</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: '/library?category=all',
              title: '全部古籍',
              desc: `${medicalBooks.length} 部经典`,
              color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
              icon: '📚',
            },
            {
              href: '/library?subcategory=医家',
              title: '本草类',
              desc: '本草、药性、食疗等',
              color: 'bg-green-50 border-green-200 hover:bg-green-100',
              icon: '🌿',
            },
            {
              href: '/library?subcategory=伤寒',
              title: '伤寒金匮',
              desc: '伤寒论、金匮要略等',
              color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
              icon: '📖',
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`group rounded-xl border-2 p-6 transition-all ${item.color}`}
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-serif text-lg font-semibold text-gray-900 group-hover:text-amber-800 transition-colors">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

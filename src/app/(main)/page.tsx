import { HeroBanner } from '@/components/home/hero-banner'
import { BookGrid } from '@/components/book/book-grid'
import { getFeaturedBooks, getBooksByCategory } from '@/lib/db-service'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

export default async function HomePage() {
  const [featuredBooks, medicalBooks] = await Promise.all([
    getFeaturedBooks(),
    getBooksByCategory('zi'),
  ])

  return (
    <div>
      <HeroBanner />

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

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Search, BookOpen, Sparkles } from 'lucide-react'

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-amber-800 to-stone-900">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            本草典
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-amber-100/80 sm:text-xl">
            中医古籍数字化平台
            <br />
            让千年本草智慧，触手可及
          </p>

          {/* Search */}
          <div className="mt-10 mx-auto max-w-2xl">
            <form action="/search" method="GET" className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300" />
                <input
                  name="q"
                  type="text"
                  placeholder="搜索古籍、方剂、本草..."
                  className="h-14 w-full rounded-xl border-0 bg-white/10 pl-12 pr-4 text-base text-white placeholder-amber-200/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="bg-amber-500 text-amber-900 hover:bg-amber-400"
              >
                搜索
              </Button>
            </form>
          </div>

          {/* Quick features */}
          <div className="mt-12 flex flex-wrap justify-center gap-6">
            {[
              { icon: BookOpen, label: '6,000+ 部古籍' },
              { icon: Search, label: '全文检索' },
              { icon: Sparkles, label: 'AI 智能辅助' },
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.label}
                  className="flex items-center gap-2 text-sm text-amber-200/70"
                >
                  <Icon className="h-4 w-4" />
                  {feature.label}
                </div>
              )
            })}
          </div>

          {/* Quick links */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/library?category=zi&subcategory=医家"
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-amber-100 hover:bg-white/20 transition-colors"
            >
              医家
            </Link>
            <Link
              href="/library?category=jing"
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-amber-100 hover:bg-white/20 transition-colors"
            >
              经部
            </Link>
            <Link
              href="/library?category=shi"
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-amber-100 hover:bg-white/20 transition-colors"
            >
              史部
            </Link>
            <Link
              href="/library?category=ji"
              className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-amber-100 hover:bg-white/20 transition-colors"
            >
              集部
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

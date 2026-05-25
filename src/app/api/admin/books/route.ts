import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'
import type { Prisma } from '@/generated/prisma/client'

export async function GET(request: NextRequest) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const source = searchParams.get('source')
  const search = searchParams.get('search')
  const quality = searchParams.get('quality')
  const filter = searchParams.get('filter')
  const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)
  const offset = Number(searchParams.get('offset') || '0')

  try {
    const where: Prisma.BookWhereInput = {}
    if (source) where.dataSource = source
    if (quality) where.quality = quality
    if (filter === 'no-content') {
      where.chapters = { none: { content: { isNot: null } } }
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { author: { contains: search } },
      ]
    }

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { chapters: true } },
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.book.count({ where }),
    ])

    const [bookCount, chapterCount, contentCount, categoryCount] = await Promise.all([
      prisma.book.count(),
      prisma.chapter.count(),
      prisma.pageContent.count(),
      prisma.category.count(),
    ])

    return NextResponse.json({
      success: true,
      data: {
        books: books.map(b => ({
          id: b.id,
          title: b.title,
          titleCn: b.titleCn,
          author: b.author,
          authorDynasty: b.authorDynasty,
          dynasty: b.dynasty,
          edition: b.edition,
          categoryId: b.categoryId,
          category: b.category,
          quality: b.quality,
          dataSource: b.dataSource,
          totalChapters: b.totalChapters,
          chapterCount: b._count.chapters,
          coverUrl: b.coverUrl,
          beautifulCover: b.beautifulCover,
          reviewedAt: b.reviewedAt?.toISOString?.() || null,
          reviewedBy: b.reviewedBy || null,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
        })),
        stats: {
          books: bookCount,
          chapters: chapterCount,
          pageContents: contentCount,
          categories: categoryCount,
        },
        pagination: {
          total,
          offset,
          limit,
        },
      },
    })
  } catch (error) {
    console.error('Admin books API error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

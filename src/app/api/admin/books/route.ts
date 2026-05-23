/**
 * Admin API: list all books from the database
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const dataSource = searchParams.get('source')
  const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)
  const offset = Number(searchParams.get('offset') || '0')

  try {
    const where = dataSource ? { dataSource } : {}
    
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          _count: { select: { chapters: true } },
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
          dataSource: b.dataSource,
          totalChapters: b.totalChapters,
          chapterCount: b._count.chapters,
          createdAt: b.createdAt,
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

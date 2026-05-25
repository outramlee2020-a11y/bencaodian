import { NextRequest, NextResponse } from 'next/server'
import type { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')
  const search = searchParams.get('search')
  const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)
  const offset = Number(searchParams.get('offset') || '0')

  try {
    const where: Prisma.ChapterWhereInput = {}
    if (bookId) where.bookId = bookId
    if (search) where.title = { contains: search }

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where,
        orderBy: { orderNum: 'asc' },
        take: limit,
        skip: offset,
        include: {
          book: { select: { id: true, title: true } },
          content: { select: { wordCount: true } },
        },
      }),
      prisma.chapter.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        chapters: chapters.map(ch => ({
          id: ch.id,
          bookId: ch.bookId,
          book: ch.book,
          title: ch.title,
          chapterLevel: ch.chapterLevel,
          orderNum: ch.orderNum,
          wordCount: ch.content?.wordCount ?? 0,
          hasMainContent: ch.hasMainContent,
        })),
        pagination: { total, offset, limit },
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

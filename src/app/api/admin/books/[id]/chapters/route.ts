import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') || '200'), 500)
    const offset = Number(searchParams.get('offset') || '0')

    const [chapters, total] = await Promise.all([
      prisma.chapter.findMany({
        where: { bookId: id },
        orderBy: { orderNum: 'asc' },
        take: limit,
        skip: offset,
        include: {
          content: { select: { wordCount: true } },
        },
      }),
      prisma.chapter.count({ where: { bookId: id } }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        chapters: chapters.map(ch => ({
          id: ch.id,
          bookId: ch.bookId,
          title: ch.title,
          chapterLevel: ch.chapterLevel,
          chapterType: ch.chapterType,
          parentId: ch.parentId,
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

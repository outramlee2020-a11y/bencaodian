import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET() {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const [
      books,
      chapters,
      pageContents,
      categories,
      users,
      contentBooks,
      booksByQuality,
      recentBooks,
      reviewedCount,
      importJobs,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.chapter.count(),
      prisma.pageContent.count(),
      prisma.category.count(),
      prisma.user.count(),
      prisma.book.count({
        where: { chapters: { some: { content: { isNot: null } } } },
      }),
      prisma.book.groupBy({
        by: ['quality'],
        _count: true,
      }),
      prisma.book.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, author: true, quality: true, createdAt: true },
      }),
      prisma.book.count({ where: { reviewedAt: { not: null } } }),
      prisma.importJob.groupBy({
        by: ['status'],
        _count: true,
      }),
    ])

    const pendingReview = books - reviewedCount

    return NextResponse.json({
      success: true,
      data: {
        books,
        chapters,
        pageContents,
        categories,
        users,
        contentBooks,
        booksByQuality,
        recentBooks,
        reviewedCount,
        pendingReview,
        importJobs,
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

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/history - Get user's reading history
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const history = await prisma.readingHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { lastReadAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ success: true, data: history })
}

// POST /api/history - Update reading progress
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { bookId, chapterId, pageNumber, progress } = await request.json()

    if (!bookId) {
      return NextResponse.json({ success: false, error: 'bookId 为必填项' }, { status: 400 })
    }

    // Upsert: update if exists, create if not
    const existing = await prisma.readingHistory.findFirst({
      where: {
        userId: session.user.id,
        bookId,
      },
    })

    if (existing) {
      const updated = await prisma.readingHistory.update({
        where: { id: existing.id },
        data: {
          chapterId: chapterId || existing.chapterId,
          pageNumber: pageNumber ?? existing.pageNumber,
          progress: progress ?? existing.progress,
          lastReadAt: new Date(),
        },
      })
      return NextResponse.json({ success: true, data: updated })
    }

    const history = await prisma.readingHistory.create({
      data: {
        userId: session.user.id,
        bookId,
        chapterId: chapterId || null,
        pageNumber: pageNumber || null,
        progress: progress ?? 0,
      },
    })

    return NextResponse.json({ success: true, data: history }, { status: 201 })
  } catch (error) {
    console.error('Update history error:', error)
    return NextResponse.json({ success: false, error: '更新阅读记录失败' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/user - Get current user profile with stats
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      _count: {
        select: {
          bookmarks: true,
          notes: true,
          histories: true,
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json({ success: false, error: '用户不存在' }, { status: 404 })
  }

  const recentHistory = await prisma.readingHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { lastReadAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({
    success: true,
    data: {
      ...user,
      recentHistory,
    },
  })
}

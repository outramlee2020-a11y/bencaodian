import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { guardAdminApi } from '@/lib/admin-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            bookmarks: true,
            histories: true,
            notes: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const [recentBookmarks, recentHistory] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { book: { select: { id: true, title: true } } },
      }),
      prisma.readingHistory.findMany({
        where: { userId: id },
        orderBy: { lastReadAt: 'desc' },
        take: 5,
        include: {
          book: { select: { id: true, title: true } },
          chapter: { select: { id: true, title: true } },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        recentBookmarks,
        recentHistories: recentHistory,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await guardAdminApi()
  if (unauthorized) return unauthorized

  try {
    const { id } = await params
    const body = await request.json()

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(body.role !== undefined && { role: body.role }),
        ...(body.name !== undefined && { name: body.name }),
      },
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

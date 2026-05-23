import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/bookmarks - Get user's bookmarks
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  const where = { userId: session.user.id } as any
  if (bookId) where.bookId = bookId

  const bookmarks = await prisma.bookmark.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: bookmarks })
}

// POST /api/bookmarks - Create a bookmark
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { bookId, chapterId, pageNumber, text, note } = await request.json()

    if (!bookId) {
      return NextResponse.json({ success: false, error: 'bookId 为必填项' }, { status: 400 })
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        bookId,
        chapterId: chapterId || null,
        pageNumber: pageNumber || null,
        text: text || null,
        note: note || null,
      },
    })

    return NextResponse.json({ success: true, data: bookmark }, { status: 201 })
  } catch (error) {
    console.error('Create bookmark error:', error)
    return NextResponse.json({ success: false, error: '创建书签失败' }, { status: 500 })
  }
}

// DELETE /api/bookmarks?id=xxx - Delete a bookmark
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少书签ID' }, { status: 400 })
  }

  const bookmark = await prisma.bookmark.findUnique({ where: { id } })
  if (!bookmark || bookmark.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: '书签不存在' }, { status: 404 })
  }

  await prisma.bookmark.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

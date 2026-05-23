import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notes - Get user's notes
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')
  const chapterId = searchParams.get('chapterId')

  const where: any = { userId: session.user.id }
  if (bookId) where.bookId = bookId
  if (chapterId) where.chapterId = chapterId

  const notes = await prisma.note.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: notes })
}

// POST /api/notes - Create a note
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { bookId, chapterId, text, pageNumber } = await request.json()

    if (!bookId || !text) {
      return NextResponse.json({ success: false, error: 'bookId 和 text 为必填项' }, { status: 400 })
    }

    const note = await prisma.note.create({
      data: {
        userId: session.user.id,
        bookId,
        chapterId: chapterId || null,
        text,
        pageNumber: pageNumber || null,
      },
    })

    return NextResponse.json({ success: true, data: note }, { status: 201 })
  } catch (error) {
    console.error('Create note error:', error)
    return NextResponse.json({ success: false, error: '创建笔记失败' }, { status: 500 })
  }
}

// PATCH /api/notes - Update a note
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { id, text } = await request.json()

    if (!id || !text) {
      return NextResponse.json({ success: false, error: 'id 和 text 为必填项' }, { status: 400 })
    }

    const note = await prisma.note.findUnique({ where: { id } })
    if (!note || note.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: '笔记不存在' }, { status: 404 })
    }

    const updated = await prisma.note.update({
      where: { id },
      data: { text },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update note error:', error)
    return NextResponse.json({ success: false, error: '更新笔记失败' }, { status: 500 })
  }
}

// DELETE /api/notes?id=xxx - Delete a note
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少笔记ID' }, { status: 400 })
  }

  const note = await prisma.note.findUnique({ where: { id } })
  if (!note || note.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: '笔记不存在' }, { status: 404 })
  }

  await prisma.note.delete({ where: { id } })

  return NextResponse.json({ success: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/highlights?bookId=xxx&chapterId=xxx
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')
  const chapterId = searchParams.get('chapterId')

  const where: Record<string, unknown> = { userId: session.user.id }
  if (bookId) where.bookId = bookId
  if (chapterId) where.chapterId = chapterId

  const highlights = await prisma.highlight.findMany({
    where,
    orderBy: [{ paragraphIndex: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json({ success: true, data: highlights })
}

// POST /api/highlights - Create a highlight
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { bookId, chapterId, text, paragraphIndex, color } = await request.json()

    if (!bookId || !chapterId || !text || paragraphIndex === undefined) {
      return NextResponse.json({ success: false, error: '缺少必填字段' }, { status: 400 })
    }

    // Check for duplicate (same user, same chapter, same paragraph, same text)
    const existing = await prisma.highlight.findFirst({
      where: {
        userId: session.user.id,
        chapterId,
        paragraphIndex,
        text,
      },
    })
    if (existing) {
      // Toggle off: delete existing highlight
      await prisma.highlight.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, data: null, toggled: false })
    }

    const highlight = await prisma.highlight.create({
      data: {
        userId: session.user.id,
        bookId,
        chapterId,
        text,
        paragraphIndex,
        color: color || 'yellow',
      },
    })

    return NextResponse.json({ success: true, data: highlight, toggled: true }, { status: 201 })
  } catch (error) {
    console.error('Create highlight error:', error)
    return NextResponse.json({ success: false, error: '创建高亮失败' }, { status: 500 })
  }
}

// PATCH /api/highlights - Update highlight (change color or add note)
export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  try {
    const { id, color, note } = await request.json()
    if (!id) {
      return NextResponse.json({ success: false, error: '缺少ID' }, { status: 400 })
    }

    const existing = await prisma.highlight.findUnique({ where: { id } })
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: '高亮不存在' }, { status: 404 })
    }

    const data: Record<string, unknown> = {}
    if (color) data.color = color
    if (note !== undefined) data.note = note

    const updated = await prisma.highlight.update({ where: { id }, data })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Update highlight error:', error)
    return NextResponse.json({ success: false, error: '更新高亮失败' }, { status: 500 })
  }
}

// DELETE /api/highlights?id=xxx
export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: '请先登录' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ success: false, error: '缺少高亮ID' }, { status: 400 })
  }

  const highlight = await prisma.highlight.findUnique({ where: { id } })
  if (!highlight || highlight.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: '高亮不存在' }, { status: 404 })
  }

  await prisma.highlight.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

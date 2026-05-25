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
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, nameEn: true } },
        _count: {
          select: {
            chapters: true,
            bookmarks: true,
            histories: true,
            notes: true,
          },
        },
      },
    })

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    const contentCount = await prisma.pageContent.count({
      where: { chapter: { bookId: id } },
    })

    return NextResponse.json({
      success: true,
      data: { ...book, contentCount },
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

    const book = await prisma.book.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.titleCn !== undefined && { titleCn: body.titleCn }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.authorDynasty !== undefined && { authorDynasty: body.authorDynasty }),
        ...(body.dynasty !== undefined && { dynasty: body.dynasty }),
        ...(body.edition !== undefined && { edition: body.edition }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.quality !== undefined && { quality: body.quality }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.dataSource !== undefined && { dataSource: body.dataSource }),
        ...(body.coverUrl !== undefined && { coverUrl: body.coverUrl }),
        ...(body.beautifulCover !== undefined && { beautifulCover: body.beautifulCover }),
        ...(body.reviewedAt !== undefined && { reviewedAt: body.reviewedAt ? new Date(body.reviewedAt) : null }),
        ...(body.reviewedBy !== undefined && { reviewedBy: body.reviewedBy }),
      },
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { chapters: true } },
      },
    })

    return NextResponse.json({ success: true, data: book })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

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
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            titleCn: true,
            author: true,
            authorDynasty: true,
            dynasty: true,
            edition: true,
            coverUrl: true,
            quality: true,
          },
        },
        content: {
          select: {
            content: true,
            wordCount: true,
            imageUrls: true,
          },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: chapter })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

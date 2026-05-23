import { NextRequest, NextResponse } from 'next/server'
import { getChapters } from '@/lib/db-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const bookId = searchParams.get('bookId')

  if (!bookId) {
    return NextResponse.json(
      { success: false, error: 'bookId is required' },
      { status: 400 }
    )
  }

  const chapters = await getChapters(bookId)

  return NextResponse.json({
    success: true,
    data: chapters,
    total: chapters.length,
  })
}

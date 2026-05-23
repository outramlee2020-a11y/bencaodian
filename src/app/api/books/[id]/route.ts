import { NextRequest, NextResponse } from 'next/server'
import { getBookById } from '@/lib/db-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const book = await getBookById(id)

  if (!book) {
    return NextResponse.json(
      { success: false, error: 'Book not found' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: book })
}

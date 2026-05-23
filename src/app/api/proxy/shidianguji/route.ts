import { NextRequest, NextResponse } from 'next/server'
import { searchShidianguji, getShidiangujiBook, getChapterContent } from '@/lib/shidianguji-api'

/**
 * Proxy endpoint for shidianguji.com
 * Usage:
 *   GET /api/proxy/shidianguji?action=search&q=本草
 *   GET /api/proxy/shidianguji?action=book&id=SBCK078
 *   GET /api/proxy/shidianguji?action=chapter&bookId=SBCK078&chapterId=ch1
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'search': {
        const query = searchParams.get('q') || ''
        const results = await searchShidianguji(query)
        return NextResponse.json({ success: true, data: results })
      }

      case 'book': {
        const id = searchParams.get('id') || ''
        const book = await getShidiangujiBook(id)
        return NextResponse.json({ success: true, data: book })
      }

      case 'chapter': {
        const bookId = searchParams.get('bookId') || ''
        const chapterId = searchParams.get('chapterId') || ''
        const content = await getChapterContent(bookId, chapterId)
        return NextResponse.json({ success: true, data: content })
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: search, book, chapter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Shidianguji proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch from shidianguji' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { searchContent, searchAll } from '@/lib/fulltext-search'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const scope = searchParams.get('scope') || 'all' // 'all' | 'content' | 'books'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  if (!q.trim()) {
    return NextResponse.json({ success: true, data: { books: [], chapters: [], bookTotal: 0, chapterTotal: 0 } })
  }

  const offset = (page - 1) * pageSize

  try {
    if (scope === 'content') {
      const { results, total } = await searchContent(q, pageSize, offset)
      return NextResponse.json({
        success: true,
        data: { chapters: results, total, page, pageSize },
      })
    }

    // scope = 'all' — search both books and content
    const result = await searchAll(q, pageSize, offset)
    return NextResponse.json({
      success: true,
      data: { ...result, page, pageSize },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 },
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { searchBooks } from '@/lib/db-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const category = searchParams.get('category') || 'all'
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')

  const results = await searchBooks(query, category)

  return NextResponse.json({
    success: true,
    data: {
      results: results.slice((page - 1) * pageSize, page * pageSize),
      total: results.length,
      page,
      pageSize,
    },
  })
}

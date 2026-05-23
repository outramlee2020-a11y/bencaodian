import { NextRequest, NextResponse } from 'next/server'
import { getBooks } from '@/lib/db-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || undefined
  const subcategory = searchParams.get('subcategory') || undefined

  const filtered = await getBooks(category)

  // If subcategory is specified, filter further (our DB doesn't store subcategory,
  // but we keep the parameter for compatibility)
  const results = subcategory
    ? filtered.filter((b) => b.subcategory === subcategory)
    : filtered

  return NextResponse.json({
    success: true,
    data: results,
    total: results.length,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getChapterContent } from '@/lib/db-service'
import { extractText } from '@/lib/content-parser'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ chapterId: string }> }
) {
  const { chapterId } = await params

  const content = await getChapterContent(chapterId)
  if (!content) {
    return NextResponse.json(
      { success: false, error: 'Content not found' },
      { status: 404 }
    )
  }

  // Normalize text: clean text vs JSON-lines format
  const normalized = extractText(content.content)

  // imageUrls stored as JSON string — parse for the client
  let imageUrls: string[] | null = null
  if (content.imageUrls) {
    try {
      imageUrls = JSON.parse(content.imageUrls)
    } catch {
      imageUrls = [content.imageUrls]
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      content: normalized,
      rawFormat: content.content !== normalized ? 'json-lines' : 'plain',
      imageUrls,
      wordCount: normalized.replace(/\s/g, '').length,
    },
  })
}

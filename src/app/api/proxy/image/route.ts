import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy for shidianguji images.
 *
 * The picUrl values stored in PageContent.imageUrls are encrypted tokens
 * from shidianguji's pages API. They must be sent back to shidianguji's
 * image serving endpoint with the proper Referer header to be decrypted.
 *
 * Usage: GET /api/proxy/image?picUrl=ENCRYPTED_TOKEN
 */

const SHIDIANGUJI_BASE = 'https://www.shidianguji.com'
const POSSIBLE_ENDPOINTS = [
  '/api/ancientlib/read/book/page/image',
  '/api/ancientlib/read/book/page/pic',
]

async function tryFetchImage(picUrl: string): Promise<Response | null> {
  for (const endpoint of POSSIBLE_ENDPOINTS) {
    try {
      const url = `${SHIDIANGUJI_BASE}${endpoint}?picUrl=${encodeURIComponent(picUrl)}`
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Referer: `${SHIDIANGUJI_BASE}/`,
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        },
      })
      if (res.ok && res.headers.get('content-type')?.startsWith('image/')) {
        return res
      }
    } catch {
      continue
    }
  }
  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const picUrl = searchParams.get('picUrl')

  if (!picUrl) {
    return NextResponse.json(
      { success: false, error: 'picUrl query parameter is required' },
      { status: 400 }
    )
  }

  const imageResponse = await tryFetchImage(picUrl)
  if (!imageResponse) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image from shidianguji' },
      { status: 502 }
    )
  }

  // Stream the image back
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  const buffer = await imageResponse.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

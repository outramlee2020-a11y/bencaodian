import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import crypto from 'crypto'

/**
 * Proxy for shidianguji images.
 *
 * The picUrl values stored in PageContent.imageUrls are encrypted tokens
 * from shidianguji's pages API. They must be sent back to shidianguji's
 * image serving endpoint with the proper Referer header to be decrypted.
 *
 * Usage: GET /api/proxy/image?picUrl=ENCRYPTED_TOKEN
 *
 * Images are cached locally under public/cache/images/ to avoid repeated
 * round-trips to shidianguji.
 */

const SHIDIANGUJI_BASE = 'https://www.shidianguji.com'
const POSSIBLE_ENDPOINTS = [
  '/api/ancientlib/read/book/page/image',
  '/api/ancientlib/read/book/page/pic',
]
const CACHE_DIR = join(process.cwd(), 'public', 'cache', 'images')

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

function getCacheKey(picUrl: string): string {
  return crypto.createHash('md5').update(picUrl).digest('hex')
}

function getCachePath(cacheKey: string, ext: string): string {
  return join(CACHE_DIR, `${cacheKey}${ext}`)
}

async function saveToCache(cacheKey: string, buffer: ArrayBuffer, ext: string): Promise<void> {
  try {
    if (!existsSync(CACHE_DIR)) {
      await mkdir(CACHE_DIR, { recursive: true })
    }
    await writeFile(getCachePath(cacheKey, ext), Buffer.from(buffer))
  } catch (err) {
    console.error('Failed to cache image:', err)
  }
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

  // Check local cache first
  const cacheKey = getCacheKey(picUrl)
  const cachePathJpeg = join(CACHE_DIR, `${cacheKey}.jpg`)
  const cachePathPng = join(CACHE_DIR, `${cacheKey}.png`)
  const cachePathWebp = join(CACHE_DIR, `${cacheKey}.webp`)

  if (existsSync(cachePathJpeg)) {
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(cachePathJpeg)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Cache': 'HIT',
      },
    })
  }
  if (existsSync(cachePathPng)) {
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(cachePathPng)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Cache': 'HIT',
      },
    })
  }
  if (existsSync(cachePathWebp)) {
    const { readFile } = await import('fs/promises')
    const buffer = await readFile(cachePathWebp)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        'X-Cache': 'HIT',
      },
    })
  }

  // Cache miss — fetch from shidianguji
  const imageResponse = await tryFetchImage(picUrl)
  if (!imageResponse) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch image from shidianguji' },
      { status: 502 }
    )
  }

  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  const buffer = await imageResponse.arrayBuffer()

  // Determine file extension from content type
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }
  const ext = extMap[contentType] || '.jpg'

  // Save to cache (fire-and-forget)
  saveToCache(cacheKey, buffer, ext)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'Access-Control-Allow-Origin': '*',
      'X-Cache': 'MISS',
    },
  })
}

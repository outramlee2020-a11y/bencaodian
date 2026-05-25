import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy endpoint for zdic.net (汉典) character lookup.
 * Usage: GET /api/proxy/zdic?char=医
 *
 * Fetches basic pinyin and meaning from zdic.net by scraping.
 * Returns: { success: true, pinyin: 'yī', meaning: '...' }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const char = searchParams.get('char') || ''

  if (!char || char.length !== 1) {
    return NextResponse.json(
      { success: false, error: 'Single character required' },
      { status: 400 }
    )
  }

  // Validate it's a Chinese character
  if (!/[\u4e00-\u9fff]/.test(char)) {
    return NextResponse.json(
      { success: false, error: 'Not a Chinese character' },
      { status: 400 }
    )
  }

  try {
    // Fetch from zdic.net
    const url = `https://www.zdic.net/hans/${encodeURIComponent(char)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(`zdic.net returned ${response.status} for char=${char}`)
      return NextResponse.json(
        { success: false, error: 'zdic.net returned error' },
        { status: 502 }
      )
    }

    const html = await response.text()

    // Extract pinyin from zdic.net page
    let pinyin = ''
    const pinyinMatch = html.match(/<span[^>]*class="[^"]*pinyin[^"]*"[^>]*>([^<]+)<\/span>/i)
      || html.match(/<div[^>]*class="[^"]*pinyin[^"]*"[^>]*>([^<]+)<\/div>/i)
      || html.match(/id="pinyin"[^>]*>([^<]+)</i)
    if (pinyinMatch) {
      pinyin = pinyinMatch[1].trim()
    }

    // Extract basic meaning from zdic.net
    let meaning = ''
    const meaningMatch = html.match(/<div[^>]*class="[^"]*basic[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]*id="js-basic"[^>]*>([\s\S]*?)<\/div>/i)
      || html.match(/<div[^>]*class="[^"]*entry[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    if (meaningMatch) {
      // Strip HTML tags
      meaning = meaningMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 300)
    }

    if (!pinyin && !meaning) {
      // Try alternate: extract from meta description
      const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]+)"/i)
      if (metaMatch) {
        meaning = metaMatch[1].slice(0, 300)
      }
    }

    return NextResponse.json({
      success: !!(pinyin || meaning),
      pinyin: pinyin || '',
      meaning: meaning || '',
      source: 'zdic.net',
    })
  } catch (error) {
    console.error('zdic proxy error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch from zdic.net' },
      { status: 502 }
    )
  }
}

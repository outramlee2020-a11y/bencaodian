/**
 * Proxy client for 识典古籍 (shidianguji.com) public API
 * Scrapes book metadata, chapter content, and search results
 * 
 * NOTE: The target site uses Rsbuild (NOT Next.js), so data is embedded
 * in `window._ROUTER_DATA` rather than `__NEXT_DATA__`.
 */

const BASE_URL = 'https://www.shidianguji.com'
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export interface ShidiangujiBook {
  id: string
  title: string
  titleCn?: string
  author: string
  authorDynasty: string
  description?: string
  edition?: string
  editionDynasty?: string
  coverUrl?: string
  beautifulCover?: string
  dynasty?: string
  totalChapters?: number
  // Raw API fields
  addNames?: string[]
  version?: number
  checkType?: number
  authors?: { persName: string; responsibleTypeStr: string; dynastyName: string; dynastyCateId?: string }[]
  traditionalCategory?: { cateId: string; cateName: string }[]
  modernCategory?: { cateId: string; cateName: string }[]
  chapterNames?: { lines: { content: string }[] }[]
}

export interface ShidiangujiSearchResult {
  bookId: string
  bookTitle: string
  bookAuthor: string
  bookDynasty: string
  chapterId?: string
  chapterTitle?: string
  snippet?: string
  description?: string
  // Rich metadata from search page
  authors?: { persName: string; responsibleTypeStr: string; dynastyName: string }[]
  edition?: string
  editionDynasty?: string
  coverUrl?: string
  beautifulCover?: string
  dynastyCategoryName?: string
  traditionalCategory?: { cateId: string; cateName: string }[]
  version?: number
  checkType?: number
}

/**
 * Raw API response types matching the Rsbuild data format
 */
interface RawRecommendBook {
  bookId: string
  bookName: string
  addNames: string[]
  version: number
  authors: { persName: string; responsibleTypeStr: string; dynastyName: string; dynastyCateId: string }[]
  dynastyCategoryName: string
  coverUrl: string
  checkType: number
  edition: { edition: string; editionDynastyName: string }
  traditionalCategory: { cateId: string; cateName: string }[]
  modernCategory?: { cateId: string; cateName: string }[]
}

interface RawSearchResult {
  bookId: string
  bookName: string
  bookAuthor?: string
  bookDynasty?: string
  snippet?: string
}

async function fetchFromShidianguji(path: string): Promise<string> {
  const url = `${BASE_URL}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/json,*/*',
      },
      signal: controller.signal,
    })
    return await res.text()
  } finally {
    clearTimeout(timeout)
  }
}

/**
 * Parse `window._ROUTER_DATA` from Rsbuild SSR page HTML.
 * This is the equivalent of `__NEXT_DATA__` for Rsbuild-based sites.
 * 
 * The JSON data starts with `window._ROUTER_DATA = {` and ends with the
 * matching `};\n</script>` (or `}</script>`). Since the JSON contains nested
 * braces, we use a depth counter to find the correct closing brace.
 */
function extractRouterData(html: string): any {
  const startMarker = 'window._ROUTER_DATA = '
  const startIdx = html.indexOf(startMarker)
  if (startIdx === -1) return null

  // Find the opening brace
  const jsonStart = startIdx + startMarker.length
  if (html[jsonStart] !== '{') return null

  // Walk through character by character to find matching closing brace
  let depth = 0
  let inString = false
  let escapeNext = false
  let endIdx = -1

  for (let i = jsonStart; i < html.length; i++) {
    const c = html[i]
    
    if (escapeNext) {
      escapeNext = false
      continue
    }
    
    if (inString) {
      if (c === '\\') {
        escapeNext = true
      } else if (c === '"') {
        inString = false
      }
      continue
    }
    
    if (c === '"') {
      inString = true
      continue
    }
    
    if (c === '{') {
      depth++
      continue
    }
    
    if (c === '}') {
      depth--
      if (depth === 0) {
        endIdx = i + 1
        break
      }
    }
  }

  if (endIdx === -1) return null

  const jsonStr = html.substring(jsonStart, endIdx)
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('Failed to parse _ROUTER_DATA JSON:', (e as Error).message.slice(0, 200))
    return null
  }
}

/**
 * Get a specific route's data from the _ROUTER_DATA structure.
 * The Rsbuild data is organized as:
 *   loaderData["__session/(lang$)/{route}.(param$)/page"].{dataKey}
 * 
 * Common route names:
 *   - search.(query$)/page   => .data (paragraphs, recommendBooks, total)
 *   - book.(bookId$)/page    => .bookInfo, .catalog
 *   - library.(cateId$)/page => .books
 */
function getRouteData(routerData: any, routeName: string): any | null {
  if (!routerData?.loaderData) return null
  const { loaderData } = routerData

  // Try exact key first
  const exactKey = `__session/(lang$)/${routeName}`
  if (loaderData[exactKey]) return loaderData[exactKey]

  // Try without session prefix
  if (loaderData[routeName]) return loaderData[routeName]

  // Search for partial match
  for (const key of Object.keys(loaderData)) {
    if (key.includes(routeName.replace(/\(.*?\)/g, '').replace(/\/\//g, '/'))) {
      return loaderData[key]
    }
  }

  return null
}

/**
 * Find a value at a deep path in any route data.
 */
function findInRouterData(data: any, ...keys: string[]): any {
  if (!data?.loaderData) return null

  const allRoutes: any[] = Object.values(data.loaderData)
  for (const routeData of allRoutes) {
    if (!routeData || typeof routeData !== 'object') continue
    let current: any = routeData
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        current = null
        break
      }
    }
    if (current) return current
  }
  return null
}

/**
 * Search for books/texts on shidianguji
 * 
 * The search page SSR returns data in `window._ROUTER_DATA`.
 * Structure:
 *   _ROUTER_DATA.loaderData["__session/(lang$)/search.(query$)/page"]
 *     .data.total            - total results count
 *     .data.paragraphs[]     - full search results (10 per page)
 *       .bookInfo.bookId, .bookInfo.bookName, .bookInfo.authors[]
 *     .data.recommendBooks   - featured books with complete metadata
 *       .total, .books[]
 */
export async function searchShidianguji(query: string): Promise<ShidiangujiSearchResult[]> {
  try {
    const html = await fetchFromShidianguji(`/search/${encodeURIComponent(query)}`)
    const routerData = extractRouterData(html)

    if (!routerData) {
      return parseSearchHtml(html)
    }

    const results: ShidiangujiSearchResult[] = []
    const seen = new Set<string>()

    // === Primary path: search page data ===
    const searchRoute = getRouteData(routerData, 'search.(query$)/page')
    const searchData = searchRoute?.data

    if (searchData) {
      // From paragraphs (search results with context)
      if (Array.isArray(searchData.paragraphs)) {
        for (const para of searchData.paragraphs) {
          const bi = para.bookInfo
          if (bi?.bookId && !seen.has(bi.bookId)) {
            seen.add(bi.bookId)
            const authors = bi.authors || []
            results.push({
              bookId: bi.bookId,
              bookTitle: bi.bookName || '',
              bookAuthor: authors.map((a: any) => a.persName).join('、'),
              bookDynasty: bi.dynastyCategoryName || (authors[0]?.dynastyName || ''),
              chapterId: para.chapterId,
              snippet: '',
              // Rich metadata
              authors: authors,
              edition: bi.edition?.edition,
              editionDynasty: bi.edition?.editionDynastyName,
              coverUrl: bi.coverUrl,
              beautifulCover: bi.beautifulCover,
              dynastyCategoryName: bi.dynastyCategoryName,
              traditionalCategory: bi.traditionalCategory,
              version: bi.version,
              checkType: bi.checkType,
            })
          }
        }
      }

      // From recommendBooks (featured books with full metadata)
      if (searchData.recommendBooks?.books) {
        for (const r of searchData.recommendBooks.books) {
          if (!seen.has(r.bookId)) {
            seen.add(r.bookId)
            const authors = r.authors || []
            results.push({
              bookId: r.bookId,
              bookTitle: r.bookName || '',
              bookAuthor: authors.map((a: any) => a.persName).join('、'),
              bookDynasty: r.dynastyCategoryName || (authors[0]?.dynastyName || ''),
              description: r.edition?.edition || '',
              // Rich metadata
              authors: authors,
              edition: r.edition?.edition,
              editionDynasty: r.edition?.editionDynastyName,
              coverUrl: r.coverUrl,
              beautifulCover: r.beautifulCover,
              dynastyCategoryName: r.dynastyCategoryName,
              traditionalCategory: r.traditionalCategory,
              version: r.version,
              checkType: r.checkType,
            })
          }
        }
      }
    }

    // === Fallback: scan all route data for arrays with bookId ===
    if (results.length === 0 && routerData.loaderData) {
      const allRoutes: any[] = Object.values(routerData.loaderData)
      for (const routeData of allRoutes) {
        if (!routeData || typeof routeData !== 'object') continue
        for (const val of Object.values(routeData)) {
          if (Array.isArray(val) && val.length > 0 && val[0]?.bookId) {
            for (const r of val) {
              if (!seen.has(r.bookId)) {
                seen.add(r.bookId)
                results.push({
                  bookId: r.bookId,
                  bookTitle: r.bookName || '',
                  bookAuthor: '',
                  bookDynasty: '',
                })
              }
            }
          }
        }
      }
    }

    if (results.length > 0) return results

    return parseSearchHtml(html)
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}

/**
 * Fallback: extract book info from HTML
 */
function parseSearchHtml(html: string): ShidiangujiSearchResult[] {
  const results: ShidiangujiSearchResult[] = []

  // Find book IDs from hrefs
  const linkRegex = /href="\/book\/([^"\/]+)"/g
  let match
  const seen = new Set<string>()
  while ((match = linkRegex.exec(html)) !== null) {
    const bookId = match[1]
    if (!seen.has(bookId)) {
      seen.add(bookId)
      results.push({
        bookId,
        bookTitle: '',
        bookAuthor: '',
        bookDynasty: '',
      })
    }
  }

  return results
}

/**
 * Get book details from shidianguji
 * 
 * The book page SSR data is at:
 *   _ROUTER_DATA.loaderData["__session/(lang$)/book.(bookId$)/page"]
 *     .bookInfo   - book metadata (authors, edition, description)
 *     .catalog    - chapter list
 */
export async function getShidiangujiBook(bookId: string): Promise<ShidiangujiBook | null> {
  try {
    const html = await fetchFromShidianguji(`/book/${bookId}`)
    const routerData = extractRouterData(html)

    if (!routerData) {
      return { id: bookId, title: '', author: '', authorDynasty: '' }
    }

    // Primary path: book route data
    const bookRoute = getRouteData(routerData, 'book.(bookId$)/page')

    if (bookRoute?.bookInfo) {
      const bi = bookRoute.bookInfo
      const authors = bi.authors || []
      const editionInfo = bi.edition || {}
      const chapters = bi.chapterNames || []
      
      // Extract description from abstract (which is an array of line objects)
      let description = ''
      if (bi.abstract && Array.isArray(bi.abstract)) {
        description = bi.abstract
          .map((block: any) => 
            Array.isArray(block.lines) 
              ? block.lines.map((l: any) => l.content).join('')
              : ''
          )
          .join('\n')
      }

      return {
        id: bi.bookId || bookId,
        title: bi.bookName || '',
        titleCn: bi.bookName || '',
        author: authors.map((a: any) => a.persName).join('、'),
        authorDynasty: authors.map((a: any) => a.dynastyName).filter(Boolean).join('、'),
        description: description || '',
        edition: editionInfo.edition || '',
        editionDynasty: editionInfo.editionDynastyName || '',
        coverUrl: bi.coverUrl || '',
        beautifulCover: bi.beautifulCover || '',
        dynasty: bi.dynastyCategoryName || (authors[0]?.dynastyName || ''),
        totalChapters: chapters.length || 0,
        addNames: bi.addNames,
        version: bi.version,
        checkType: bi.checkType,
        authors: authors,
        traditionalCategory: bi.traditionalCategory,
        modernCategory: bi.modernCategory,
        chapterNames: chapters,
      }
    }

    // Fallback: search all route data for bookInfo
    if (routerData.loaderData) {
      const allRoutes: any[] = Object.values(routerData.loaderData)
      for (const routeData of allRoutes) {
        if (routeData?.bookInfo) {
          const bi = routeData.bookInfo
          const authors = bi.authors || []
          return {
            id: bi.bookId || bookId,
            title: bi.bookName || '',
            titleCn: bi.bookName || '',
            author: authors.map((a: any) => a.persName).join('、'),
            authorDynasty: authors.map((a: any) => a.dynastyName).filter(Boolean).join('、'),
            description: '',
          }
        }
      }
    }

    return { id: bookId, title: '', author: '', authorDynasty: '' }
  } catch (error) {
    console.error('Failed to fetch book:', error)
    return null
  }
}

/**
 * Get library/catalog data from shidianguji
 */
export async function getShidiangujiLibrary(): Promise<ShidiangujiBook[]> {
  try {
    const html = await fetchFromShidianguji('/library')
    const routerData = extractRouterData(html)

    if (!routerData) return []

    // Try to find book lists at various paths
    // The library page shows books organized by category
    const books: ShidiangujiBook[] = []

    const { loaderData } = routerData
    if (loaderData) {
      for (const [, routeData] of Object.entries(loaderData)) {
        if (routeData && typeof routeData === 'object') {
          // Search for book list arrays
          for (const val of Object.values(routeData as Record<string, any>)) {
            if (Array.isArray(val) && val.length > 0 && val[0]?.bookId) {
              for (const b of val as RawRecommendBook[]) {
                const authors = b.authors || []
                books.push({
                  id: b.bookId,
                  title: b.bookName || '',
                  author: authors.map((a: any) => a.persName).join('、'),
                  authorDynasty: authors[0]?.dynastyName || '',
                  dynasty: b.dynastyCategoryName || '',
                  coverUrl: b.coverUrl || '',
                  edition: b.edition?.edition || '',
                  version: b.version,
                  checkType: b.checkType,
                  traditionalCategory: b.traditionalCategory,
                })
              }
            }
          }
        }
      }
    }

    return books
  } catch (error) {
    console.error('Failed to fetch library:', error)
    return []
  }
}

/**
 * Convert shidianguji data to our internal Book format
 */
/**
 * Get chapter content (text) from shidianguji by scraping the reader page.
 * Used by the proxy endpoint at /api/proxy/shidianguji?action=chapter
 */
export async function getChapterContent(bookId: string, chapterId: string): Promise<{ text: string; imageUrls: string[] } | null> {
  try {
    const html = await fetchFromShidianguji(`/book/${bookId}/chapter/${chapterId}`)
    
    // Try to extract text from the reader content section
    const textMatch = html.match(/<section[^>]*class="[^"]*read-layout-content[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
    const text = textMatch
      ? textMatch[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
      : ''

    // Try to find image URLs embedded in the page data
    const imageUrls: string[] = []
    const picUrlRegex = /"picUrl"\s*:\s*"([^"]+)"/g
    let picMatch
    while ((picMatch = picUrlRegex.exec(html)) !== null) {
      if (!imageUrls.includes(picMatch[1])) {
        imageUrls.push(picMatch[1])
      }
    }

    return { text, imageUrls }
  } catch (error) {
    console.error('Failed to fetch chapter content:', error)
    return null
  }
}

export function toInternalBook(sdgBook: ShidiangujiBook) {
  return {
    id: sdgBook.id,
    title: sdgBook.title,
    titleCn: sdgBook.title,
    author: sdgBook.author,
    authorDynasty: sdgBook.authorDynasty,
    description: sdgBook.description || '',
    category: mapCategory('category' in sdgBook ? (sdgBook as ShidiangujiBook & { category?: string }).category : undefined),
    edition: sdgBook.edition || '',
    coverUrl: sdgBook.coverUrl,
    dynasty: sdgBook.dynasty || sdgBook.authorDynasty,
    totalChapters: 0,
    quality: 'rough' as const,
    createdAt: new Date().toISOString(),
  }
}

function mapCategory(cat?: string) {
  const map: Record<string, any> = {
    经部: { id: 'jing', name: '经部', nameEn: 'Confucian Classics' },
    史部: { id: 'shi', name: '史部', nameEn: 'History' },
    子部: { id: 'zi', name: '子部', nameEn: 'Philosophy' },
    集部: { id: 'ji', name: '集部', nameEn: 'Literature' },
    道教部: { id: 'dao', name: '道教部', nameEn: 'Taoist' },
    佛教部: { id: 'fo', name: '佛教部', nameEn: 'Buddhist' },
  }
  return map[cat || ''] || { id: 'zi', name: '子部', nameEn: 'Philosophy' }
}

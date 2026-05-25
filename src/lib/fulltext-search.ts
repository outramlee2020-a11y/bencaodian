/**
 * Full-text search across chapter content.
 * Uses SQLite LIKE for now (dataset is ~500 books, a few thousand chapters).
 * Can upgrade to FTS5 later for larger datasets.
 */

import { prisma } from './prisma'

export interface SearchResult {
  chapterId: string
  bookId: string
  bookTitle: string
  chapterTitle: string
  /** Snippet of matching content (around the keyword) */
  snippet: string
  /** Total match count across all content */
  matchCount: number
}

/**
 * Search across all chapter content.
 * @param query The search keyword
 * @param limit Max results per page
 * @param offset Pagination offset
 */
export async function searchContent(
  query: string,
  limit = 20,
  offset = 0
): Promise<{ results: SearchResult[]; total: number }> {
  if (!query.trim()) {
    return { results: [], total: 0 }
  }

  const keyword = query.trim()

  // Count total matches
  const countResult = await prisma.$queryRawUnsafe<Array<{ total: number }>>(
    `SELECT COUNT(*) as total FROM (
      SELECT DISTINCT pc.chapterId
      FROM PageContent pc
      WHERE pc.content LIKE ${'%' + keyword + '%'}
    )`,
  )
  const total = Number(countResult[0]?.total || 0)

  // Search and join with Chapter + Book for metadata
  const rows = await prisma.$queryRawUnsafe<
    Array<{
      chapterId: string
      bookId: string
      bookTitle: string
      chapterTitle: string
      content: string
    }>
  >(
    `SELECT pc.chapterId, c.bookId, b.title as bookTitle, c.title as chapterTitle, pc.content
     FROM PageContent pc
     JOIN Chapter c ON pc.chapterId = c.id
     JOIN Book b ON c.bookId = b.id
     WHERE pc.content LIKE ${'%' + keyword + '%'}
     ORDER BY c.orderNum ASC
     LIMIT ${limit} OFFSET ${offset}`,
  )

  const results: SearchResult[] = rows.map((row) => ({
    chapterId: row.chapterId,
    bookId: row.bookId,
    bookTitle: row.bookTitle,
    chapterTitle: row.chapterTitle,
    snippet: extractSnippet(row.content, keyword, 120),
    matchCount: countOccurrences(row.content, keyword),
  }))

  return { results, total }
}

/**
 * Search both book metadata AND chapter content.
 * Returns combined results.
 */
export async function searchAll(
  query: string,
  limit = 20,
  offset = 0,
): Promise<{
  books: Array<{ id: string; title: string; author: string; authorDynasty: string; description: string; quality: string; dynasty: string }>
  chapters: SearchResult[]
  bookTotal: number
  chapterTotal: number
}> {
  const keyword = query.trim()
  if (!keyword) {
    return { books: [], chapters: [], bookTotal: 0, chapterTotal: 0 }
  }

  // Search books (existing logic)
  const bookWhere = {
    OR: [
      { title: { contains: keyword } },
      { titleCn: { contains: keyword } },
      { author: { contains: keyword } },
      { description: { contains: keyword } },
    ],
  }
  const [bookResults, chapterResults] = await Promise.all([
    prisma.book.findMany({
      where: bookWhere,
      select: {
        id: true,
        title: true,
        titleCn: true,
        author: true,
        authorDynasty: true,
        description: true,
        quality: true,
        dynasty: true,
      },
      orderBy: { totalChapters: 'desc' },
      take: limit,
      skip: offset,
    }),
    searchContent(keyword, limit, offset),
  ])

  const bookTotal = await prisma.book.count({ where: bookWhere })

  return {
    books: bookResults.map((b) => ({
      id: b.id,
      title: b.titleCn || b.title,
      author: b.author || '',
      authorDynasty: b.authorDynasty || '',
      description: b.description || '',
      quality: b.quality,
      dynasty: b.dynasty || '',
    })),
    chapters: chapterResults.results,
    bookTotal,
    chapterTotal: chapterResults.total,
  }
}

/** Extract a snippet around the first occurrence of keyword */
function extractSnippet(text: string, keyword: string, contextChars: number): string {
  const idx = text.indexOf(keyword)
  if (idx === -1) return text.slice(0, contextChars * 2)

  const start = Math.max(0, idx - contextChars)
  const end = Math.min(text.length, idx + keyword.length + contextChars)

  let snippet = ''
  if (start > 0) snippet += '…'
  snippet += text.slice(start, end)
  if (end < text.length) snippet += '…'

  return snippet
}

/** Count occurrences of keyword in text */
function countOccurrences(text: string, keyword: string): number {
  let count = 0
  let pos = 0
  while (true) {
    pos = text.indexOf(keyword, pos)
    if (pos === -1) break
    count++
    pos += keyword.length
  }
  return count
}

/**
 * Database service layer — Prisma-based replacements for seed-data.ts
 *
 * All functions are async and return typed data matching frontend expectations.
 */

import { prisma } from './prisma'
import type { Book, Category, Chapter, CategoryId } from '@/types'
import { categories as staticCategories } from '@/lib/seed-data'

// ===== Category helpers =====

export function getCategories(): Category[] {
  return staticCategories
}

// ===== Book queries =====

/** Map a Prisma Book (with category) to the frontend Book type */
function mapBook(record: any): Book | null {
  if (!record) return null
  return {
    id: record.id,
    title: record.titleCn || record.title,
    titleCn: record.titleCn || record.title,
    author: record.author || '',
    authorDynasty: record.authorDynasty || '',
    description: record.description || '',
    category: mapCategory(record.category) || { id: 'zi' as CategoryId, name: '子部', nameEn: 'Philosophy' },
    subcategory: '医家', // all our medical books are 医家
    edition: record.edition || '',
    coverUrl: record.coverUrl || record.beautifulCover || '',
    dynasty: record.dynasty || '',
    totalChapters: record.totalChapters || 0,
    quality: (record.quality as 'rough' | 'polished') || 'rough',
    reviewedAt: record.reviewedAt?.toISOString?.() || undefined,
    createdAt: record.createdAt?.toISOString?.() || new Date().toISOString(),
    teamName: record.teamName || undefined,
    contributors: record.contributors || undefined,
  }
}

function mapCategory(record: any): Category | null {
  if (!record) return null
  return {
    id: record.id as CategoryId,
    name: record.name,
    nameEn: record.nameEn || '',
  }
}

/** Get all books, optionally filtered by category */
export async function getBooks(categoryId?: string): Promise<Book[]> {
  const where: any = {}
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId
  }
  const records = await prisma.book.findMany({
    where,
    include: { category: true },
    orderBy: { totalChapters: 'desc' },
  })
  return records.map(mapBook).filter(Boolean) as Book[]
}

/** Get a single book by ID */
export async function getBookById(id: string): Promise<Book | null> {
  const record = await prisma.book.findUnique({
    where: { id },
    include: { category: true },
  })
  return mapBook(record)
}

/** Get featured (polished) books */
export async function getFeaturedBooks(limit = 6): Promise<Book[]> {
  const records = await prisma.book.findMany({
    where: { quality: 'polished' },
    include: { category: true },
    orderBy: { totalChapters: 'desc' },
    take: limit,
  })
  return records.map(mapBook).filter(Boolean) as Book[]
}

/** Get books by category */
export async function getBooksByCategory(categoryId: string): Promise<Book[]> {
  return getBooks(categoryId)
}

/** Search books by query string */
export async function searchBooks(
  query: string,
  categoryId?: string
): Promise<Book[]> {
  const where: any = {
    OR: [
      { title: { contains: query } },
      { titleCn: { contains: query } },
      { author: { contains: query } },
      { description: { contains: query } },
    ],
  }
  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId
  }
  const records = await prisma.book.findMany({
    where,
    include: { category: true },
    orderBy: { totalChapters: 'desc' },
  })
  return records.map(mapBook).filter(Boolean) as Book[]
}

// ===== Chapter queries =====

/** Get all chapters for a book, ordered */
export async function getChapters(bookId: string): Promise<any[]> {
  const chapters = await prisma.chapter.findMany({
    where: { bookId },
    orderBy: { orderNum: 'asc' },
  })
  return chapters.map((c, i) => ({
    id: c.id,
    bookId: c.bookId,
    number: i + 1,
    title: c.title,
    level: c.chapterLevel,
    parentId: c.parentId,
  }))
}

/** Get a single chapter by ID */
export async function getChapter(id: string) {
  const c = await prisma.chapter.findUnique({ where: { id } })
  if (!c) return null
  return {
    id: c.id,
    bookId: c.bookId,
    number: c.orderNum,
    title: c.title,
    level: c.chapterLevel,
    parentId: c.parentId,
  }
}

/** Get chapter content */
export async function getChapterContent(chapterId: string) {
  const content = await prisma.pageContent.findUnique({
    where: { chapterId },
  })
  return content
}

/** Get recent reading history for a user, with book info */
export async function getUserRecentHistory(userId: string, limit = 6) {
  const all = await prisma.readingHistory.findMany({
    where: { userId },
    orderBy: { lastReadAt: 'desc' },
    include: {
      book: true,
      chapter: true,
    },
  })
  // Deduplicate by bookId (keep latest per book)
  const seen = new Set<string>()
  const deduped: typeof all = []
  for (const h of all) {
    if (!seen.has(h.bookId)) {
      seen.add(h.bookId)
      deduped.push(h)
    }
  }
  return deduped.slice(0, limit)
}

/** Get reading history for a specific user + book */
export async function getUserBookHistory(userId: string, bookId: string) {
  const history = await prisma.readingHistory.findFirst({
    where: { userId, bookId },
    orderBy: { lastReadAt: 'desc' },
    include: { chapter: true },
  })
  return history
}

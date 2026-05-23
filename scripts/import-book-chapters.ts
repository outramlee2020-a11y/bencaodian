/**
 * Playwright-based book chapter importer
 *
 * Usage: npx tsx scripts/import-book-chapters.ts <bookId>
 * Example: npx tsx scripts/import-book-chapters.ts SBCK078
 *
 * Uses Playwright to load the book page, capture API responses,
 * and save book metadata + chapter structure to the database.
 */

import { chromium } from 'playwright'
import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { config } from 'dotenv'

config({ path: '.env.local' })

const BASE = 'https://www.shidianguji.com'
const CHROMIUM_PATH = 'C:\\Users\\zitao\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

// --- Types ---
interface CatalogChapter {
  chapterId: string
  chapterType?: number
  chapterLevel?: number
  chapterName: { content: string }[]
  parentChapterId?: string
  startPageNum?: number
  paragraphCount?: number
  volumeId?: string
  volumeVersion?: number
  hasMainContent?: boolean
  subChapters?: CatalogChapter[]
}

function flattenChapters(chapters: CatalogChapter[], parentId?: string, level = 1) {
  const result: any[] = []
  for (const ch of chapters) {
    const entry = {
      chapterId: ch.chapterId,
      title: ch.chapterName.map((n) => n.content).join(''),
      chapterLevel: ch.chapterLevel || level,
      chapterType: ch.chapterType || 1,
      parentChapterId: ch.parentChapterId || parentId || null,
      startPageNum: ch.startPageNum || 0,
      paragraphCount: ch.paragraphCount || 0,
      volumeId: ch.volumeId || null,
      volumeVersion: ch.volumeVersion || 0,
      hasMainContent: ch.hasMainContent || false,
      orderNum: result.length + 1,
    }
    result.push(entry)
    if (ch.subChapters?.length) {
      result.push(...flattenChapters(ch.subChapters, ch.chapterId, level + 1))
    }
  }
  return result
}

async function importBook(bookId: string) {
  console.log(`\n📖 Importing book: ${bookId}`)

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox'],
  })

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  })

  const page = await context.newPage()
  const apiData: Record<string, any> = {}

  // Intercept API responses
  page.on('response', async (response) => {
    const url = response.url()
    if (url.includes('/api/ancientlib/read/')) {
      try {
        const json = await response.json()
        if (json.errorCode === 0) {
          const endpoint = new URL(url).pathname.split('/').filter(Boolean).pop() || ''
          apiData[`${endpoint}_${Date.now()}`] = json.data
        }
      } catch {
        // skip non-json
      }
    }
  })

  // Navigate to book page
  console.log(`  🌐 Loading ${BASE}/book/${bookId}...`)
  await page.goto(`${BASE}/book/${bookId}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)

  // Find the book info API response
  const bookApiData = Object.values(apiData).find((d: any) => d?.bookInfo?.bookId === bookId)
  const bookInfo = bookApiData?.bookInfo as any

  if (!bookInfo) {
    console.log('  ⚠️  No book info captured from API')
    console.log('  Captured endpoints:', Object.keys(apiData).map((k) => k.split('_')[0]))
    await browser.close()
    return
  }

  console.log(`  📚 Book: ${bookInfo.bookName || bookId}`)

  // Build description from abstract blocks
  const authors: { persName: string; dynastyName?: string }[] = bookInfo.authors || []
  let description = ''
  if (bookInfo.abstract) {
    description = bookInfo.abstract
      .map((block: any) => block.lines?.map((l: any) => l.content).join('') || '')
      .join('\n')
  }

  // Upsert book
  await prisma.book.upsert({
    where: { id: bookId },
    create: {
      id: bookId,
      title: bookInfo.bookName || bookId,
      titleCn: bookInfo.bookName || null,
      author: authors.map((a) => a.persName).join('、') || null,
      authorDynasty: authors.filter((a) => a.dynastyName).map((a) => a.dynastyName).join('、') || null,
      description: description || null,
      edition: bookInfo.edition?.edition || null,
      editionDynasty: bookInfo.edition?.editionDynastyName || null,
      coverUrl: bookInfo.coverUrl || null,
      beautifulCover: bookInfo.beautifulCover || null,
      dynasty: bookInfo.dynastyCategoryName || null,
      version: bookInfo.version || 0,
      checkType: bookInfo.checkType || 1,
      dataSource: 'shidianguji',
    },
    update: {
      title: bookInfo.bookName,
      titleCn: bookInfo.bookName,
      author: authors.map((a) => a.persName).join('、'),
      authorDynasty: authors.filter((a) => a.dynastyName).map((a) => a.dynastyName).join('、'),
      description,
      edition: bookInfo.edition?.edition,
      editionDynasty: bookInfo.edition?.editionDynastyName,
      coverUrl: bookInfo.coverUrl,
      beautifulCover: bookInfo.beautifulCover,
      dynasty: bookInfo.dynastyCategoryName,
      version: bookInfo.version,
      checkType: bookInfo.checkType,
    },
  })

  // Import chapters from catalog
  const catalog = bookInfo.catalog
  if (catalog?.chapters) {
    const flatChapters = flattenChapters(catalog.chapters)
    console.log(`  📄 Importing ${flatChapters.length} chapters...`)

    for (let i = 0; i < flatChapters.length; i++) {
      const ch = flatChapters[i]
      if (!ch.chapterId) continue

      try {
        await prisma.chapter.upsert({
          where: { id: ch.chapterId },
          create: {
            id: ch.chapterId,
            bookId,
            title: ch.title || `第${i + 1}章`,
            chapterLevel: ch.chapterLevel,
            chapterType: ch.chapterType,
            parentId: ch.parentChapterId,
            orderNum: i + 1,
            startPageNum: ch.startPageNum || null,
            paragraphCount: ch.paragraphCount || null,
            volumeId: ch.volumeId || null,
            volumeVersion: ch.volumeVersion || null,
            hasMainContent: ch.hasMainContent || false,
          },
          update: { title: ch.title, orderNum: i + 1 },
        })
      } catch (e: any) {
        console.warn(`  ⚠️  Chapter ${ch.chapterId}: ${e.message?.slice(0, 80)}`)
      }
    }

    // Update total chapters count
    await prisma.book.update({
      where: { id: bookId },
      data: { totalChapters: flatChapters.length },
    })
    console.log(`  ✅ ${flatChapters.length} chapters saved`)
  }

  await browser.close()
  console.log(`  ✅ Done with ${bookId}`)
}

// --- Main ---
const bookId = process.argv[2] || 'SBCK078'
importBook(bookId)
  .then(() => {
    console.log('\n🎉 Import complete!')
    return prisma.$disconnect()
  })
  .catch((e) => {
    console.error('\n❌ Failed:', e)
    return prisma.$disconnect()
  })

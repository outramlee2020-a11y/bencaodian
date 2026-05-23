/**
 * Batch import books from seed-data using Playwright API capture
 *
 * Usage: npx tsx scripts/batch-import.ts
 *
 * Reads medical book IDs and imports each via Playwright.
 * Skips books already in the database.
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

// Medical books to import (from seed-data.ts)
const MEDICAL_BOOKS = [
  { id: 'NGJ89241199902754747156', name: '本草发明蒙筌' },
  { id: 'DZ0769', name: '图经衍义本草' },
  { id: 'HY1549', name: '本草发明切要' },
  { id: 'HY1492', name: '黄帝内经素问' },
  { id: 'HY1493', name: '伤寒论' },
  { id: 'HY1501', name: '本草纲目' },
  { id: 'HY1510', name: '神农本草经' },
  { id: 'HY1520', name: '金匮要略' },
  { id: 'HY1530', name: '针灸甲乙经' },
  { id: 'NA05254', name: '本草原始·本草发明' },
  { id: 'HY1600', name: '诸病源候论' },
  { id: 'HY1650', name: '医宗金鉴' },
]

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
  // Check if already imported
  const existing = await prisma.book.findUnique({ where: { id: bookId } })
  if (existing && (existing.totalChapters ?? 0) > 0) {
    console.log(`  ⏭️  Already imported: ${existing.title} (${existing.totalChapters} chapters)`)
    return false
  }

  console.log(`\n📖 Importing book: ${bookId} (${MEDICAL_BOOKS.find((b) => b.id === bookId)?.name || '?'})`)

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

  try {
    console.log(`  🌐 Loading ${BASE}/book/${bookId}...`)
    await page.goto(`${BASE}/book/${bookId}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3000)

    const bookApiData = Object.values(apiData).find((d: any) => d?.bookInfo?.bookId === bookId)
    const bookInfo = bookApiData?.bookInfo as any

    if (!bookInfo) {
      console.log(`  ⚠️  No API data for ${bookId}, trying DOM...`)

      // Try to get at least title from DOM
      const title = await page.evaluate(() => {
        const h1 = document.querySelector('h1')
        return h1?.textContent?.trim() || ''
      })

      if (title) {
        await prisma.book.upsert({
          where: { id: bookId },
          create: {
            id: bookId,
            title,
            dataSource: 'shidianguji',
          },
          update: { title },
        })
        console.log(`  📚 Saved bare title: ${title}`)
      }
      await browser.close()
      return true
    }

    console.log(`  📚 Book: ${bookInfo.bookName || bookInfo.bookId}`)

    const authors: { persName: string; dynastyName?: string }[] = bookInfo.authors || []
    let description = ''
    if (bookInfo.abstract) {
      description = bookInfo.abstract
        .map((block: any) => block.lines?.map((l: any) => l.content).join('') || '')
        .join('\n')
    }

    await prisma.book.upsert({
      where: { id: bookId },
      create: {
        id: bookId,
        title: bookInfo.bookName || bookId,
        titleCn: bookInfo.bookName || null,
        author: authors.map((a) => a.persName).join('、') || null,
        authorDynasty:
          authors
            .filter((a) => a.dynastyName)
            .map((a) => a.dynastyName)
            .join('、') || null,
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

      let imported = 0
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
          imported++
        } catch (e: any) {
          console.warn(`    ⚠️  Chapter ${ch.chapterId}: ${e.message?.slice(0, 60)}`)
        }
      }

      await prisma.book.update({
        where: { id: bookId },
        data: { totalChapters: flatChapters.length },
      })
      console.log(`  ✅ ${imported}/${flatChapters.length} chapters saved`)
    }
  } catch (e: any) {
    console.error(`  ❌ Error importing ${bookId}: ${e.message?.slice(0, 100)}`)
  }

  await browser.close()
  return true
}

// --- Main ---
async function main() {
  console.log('=== Batch Import Medical Books ===')
  console.log(`Total books to process: ${MEDICAL_BOOKS.length}`)

  let imported = 0
  let skipped = 0
  for (const book of MEDICAL_BOOKS) {
    const result = await importBook(book.id)
    if (result) imported++
    else skipped++
    // Small delay between imports
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`\n=== Summary ===`)
  console.log(`Imported: ${imported}, Skipped: ${skipped}, Total: ${MEDICAL_BOOKS.length}`)

  // Print final database stats
  const bookCount = await prisma.book.count()
  const chapterCount = await prisma.chapter.count()
  console.log(`\nDatabase now has:`)
  console.log(`  ${bookCount} books`)
  console.log(`  ${chapterCount} chapters`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

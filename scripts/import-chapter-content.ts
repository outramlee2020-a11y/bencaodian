/**
 * Import chapter content from shidianguji using Playwright
 * Sequential with fast page loads for SQLite safety.
 *
 * Usage: npx tsx scripts/import-chapter-content.ts <bookId>
 *        npx tsx scripts/import-chapter-content.ts --all
 */

import { chromium, Page } from 'playwright'
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

interface Chunk {
  chapterId: string
  content: string
  imageUrls: string | null
  wordCount: number
}

async function importBook(bookId: string): Promise<void> {
  const book = await prisma.book.findUnique({ where: { id: bookId } })
  if (!book) { console.log(`  ⏭️  Book ${bookId} not found`); return }

  const chapters = await prisma.chapter.findMany({
    where: { bookId }, orderBy: { orderNum: 'asc' },
  })
  if (!chapters.length) { console.log(`  ⏭️  No chapters for ${book.title}`); return }

  const existing = new Map(
    (await prisma.pageContent.findMany({
      where: { chapterId: { in: chapters.map(c => c.id) } },
      select: { chapterId: true },
    })).map(c => [c.chapterId, true])
  )

  const todo = chapters.filter(c => !existing.has(c.id))
  if (!todo.length) { console.log(`  ✅ All ${chapters.length} done for ${book.title}`); return }

  console.log(`\n📖 ${book.title} (${bookId}): ${todo.length}/${chapters.length}`)

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox'],
  })
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1280, height: 800 },
  })
  const page = await context.newPage()
  let v3Pages: any[] = []

  page.on('response', async (response) => {
    if (response.url().includes('/api/ancientlib/read/book/pages/v3/')) {
      try {
        const json = await response.json()
        if (json.errorCode === 0 && json.data?.pages) v3Pages = json.data.pages
      } catch {}
    }
  })

  let totalChars = 0, totalImages = 0, imported = 0, errors = 0
  const batch: Chunk[] = []

  for (let i = 0; i < todo.length; i++) {
    const ch = todo[i]
    v3Pages = []

    try {
      await page.goto(`${BASE}/book/${bookId}/chapter/${ch.id}`, {
        waitUntil: 'domcontentloaded', timeout: 15000,
      })
      await page.waitForTimeout(600)

      const text = await page.evaluate(() => {
        const el = document.querySelector('section.read-layout-content')
        return el?.textContent?.trim() || ''
      })

      const images = (v3Pages || []).map((p: any) => p.picUrl)
      const wc = text.replace(/\s/g, '').length

      batch.push({
        chapterId: ch.id,
        content: text,
        imageUrls: images.length ? JSON.stringify(images) : null,
        wordCount: wc,
      })
      totalChars += wc
      totalImages += images.length
      if (text || images.length) imported++

      process.stdout.write(`  [${i + 1}/${todo.length}] ${ch.title.slice(0, 22).padEnd(22)} ${String(wc).padStart(6)}字 ${images.length}图\n`)
    } catch (e: any) {
      errors++
      batch.push({ chapterId: ch.id, content: '', imageUrls: null, wordCount: 0 })
      process.stdout.write(`  [${i + 1}/${todo.length}] ${ch.title.slice(0, 22).padEnd(22)} ❌ ${e.message?.slice(0, 40)}\n`)
      if (errors >= 20) { console.log(`  ⛔ ${errors} errors, aborting`); break }
    }

    // Flush every 20 chapters
    if (batch.length >= 20 || i === todo.length - 1) {
      for (const b of batch) {
        await prisma.pageContent.upsert({
          where: { chapterId: b.chapterId },
          create: b,
          update: { content: b.content, imageUrls: b.imageUrls, wordCount: b.wordCount, dataVersion: { increment: 1 } },
        })
      }
      batch.length = 0
    }
  }

  await browser.close()
  console.log(`  ✅ ${book.title}: ${imported}章 ${(totalChars / 10000).toFixed(1)}万字 ${totalImages}图${errors ? ` err:${errors}` : ''}`)
}

async function main() {
  const args = process.argv.slice(2)
  const allFlag = args.includes('--all')
  const bookIdArg = args.find(a => !a.startsWith('--'))

  if (allFlag) {
    const books = await prisma.book.findMany({
      where: { totalChapters: { gt: 0 } },
      orderBy: { totalChapters: 'desc' },
    })
    console.log(`\n=== ${books.length} books ===`)
    for (const b of books) await importBook(b.id)
    const cnt = await prisma.pageContent.count()
    const stats = await prisma.pageContent.aggregate({ _sum: { wordCount: true } })
    console.log(`\n✅ Total: ${cnt} chapters, ${((stats._sum.wordCount ?? 0) / 10000).toFixed(1)}万字`)
  } else if (bookIdArg) {
    await importBook(bookIdArg)
  } else {
    console.log('Usage: npx tsx scripts/import-chapter-content.ts <bookId>')
    console.log('       npx tsx scripts/import-chapter-content.ts --all')
  }
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); return prisma.$disconnect() })

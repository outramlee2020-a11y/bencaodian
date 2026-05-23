/**
 * Import chapters for all medical books that have 0 chapters.
 * Visits each book page via Playwright to capture the API catalog data.
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

// Medical books that need chapter import (0 chapters currently)
const MEDICAL_BOOKS = [
  { id: 'NCM011X412004000777', name: '經史證類大觀本草' },
  { id: 'NA06195', name: '神農本草經疏' },
  { id: '7435216307680706598', name: '本草綱目' },
  { id: 'CADAL02092919', name: '本草衍義' },
  { id: 'SBCK076', name: '註解傷寒論' },
  { id: 'DZ1163', name: '孫真人備急千金要方' },
  { id: 'SBCK072', name: '黃帝內經' },
  { id: 'SK1422', name: '傷寒論注釋' },
  { id: 'SK1509', name: '蘭臺範軌' },
  { id: 'SK1420', name: '鍼灸甲乙經' },
  { id: 'NA08071', name: '醫學三字經' },
  { id: 'K1446', name: '佛說醫喻經' },
  { id: 'K0998', name: '佛說佛醫經' },
  { id: 'K1219', name: '迦葉仙人說醫女人經' },
  { id: 'NA06231', name: '仲景全書' },
  { id: 'CADAL02020107', name: '醫案類語' },
  { id: 'NA08297', name: '新鐫陶節庵家藏傷寒六書' },
  { id: 'NA08289', name: '校刻傷寒圖歌活人指掌' },
  { id: 'NCM011X412004000794', name: '重刊巢氏諸病源候總論' },
  { id: 'NCM011X411999031728', name: '傷寒舌鑒' },
  { id: 'NA08267', name: '註解傷寒論' },
  { id: 'CADAL01024256', name: '傷寒百證歌' },
  { id: 'NA06096', name: '鍼灸節要' },
  { id: 'NCM011X411999022533', name: '鍼灸擇日編集' },
  { id: 'CADAL02092666', name: '黃帝內經太素' },
  { id: 'CADAL02092686', name: '黃帝內經靈樞注證發微' },
  { id: 'CADAL02054859', name: '難經經釋' },
  { id: 'DZ1021', name: '黃帝內經素問遺篇' },
  { id: 'DZ1019', name: '黃帝內經靈樞略' },
  { id: 'DZ1018', name: '黃帝內經素問補注釋文' },
  { id: '7623198651925397513', name: '食療本草' },
  { id: 'NGJ89241199902754747156', name: '本草發明蒙筌' },
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
  // Skip if already has chapters
  const existing = await prisma.book.findUnique({ where: { id: bookId } })
  if (!existing) {
    console.log(`  ⏭️  Book ${bookId} not in database, skipping`)
    return
  }
  if ((existing.totalChapters ?? 0) > 0) {
    console.log(`  ⏭️  Already has ${existing.totalChapters} chapters: ${existing.title}`)
    return
  }

  console.log(`\n📖 ${existing.title} (${bookId})`)

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
    await page.goto(`${BASE}/book/${bookId}`, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(3000)

    const bookApiData = Object.values(apiData).find((d: any) => d?.bookInfo?.bookId === bookId)
    const bookInfo = bookApiData?.bookInfo as any

    if (!bookInfo) {
      console.log(`  ⚠️  No API data — page may not have book info`)
      await browser.close()
      return
    }

    // Update book metadata with richer data from API
    const authors: { persName: string; dynastyName?: string }[] = bookInfo.authors || []
    let description = ''
    if (bookInfo.abstract) {
      description = bookInfo.abstract
        .map((block: any) => block.lines?.map((l: any) => l.content).join('') || '')
        .join('\n')
    }

    await prisma.book.update({
      where: { id: bookId },
      data: {
        title: bookInfo.bookName || existing.title,
        titleCn: bookInfo.bookName || null,
        author: authors.map((a) => a.persName).join('、') || existing.author,
        authorDynasty:
          authors.filter((a) => a.dynastyName).map((a) => a.dynastyName).join('、') || null,
        description: description || existing.description,
        edition: bookInfo.edition?.edition || null,
        editionDynasty: bookInfo.edition?.editionDynastyName || null,
        coverUrl: bookInfo.coverUrl || existing.coverUrl,
        beautifulCover: bookInfo.beautifulCover || null,
        dynasty: bookInfo.dynastyCategoryName || null,
        version: bookInfo.version || 0,
        checkType: bookInfo.checkType || 1,
      },
    })

    // Import chapters from catalog
    const catalog = bookInfo.catalog
    if (catalog?.chapters) {
      const flatChapters = flattenChapters(catalog.chapters)
      console.log(`  📄 ${flatChapters.length} chapters...`)

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
          if (!e.message?.includes('Unique constraint')) {
            console.warn(`    ⚠️  ${ch.chapterId}: ${e.message?.slice(0, 60)}`)
          }
        }
      }

      await prisma.book.update({
        where: { id: bookId },
        data: { totalChapters: flatChapters.length },
      })
      console.log(`  ✅ ${imported}/${flatChapters.length}`)
    } else {
      console.log(`  📝 No catalog data in API response`)
    }
  } catch (e: any) {
    console.error(`  ❌ ${e.message?.slice(0, 100)}`)
  }

  await browser.close()
}

// --- Main ---
async function main() {
  console.log('=== Importing chapters for medical books ===')
  console.log(`Total: ${MEDICAL_BOOKS.length} books\n`)

  for (const book of MEDICAL_BOOKS) {
    const existing = await prisma.book.findUnique({
      where: { id: book.id },
      select: { totalChapters: true, title: true },
    })
    if (!existing || (existing.totalChapters ?? 0) > 0) continue

    await importBook(book.id)
    await new Promise((r) => setTimeout(r, 1000))
  }

  // Final stats
  const totalChapters = await prisma.chapter.count()
  const booksWithChapters = await prisma.book.count({ where: { totalChapters: { gt: 0 } } })
  console.log(`\n=== Database stats ===`)
  console.log(`  ${booksWithChapters} books have chapters`)
  console.log(`  ${totalChapters} total chapters`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})

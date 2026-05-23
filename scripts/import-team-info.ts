/**
 * Import team/contributor info from shidianguji using Playwright
 *
 * Visits each book page, intercepts the team API response,
 * and saves teamName/teamId/contributors to the Book table.
 *
 * Usage: npx tsx scripts/import-team-info.ts
 *        npx tsx scripts/import-team-info.ts SBCK078
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

interface TeamInfo {
  teamId?: string
  teamName?: string
  teamNameEn?: string
  contributors?: { role: string; name: string }[]
}

async function fetchTeamInfo(page: Page, bookId: string): Promise<TeamInfo> {
  let teamData: any = null
  let hasTeam = false

  let contributorData: any = null

  const onResponse = async (response: any) => {
    const url = response.url()
    // /api/ancientlib/read/team/get/ -> .data.team
    if (url.includes('/team/get/')) {
      try {
        const json = await response.json()
        if (json.errorCode === 0 && json.data?.team) {
          teamData = json.data.team
          hasTeam = true
        }
      } catch {}
    }
    // /api/ancientlib/read/book/contributor/list/ -> .data.userList
    if (url.includes('/contributor/list/')) {
      try {
        const json = await response.json()
        if (json.errorCode === 0 && json.data?.userList) {
          contributorData = json.data.userList
        }
      } catch {}
    }
  }

  page.on('response', onResponse)

  try {
    await page.goto(`${BASE}/book/${bookId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    })
    await page.waitForTimeout(2000)
  } catch { /* ignore */ }

  page.removeListener('response', onResponse)

  // Parse team info
  const info: TeamInfo = {}
  if (teamData) {
    info.teamId = teamData.teamId
    info.teamName = teamData.teamName
  }
  if (contributorData?.length) {
    info.contributors = contributorData.map((c: any) => ({
      role: '校对/整理',
      name: c.userName || '',
    }))
  }

  return info
}

async function importTeamInfo(bookId?: string) {
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

  const books = bookId
    ? [await prisma.book.findUnique({ where: { id: bookId } })].filter(Boolean)
    : await prisma.book.findMany({ orderBy: { totalChapters: 'desc' } })

  console.log(`\n=== Importing team info for ${books.length} books ===`)

  let updated = 0
  let skipped = 0

  for (const book of books as any[]) {
    if (!book) continue

    // Check if already has team info
    if (book.teamName) {
      console.log(`  ⏭️  ${book.title}: already has team "${book.teamName}"`)
      skipped++
      continue
    }

    const info = await fetchTeamInfo(page, book.id)

    if (info.teamName || info.contributors?.length) {
      await prisma.book.update({
        where: { id: book.id },
        data: {
          teamId: info.teamId || null,
          teamName: info.teamName || null,
          contributors: info.contributors?.length ? JSON.stringify(info.contributors) : null,
        },
      })
      updated++
      console.log(`  ✅ ${book.title}: team="${info.teamName}" contributors=${info.contributors?.length || 0}`)
    } else {
      console.log(`  ⏭️  ${book.title}: no team data`)
      skipped++
    }

    await new Promise((r) => setTimeout(r, 1000))
  }

  await browser.close()
  console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped`)
}

async function main() {
  const args = process.argv.slice(2)
  const bookId = args.find((a) => !a.startsWith('--'))
  await importTeamInfo(bookId)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('Fatal:', e)
  return prisma.$disconnect()
})

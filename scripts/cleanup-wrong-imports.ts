import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

// Wrongly matched books (seed-data had wrong HY book IDs — HY IDs are different books)
// Also remove duplicates and clearly non-medical books
const WRONG_IMPORTS = [
  'HY1492', // 识典古籍 (not a real book)
  'HY1493', // 坤德寶鑑 (seed-data said 傷寒論 — wrong)
  'HY1501', // 新編簪纓必用翰苑新書 (seed-data said 本草綱目 — wrong)
  'HY1510', // 新刋群書攷正性理大全 (seed-data said 神農本草經 — wrong)
  'HY1520', // 言行彙纂 (seed-data said 金匱要略 — wrong)
  'HY1530', // 廸吉錄 (seed-data said 針灸甲乙經 — wrong)
  'HY1600', // 大藏一覽 (seed-data said 諸病源候論 — wrong)
  'HY1650', // 新刋方脉主意 (seed-data said 醫宗金鑑 — wrong)
  'NA05254', // 醫藏目錄 (seed-data said 本草原始·本草發明 — wrong)
  'HY1549', // 醫學六要 (seed-data said 本草發明切要 — wrong)
  'HY1625', // 鍼灸甲乙經 (duplicate of SK1420)
]

async function main() {
  console.log('Cleaning up wrong/non-medical imports...')
  
  for (const id of WRONG_IMPORTS) {
    const del = await prisma.chapter.deleteMany({ where: { bookId: id } })
    await prisma.book.delete({ where: { id } }).catch(() => {})
    if (del.count > 0 || true) {
      console.log(`  Removed ${id} (deleted ${del.count} chapters)`)
    }
  }

  // List remaining books
  const books = await prisma.book.findMany({
    select: { id: true, title: true, totalChapters: true, author: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log('\n=== Medical books remaining (' + books.length + ') ===')
  for (const b of books) {
    console.log('  [' + b.id + '] ' + b.title + ' | ' + (b.author || '?') + ' | ch:' + b.totalChapters)
  }
  
  await prisma.$disconnect()
}
main()

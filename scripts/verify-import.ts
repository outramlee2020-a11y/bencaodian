import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

async function main() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  })
  const prisma = new PrismaClient({ adapter })

  const book = await prisma.book.findUnique({
    where: { id: 'SBCK078' },
  })
  console.log('=== Book ===')
  console.log('Title:', book?.title)
  console.log('Author:', book?.author)
  console.log('Dynasty:', book?.dynasty)
  console.log('Chapters:', book?.totalChapters)
  console.log('Edition:', book?.edition)
  console.log('DataSource:', book?.dataSource)

  const chapterCount = await prisma.chapter.count({ where: { bookId: 'SBCK078' } })
  console.log('\n=== Chapter count:', chapterCount, '===')

  const sampleChapters = await prisma.chapter.findMany({
    where: { bookId: 'SBCK078' },
    orderBy: { orderNum: 'asc' },
    take: 10,
  })
  console.log('\nFirst 10 chapters:')
  sampleChapters.forEach((c, i) => {
    console.log(`  ${c.orderNum}. [${c.id}] ${c.title} (level:${c.chapterLevel})`)
  })

  // Show some deep-level chapters
  const level3Chapters = await prisma.chapter.findMany({
    where: { bookId: 'SBCK078', chapterLevel: 3 },
    orderBy: { orderNum: 'asc' },
    take: 5,
  })
  if (level3Chapters.length > 0) {
    console.log('\nSample level-3 (deepest) chapters:')
    level3Chapters.forEach((c) => {
      const parent = c.parentId ? ` [parent: ${c.parentId}]` : ''
      console.log(`  [${c.id}] ${c.title}${parent}`)
    })
  }

  await prisma.$disconnect()
}
main()

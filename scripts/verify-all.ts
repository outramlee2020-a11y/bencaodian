import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const books = await prisma.book.findMany({
    where: { totalChapters: { gt: 0 } },
    select: { id: true, title: true, author: true, dynasty: true, totalChapters: true, dataSource: true },
    orderBy: { totalChapters: 'desc' },
  })

  const totalChapters = books.reduce((sum, b) => sum + b.totalChapters, 0)

  console.log('=== Books with chapters (' + books.length + ' total, ' + totalChapters + ' chapters) ===\n')
  console.log('Rank | Book ID | Title | Author | Dynasty | Chapters')
  console.log('--- | --- | --- | --- | --- | ---')
  books.forEach((b, i) => {
    console.log(
      (i + 1) + ' | ' + b.id + ' | ' + b.title + ' | ' + (b.author || '-') + ' | ' + (b.dynasty || '-') + ' | ' + b.totalChapters
    )
  })

  await prisma.$disconnect()
}
main()

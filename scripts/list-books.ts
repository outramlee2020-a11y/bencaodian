import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const books = await prisma.book.findMany({
    select: { id: true, title: true, totalChapters: true, author: true },
    orderBy: { createdAt: 'asc' },
  })
  console.log('Books in database (' + books.length + ' total):')
  for (const b of books) {
    console.log('  [' + b.id + '] ' + b.title + ' | author=' + (b.author || '?') + ' | chapters=' + b.totalChapters)
  }
  await prisma.$disconnect()
}
main()

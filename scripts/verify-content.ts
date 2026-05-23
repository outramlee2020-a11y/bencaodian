import { PrismaClient } from '../src/generated/prisma/client.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' })
const prisma = new PrismaClient({ adapter })

async function main() {
  const ch = await prisma.chapter.findFirst({
    where: { bookId: 'SBCK078' },
    include: { content: true },
  })
  if (ch?.content) {
    console.log('Chapter: ' + ch.title)
    console.log('Content length: ' + ch.content.content.length + ' chars')
    console.log('Word count: ' + ch.content.wordCount)
    console.log('Has images: ' + !!ch.content.imageUrls)
    console.log('Preview: ' + ch.content.content.slice(0, 300))
  } else {
    console.log('No content for SBCK078, checking any...')
    const anyPC = await prisma.pageContent.findFirst()
    console.log('Any pageContent: ' + (anyPC ? anyPC.chapterId : 'none'))
  }
  await prisma.$disconnect()
}
main()

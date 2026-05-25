import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchShidianguji, getShidiangujiBook, getChapterContent } from '@/lib/shidianguji-api'

/** Map dynasty/category name to a category ID */
function getCategoryId(name: string): string | null {
  const map: Record<string, string> = {
    'jing': 'jing', '经部': 'jing',
    'shi': 'shi', '史部': 'shi',
    'zi': 'zi', '子部': 'zi',
    'ji': 'ji', '集部': 'ji',
    'dao': 'dao', '道教部': 'dao', '道教': 'dao',
    'fo': 'fo', '佛教部': 'fo', '佛教': 'fo',
  }
  for (const [key, val] of Object.entries(map)) {
    if (name.includes(key)) return val
  }
  if (name.includes('医') || name.includes('本草')) return 'zi'
  return null
}

// GET /api/admin/import - List import jobs
export async function GET() {
  const jobs = await prisma.importJob.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ success: true, data: jobs })
}

// POST /api/admin/import - Enqueue an import job
export async function POST(request: NextRequest) {
  try {
    const { bookId, action } = await request.json()

    if (!bookId) {
      return NextResponse.json({ success: false, error: '缺少 bookId' }, { status: 400 })
    }

    if (action === 'search') {
      // Search for books by keyword and import metadata
      const query = bookId
      const results = await searchShidianguji(query)
      let imported = 0
      for (const r of results.slice(0, 50)) {
        try {
          await prisma.book.upsert({
            where: { id: r.bookId },
            create: {
              id: r.bookId,
              title: r.bookTitle || r.bookId,
              titleCn: r.bookTitle || null,
              author: r.bookAuthor || null,
              authorDynasty: r.bookDynasty || null,
              edition: r.edition || null,
              coverUrl: r.coverUrl || r.beautifulCover || null,
              version: r.version || 0,
              checkType: r.checkType || 1,
              categoryId: r.dynastyCategoryName ? getCategoryId(r.dynastyCategoryName) : null,
              dataSource: 'shidianguji',
            },
            update: {
              title: r.bookTitle,
              titleCn: r.bookTitle,
              author: r.bookAuthor,
              authorDynasty: r.bookDynasty,
              edition: r.edition,
              coverUrl: r.coverUrl || r.beautifulCover,
              version: r.version,
              checkType: r.checkType,
            },
          })
          imported++
        } catch { /* skip */ }
      }
      return NextResponse.json({ success: true, data: { total: results.length, imported } })
    }

    if (action === 'import') {
      // Create an import job for a single book
      const existing = await prisma.importJob.findFirst({
        where: { bookId, status: { in: ['pending', 'running'] } },
      })
      if (existing) {
        return NextResponse.json({ success: false, error: '该书已在导入队列中' }, { status: 409 })
      }

      const book = await prisma.book.findUnique({ where: { id: bookId } })
      const job = await prisma.importJob.create({
        data: {
          bookId,
          bookTitle: book?.titleCn || book?.title || bookId,
          status: 'running',
          startedAt: new Date(),
        },
      })

      // Run import async (don't await)
      importBookContents(job.id, bookId).catch(err => {
        console.error('Import job failed:', err)
      })

      return NextResponse.json({ success: true, data: job })
    }

    if (action === 'batch') {
      // Batch import: search TCM keywords and enqueue all found books
      const tcmKeywords = ['本草', '医', '伤寒', '内经', '针灸', '脉', '证', '方']
      let total = 0
      const allBooks = new Map<string, any>()

      for (const kw of tcmKeywords) {
        const results = await searchShidianguji(kw)
        for (const r of results.slice(0, 30)) {
          if (!allBooks.has(r.bookId)) allBooks.set(r.bookId, r)
        }
      }

      // Save all found books to DB
      for (const r of allBooks.values()) {
        try {
          await prisma.book.upsert({
            where: { id: r.bookId },
            create: {
              id: r.bookId,
              title: r.bookTitle || r.bookId,
              titleCn: r.bookTitle || null,
              author: r.bookAuthor || null,
              authorDynasty: r.bookDynasty || null,
              coverUrl: r.coverUrl || r.beautifulCover || null,
              version: r.version || 0,
              checkType: r.checkType || 1,
              categoryId: r.dynastyCategoryName ? getCategoryId(r.dynastyCategoryName) : null,
              dataSource: 'shidianguji',
            },
            update: {},
          })
          total++
        } catch { /* skip */ }
      }

      return NextResponse.json({ success: true, data: { found: allBooks.size, saved: total } })
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 })
  } catch (error) {
    console.error('Admin import error:', error)
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 })
  }
}

async function importBookContents(jobId: string, bookId: string) {
  try {
    // Fetch book detail (includes chapter list) via direct function call
    const bookData = await getShidiangujiBook(bookId)
    if (!bookData || !bookData.chapterNames?.length) {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: 'failed', error: '获取章节列表失败', completedAt: new Date() },
      })
      return
    }

    // Build chapter list from chapterNames (each entry has lines with content)
    const chapters: { id: string; title: string; level: number; order: number }[] = []
    let order = 0
    for (const group of bookData.chapterNames) {
      for (const line of (group.lines || [])) {
        order++
        // Generate a stable id from bookId + order
        const chId = `${bookId}_ch${order}`
        chapters.push({ id: chId, title: line.content || `第${order}节`, level: 1, order })
      }
    }

    const totalChapters = chapters.length
    let importedCount = 0

    await prisma.importJob.update({
      where: { id: jobId },
      data: { totalChapters },
    })

    // Save chapters
    for (const ch of chapters) {
      try {
        await prisma.chapter.upsert({
          where: { id: ch.id },
          create: {
            id: ch.id,
            bookId,
            title: ch.title,
            chapterLevel: ch.level,
            chapterType: 1,
            parentId: null,
            orderNum: ch.order,
          },
          update: {
            title: ch.title,
            chapterLevel: ch.level,
            orderNum: ch.order,
          },
        })

        // Try to import content for this chapter via direct function call
        try {
          const contentData = await getChapterContent(bookId, ch.id)
          if (contentData?.text) {
            await prisma.pageContent.upsert({
              where: { chapterId: ch.id },
              create: {
                chapterId: ch.id,
                content: contentData.text,
                imageUrls: contentData.imageUrls.length > 0 ? JSON.stringify(contentData.imageUrls) : null,
                wordCount: contentData.text.length,
              },
              update: {
                content: contentData.text,
                imageUrls: contentData.imageUrls.length > 0 ? JSON.stringify(contentData.imageUrls) : null,
                wordCount: contentData.text.length,
              },
            })
          }
        } catch { /* content not available, skip */ }

        importedCount++
        const progress = Math.round((importedCount / totalChapters) * 100)
        await prisma.importJob.update({
          where: { id: jobId },
          data: { importedChapters: importedCount, progress },
        })
      } catch { /* skip individual chapter errors */ }
    }

    // Update book totalChapters
    await prisma.book.update({
      where: { id: bookId },
      data: { totalChapters },
    })

    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'completed', progress: 100, completedAt: new Date() },
    })
  } catch (error) {
    console.error('Import book contents error:', error)
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'failed', error: String(error), completedAt: new Date() },
    }).catch(() => {})
  }
}

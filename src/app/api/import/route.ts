/**
 * 数据导入 API
 * 
 * POST /api/import?phase=stats       - 显示当前数据库统计
 * POST /api/import?phase=search&q=本草 - 搜索书籍并导入
 * POST /api/import?phase=book&id=SBCK078 - 导入单本书详情
 * POST /api/import?phase=categories  - 导入分类树
 * POST /api/import?phase=batch-search - 批量搜索热门词条导入书籍
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchShidianguji } from '@/lib/shidianguji-api'

/**
 * Map a dynasty/category name to a category ID
 */
function getCategoryId(dynastyOrCategory: string): string | null {
  const map: Record<string, string> = {
    'jing': 'jing', '经部': 'jing',
    'shi': 'shi', '史部': 'shi',
    'zi': 'zi', '子部': 'zi',
    'ji': 'ji', '集部': 'ji',
    'dao': 'dao', '道教部': 'dao', '道教': 'dao',
    'fo': 'fo', '佛教部': 'fo', '佛教': 'fo',
  }
  // Extract traditional category name if present
  for (const [key, val] of Object.entries(map)) {
    if (dynastyOrCategory.includes(key)) return val
  }
  // Default to 子部 for medical books
  if (dynastyOrCategory.includes('医') || dynastyOrCategory.includes('本草')) return 'zi'
  return null
}



export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phase = searchParams.get('phase') || 'stats'
  const query = searchParams.get('q') || ''
  const bookId = searchParams.get('id') || ''

  try {
    switch (phase) {
      case 'stats': {
        const [bookCount, chapterCount, contentCount, categoryCount] = await Promise.all([
          prisma.book.count(),
          prisma.chapter.count(),
          prisma.pageContent.count(),
          prisma.category.count(),
        ])

        // Also get counts by data source
        const shidiangujiCount = await prisma.book.count({
          where: { dataSource: 'shidianguji' },
        })
        const manualCount = await prisma.book.count({
          where: { dataSource: 'manual' },
        })

        return NextResponse.json({
          success: true,
          data: {
            books: {
              total: bookCount,
              fromShidianguji: shidiangujiCount,
              manual: manualCount,
            },
            chapters: chapterCount,
            pageContents: contentCount,
            categories: categoryCount,
          },
        })
      }

      case 'search': {
        if (!query) {
          return NextResponse.json(
            { success: false, error: '请提供搜索关键词 q' },
            { status: 400 }
          )
        }

        const results = await searchShidianguji(query)
        const imported: string[] = []
        const failed: string[] = []

        for (const r of results.slice(0, 50)) {
          // Search results already have rich metadata from _ROUTER_DATA
          let title = r.bookTitle
          let author = r.bookAuthor
          let dynasty = r.bookDynasty || r.dynastyCategoryName
          let edition = r.edition || ''
          let coverUrl = r.coverUrl || r.beautifulCover || ''

          try {
            await prisma.book.upsert({
              where: { id: r.bookId },
              create: {
                id: r.bookId,
                title: title || r.bookId,
                titleCn: title || null,
                author: author || null,
                authorDynasty: dynasty || null,
                edition: edition || null,
                coverUrl: coverUrl || null,
                version: r.version || 0,
                checkType: r.checkType || 1,
                categoryId: r.dynastyCategoryName ? getCategoryId(r.dynastyCategoryName) : null,
                dataSource: 'shidianguji',
              },
              update: {
                title: title,
                titleCn: title,
                author: author,
                authorDynasty: dynasty,
                edition: edition,
                coverUrl: coverUrl,
                version: r.version,
                checkType: r.checkType,
                categoryId: r.dynastyCategoryName ? getCategoryId(r.dynastyCategoryName) : undefined,
              },
            })
            imported.push(r.bookId)
          } catch (e) {
            console.error(`Failed to save book ${r.bookId}:`, e)
            failed.push(r.bookId)
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            query,
            totalResults: results.length,
            imported: imported.length,
            failed: failed.length,
            bookIds: imported,
          },
        })
      }

      case 'book': {
        if (!bookId) {
          return NextResponse.json(
            { success: false, error: '请提供书籍 ID' },
            { status: 400 }
          )
        }

        // Book details are CSR - search the site for rich data
        // or use Playwright import for full details
        return NextResponse.json({
          success: false,
          error: '单本书详情页为 CSR，请通过 search API 导入，或使用 Playwright 管线',
        })
      }

      case 'categories': {
        // Since we can't access the category API directly, 
        // let's import the standard Siku Quanshu categories
        const standardCategories = [
          { id: 'jing', name: '经部', nameEn: 'Confucian Classics' },
          { id: 'shi', name: '史部', nameEn: 'History' },
          { id: 'zi', name: '子部', nameEn: 'Philosophy' },
          { id: 'ji', name: '集部', nameEn: 'Literature' },
          { id: 'dao', name: '道教部', nameEn: 'Taoist' },
          { id: 'fo', name: '佛教部', nameEn: 'Buddhist' },
        ]

        for (const cat of standardCategories) {
          await prisma.category.upsert({
            where: { id: cat.id },
            create: cat,
            update: cat,
          })
        }

        return NextResponse.json({
          success: true,
          data: { categories: standardCategories },
        })
      }

      case 'sync': {
        // Sync seed data categories into the database
        const seedCategories = [
          { id: 'jing', name: '经部', nameEn: 'Confucian Classics' },
          { id: 'shi', name: '史部', nameEn: 'History' },
          { id: 'zi', name: '子部', nameEn: 'Philosophy' },
          { id: 'ji', name: '集部', nameEn: 'Literature' },
          { id: 'fo', name: '佛教部', nameEn: 'Buddhist' },
          { id: 'dao', name: '道教部', nameEn: 'Taoist' },
        ]
        for (const cat of seedCategories) {
          await prisma.category.upsert({ where: { id: cat.id }, create: cat, update: cat })
        }
        return NextResponse.json({ success: true, data: { categories: seedCategories } })
      }

      case 'batch-search': {
        // Batch search for TCM-related keywords to discover books
        const tcmKeywords = [
          '本草', '医', '药', '方', '伤寒', '内经', '针灸',
          '脉', '证', '病', '养生', '食疗', '炮制',
        ]

        const allResults = new Map<string, any>()
        let totalFound = 0
        let totalImported = 0

        for (const keyword of tcmKeywords) {
          const results = await searchShidianguji(keyword)
          totalFound += results.length

          for (const r of results.slice(0, 30)) {
            if (!allResults.has(r.bookId)) {
              allResults.set(r.bookId, r)
            }
          }
        }

        const uniqueBooks = Array.from(allResults.values())
        console.log(`Found ${uniqueBooks.length} unique books from ${tcmKeywords.length} searches`)

        return NextResponse.json({
          success: true,
          data: {
            keywords: tcmKeywords,
            totalFound,
            uniqueBooks: uniqueBooks.length,
            sampleResults: uniqueBooks.slice(0, 20).map(r => ({
              bookId: r.bookId,
              bookTitle: r.bookTitle,
              bookAuthor: r.bookAuthor,
              bookDynasty: r.bookDynasty,
            })),
            note: 'Results found but will need Playwright to fetch full details due to API security tokens on detail pages',
          },
        })
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown phase: ${phase}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'

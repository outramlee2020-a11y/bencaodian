/**
 * 识典古籍数据导入管线
 * 
 * 使用 Playwright 遍历目标网站的 API 并导入所有古籍数据到本地数据库。
 * 
 * 运行方式: npx tsx src/lib/import-pipeline.ts --phase=metadata
 * 阶段: 
 *   metadata  - 导入所有书籍元数据和章节结构
 *   chapters  - 导入章节正文内容（需要先运行 metadata）
 *   all       - 全部导入
 */

import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { chromium, Browser, Page } from 'playwright'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
})
const prisma = new PrismaClient({ adapter })

const BASE = 'https://www.shidianguji.com'
const API_BASE = `${BASE}/api/ancientlib/read`

// === Type definitions from the API ===

interface SDGCategory {
  cateId: string
  cateName: string
  parentCateId: string
  pointList: SDGCategory[]
  total: number
}

interface SDGBookListItem {
  bookId: string
  bookName: string
  addNames: string[]
  version: number
  authors: { persName: string; responsibleTypeStr: string; dynastyName: string }[]
  dynastyCategoryName: string
  coverUrl: string
  beautifulCover: string
  checkType: number
  edition: { edition: string; editionDynastyName: string }
  traditionalCategory: { cateId: string; cateName: string }[]
}

interface SDGCatalogChapter {
  chapterId: string
  chapterType: number
  chapterLevel: number
  chapterName: { content: string }[]
  parentChapterId: string
  startPageNum: number
  paragraphCount: number
  volumeId: string
  volumeVersion: number
  hasMainContent: boolean
  subChapters: SDGCatalogChapter[]
}

interface SDGBookInfo {
  bookId: string
  bookName: string
  addNames: string[]
  version: number
  authors: { persName: string; responsibleTypeStr: string; dynastyName: string; dynastyCateId: string }[]
  dynastyCategoryName: string
  coverUrl: string
  beautifulCover: string
  abstract: { lines: { content: string }[]; indent: number; textIndent: boolean }[]
  checkType: number
  catalog: { chapters: SDGCatalogChapter[] }
  edition: { edition: string; editionDynastyName: string }
  traditionalCategory: { cateId: string; cateName: string; parentCateId: string }[]
}

interface ImportStats {
  categories: number
  books: number
  chapters: number
  contentChapters: number
}

// === Pipeline ===

class ShidiangujiImporter {
  private browser: Browser | null = null
  private page: Page | null = null
  private stats: ImportStats = { categories: 0, books: 0, chapters: 0, contentChapters: 0 }
  private currentPhase: string = 'metadata'

  async init(headless: boolean = true) {
    console.log('🚀 Launching browser...')
    this.browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const context = await this.browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    })
    this.page = await context.newPage()

    // Intercept network requests to capture API responses
    await this.page.route('**/api/ancientlib/read/**', async (route) => {
      route.continue()
    })

    console.log('🌐 Navigating to shidianguji.com...')
    await this.page.goto(`${BASE}/library`, { waitUntil: 'networkidle', timeout: 30000 })
    console.log('✅ Page loaded successfully')
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
      this.page = null
    }
  }

  /**
   * Execute JavaScript in the page context to call the API and get the result
   */
  private async callAPI<T>(url: string, options?: { method?: string; body?: any }): Promise<T> {
    if (!this.page) throw new Error('Browser not initialized')

    const result = await this.page.evaluate(async (args) => {
      const response = await fetch(args.url, {
        method: args.method || 'GET',
        headers: {
          accept: 'application/json, text/plain, */*',
          'content-type': 'application/json',
          'client-type': 'web',
        },
        body: args.body ? JSON.stringify(args.body) : undefined,
      })
      return response.json()
    }, { url, method: options?.method || 'GET', body: options?.body })

    if ((result as any).errorCode !== 0) {
      console.warn(`⚠️  API error for ${url}:`, result)
      return null as T
    }

    return (result as any).data as T
  }

  /**
   * Wait for the page to fully load including all XHR requests
   */
  private async waitForPageLoad() {
    if (!this.page) throw new Error('Browser not initialized')
    await this.page.waitForLoadState('networkidle')
    // Extra wait for async API calls to complete
    await this.page.waitForTimeout(2000)
  }

  // ============ Phase 1: Import Categories ============

  async importCategories() {
    console.log('\n📚 Phase 1: Importing categories...')
    
    // Navigate to library page to trigger category tree API call
    if (!this.page) throw new Error('Browser not initialized')
    await this.page.goto(`${BASE}/library`, { waitUntil: 'networkidle', timeout: 30000 })
    await this.waitForPageLoad()

    // Try to call the category tree API
    // Need to get security tokens from the page first
    const categoryTree = await this.getCategoryTreeFromPage()
    
    if (!categoryTree || categoryTree.length === 0) {
      console.log('⚠️  Could not get category tree from API, trying SSR data...')
      await this.importCategoriesFromSSR()
      return
    }

    for (const root of categoryTree) {
      await this.saveCategoryTree(root)
    }

    console.log(`✅ Imported ${this.stats.categories} categories`)
  }

  /**
   * Extract category tree by evaluating JS on the page
   */
  private async getCategoryTreeFromPage(): Promise<SDGCategory[]> {
    if (!this.page) throw new Error('Browser not initialized')

    // Wait for all network requests to complete
    await this.page.waitForTimeout(3000)

    // Try to call the API via page context
    const tokenData = await this.page.evaluate(() => {
      // Extract the security tokens from script tags or global variables
      const scripts = document.querySelectorAll('script')
      let verifyFp = ''
      let msToken = ''
      
      // Try to find tokens from various sources
      for (const script of scripts) {
        const text = script.textContent || ''
        if (text.includes('verifyFp')) {
          const match = text.match(/verifyFp=([^&"'\s]+)/)
          if (match) verifyFp = match[1]
        }
        if (text.includes('msToken')) {
          const match = text.match(/msToken=([^&"'\s]+)/)
          if (match) msToken = match[1]
        }
        if (verifyFp && msToken) break
      }
      
      return { verifyFp, msToken }
    })

    if (tokenData.verifyFp && tokenData.msToken) {
      const url = `${window.location.origin}/api/ancientlib/read/get/nonempty-traditional-category-tree/?verifyFp=${tokenData.verifyFp}&fp=${tokenData.verifyFp}&msToken=${encodeURIComponent(tokenData.msToken)}&a_bogus=1`
      // Try to get category tree via XHR
      return await this.callAPI<SDGCategory[]>(url.replace('window.location.origin', BASE)) || []
    }

    return []
  }

  /**
   * Import categories from the SSR HTML data
   */
  private async importCategoriesFromSSR() {
    if (!this.page) throw new Error('Browser not initialized')
    
    // The SSR page has the data embedded; let's extract it from the rendered DOM
    const categories = await this.page.evaluate(() => {
      const result: { cateId: string; cateName: string; parentCateId: string }[] = []
      
      // Try to extract from rendered navigation tabs
      const tabs = document.querySelectorAll('[class*="cate"], [class*="category"], [class*="tab"]')
      tabs.forEach(tab => {
        const text = tab.textContent?.trim()
        if (text && text.length <= 10 && !result.find(c => c.cateName === text)) {
          result.push({ cateId: text, cateName: text, parentCateId: '' })
        }
      })
      
      return result
    })

    // Save what we can extract
    for (const cat of categories) {
      try {
        await prisma.category.upsert({
          where: { id: cat.cateId },
          create: { id: cat.cateId, name: cat.cateName, parentId: cat.parentCateId || null },
          update: { name: cat.cateName },
        })
        this.stats.categories++
      } catch (e) {
        // Skip duplicates
      }
    }
  }

  private async saveCategoryTree(node: SDGCategory, parentId?: string) {
    const id = node.cateId
    if (!id || id === 'tra_root' || id === 'dyn_root') {
      // Skip root nodes, process children
      for (const child of node.pointList || []) {
        await this.saveCategoryTree(child)
      }
      return
    }

    console.log(`  📂 Category: ${node.cateName} (${id})`)
    
    try {
      await prisma.category.upsert({
        where: { id },
        create: {
          id,
          name: node.cateName,
          parentId: parentId || null,
        },
        update: { name: node.cateName },
      })
      this.stats.categories++
    } catch (e) {
      console.warn(`  ⚠️  Failed to save category ${id}:`, e)
    }

    for (const child of node.pointList || []) {
      await this.saveCategoryTree(child, id)
    }
  }

  // ============ Phase 2: Import Books ============

  async importBooks() {
    console.log('\n📖 Phase 2: Importing book metadata...')
    
    // Get all leaf categories (those that have books)
    const categories = await prisma.category.findMany({
      where: {
        // Only get categories that are under 子部 (10002) or other top-level
        // Filter to get meaningful categories
      },
    })

    console.log(`Found ${categories.length} categories to process`)

    for (const cat of categories) {
      await this.importBooksForCategory(cat.id, cat.name)
    }

    console.log(`✅ Imported ${this.stats.books} books total`)
  }

  private async importBooksForCategory(categoryId: string, categoryName: string) {
    if (!this.page) throw new Error('Browser not initialized')
    console.log(`\n  Processing category: ${categoryName} (${categoryId})`)
    
    let pageNum = 1
    let totalPages = 1
    const maxPages = 100 // Safety limit
    
    while (pageNum <= totalPages && pageNum <= maxPages) {
      // Navigate to the library page for this category
      const url = `${BASE}/library/${categoryId}`
      await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await this.waitForPageLoad()

      // Extract book list from the current page
      const books = await this.extractBooksFromPage()
      
      if (books.length === 0) {
        console.log(`  📄 Page ${pageNum}: No books found, stopping`)
        break
      }

      console.log(`  📄 Page ${pageNum}: Found ${books.length} books`)
      
      for (const book of books) {
        await this.saveBook(book, categoryId)
      }

      // Check if there are more pages
      const hasMore = await this.page.evaluate(() => {
        // Check for pagination buttons
        const nextBtn = document.querySelector('[class*="next"], [class*="pagination"] button:last-child')
        if (nextBtn) {
          const isDisabled = nextBtn.getAttribute('disabled') || nextBtn.classList.contains('disabled')
          return !isDisabled
        }
        // Check for total pages info
        const pageInfo = document.querySelector('[class*="total"], [class*="page-info"]')
        if (pageInfo) {
          const text = pageInfo.textContent || ''
          const match = text.match(/\/\s*(\d+)/)
          if (match) {
            totalPages = parseInt(match[1])
            return pageNum < totalPages
          }
        }
        return false
      })

      if (!hasMore) break
      
      // Click next page
      await this.page.evaluate(() => {
        const nextBtn = document.querySelector('[class*="next"], [class*="pagination"] button:last-child, [aria-label="Next"]')
        if (nextBtn) (nextBtn as HTMLElement).click()
      })
      await this.waitForPageLoad()
      
      pageNum++
    }
  }

  private async extractBooksFromPage(): Promise<SDGBookListItem[]> {
    if (!this.page) throw new Error('Browser not initialized')

    // Try to capture API responses first
    const books = await this.page.evaluate(() => {
      const items: any[] = []
      
      // Try to find book cards/elements in the rendered DOM
      const bookElements = document.querySelectorAll('[class*="book-item"], [class*="book-card"], [class*="book-cover"], [class*="MuiCard"], li a[href*="/book/"]')
      
      bookElements.forEach(el => {
        const link = el.closest('a') || el.querySelector('a')
        const href = link?.getAttribute('href') || ''
        const match = href.match(/\/book\/([^/]+)/)
        
        if (match) {
          const titleEl = el.querySelector('[class*="title"], h1, h2, h3, h4')
          items.push({
            bookId: match[1],
            bookName: titleEl?.textContent?.trim() || match[1],
            authors: [],
            dynastyCategoryName: '',
            coverUrl: '',
            beautifulCover: '',
            checkType: 1,
          })
        }
      })
      
      return items
    })

    return books
  }

  private async saveBook(bookData: SDGBookListItem, categoryId: string) {
    const authors = bookData.authors || []
    const authorName = authors.map(a => a.persName).join('、')
    const authorDynasty = authors.length > 0 ? authors[0].dynastyName : ''
    const responsibleType = authors.length > 0 ? authors[0].responsibleTypeStr : ''

    try {
      await prisma.book.upsert({
        where: { id: bookData.bookId },
        create: {
          id: bookData.bookId,
          title: bookData.bookName || bookData.bookId,
          version: bookData.version || 0,
          author: authorName || null,
          authorDynasty: authorDynasty || null,
          responsibleType: responsibleType || null,
          dynasty: bookData.dynastyCategoryName || authorDynasty || null,
          coverUrl: bookData.coverUrl || null,
          beautifulCover: bookData.beautifulCover || null,
          checkType: bookData.checkType || 1,
          categoryId: categoryId || null,
          dataSource: 'shidianguji',
        },
        update: {
          title: bookData.bookName,
          version: bookData.version,
          author: authorName,
          authorDynasty: authorDynasty,
          dynasty: bookData.dynastyCategoryName || authorDynasty,
          coverUrl: bookData.coverUrl,
          beautifulCover: bookData.beautifulCover,
          checkType: bookData.checkType,
          categoryId: categoryId,
        },
      })
      this.stats.books++
    } catch (e) {
      console.warn(`  ⚠️  Failed to save book ${bookData.bookId}:`, e)
    }
  }

  // ============ Phase 3: Import Chapters ============

  async importChapters() {
    console.log('\n📑 Phase 3: Importing chapter structure...')

    // Get all books that need chapter import
    const books = await prisma.book.findMany({
      where: { dataSource: 'shidianguji' },
      orderBy: { createdAt: 'asc' },
      take: 1000, // Process in batches
    })

    console.log(`Processing ${books.length} books for chapter import`)

    for (let i = 0; i < books.length; i++) {
      const book = books[i]
      console.log(`  [${i + 1}/${books.length}] ${book.title} (${book.id})`)

      try {
        await this.importChaptersForBook(book.id)
      } catch (e) {
        console.warn(`  ⚠️  Failed to import chapters for ${book.id}:`, e)
      }
    }

    console.log(`✅ Imported ${this.stats.chapters} chapters`)
  }

  private async importChaptersForBook(bookId: string) {
    if (!this.page) throw new Error('Browser not initialized')

    // Navigate to the book page
    await this.page.goto(`${BASE}/book/${bookId}`, { waitUntil: 'networkidle', timeout: 30000 })
    await this.waitForPageLoad()

    // Extract catalog from the page
    const catalog = await this.page.evaluate((bId) => {
      // Try to extract the book catalog from the rendered DOM
      const chapters: any[] = []
      
      // Look for catalog/toc elements
      const tocItems = document.querySelectorAll('[class*="catalog"] [class*="item"], [class*="toc"] [class*="item"], [class*="chapter"] [class*="item"], nav a[href*="/chapter/"]')
      
      tocItems.forEach((el, idx) => {
        const href = (el as HTMLAnchorElement).href || el.querySelector('a')?.getAttribute('href') || ''
        const match = href.match(/\/chapter\/([^/]+)/)
        
        chapters.push({
          chapterId: match ? match[1] : `${bId}_ch${idx + 1}`,
          chapterName: el.textContent?.trim() || `Chapter ${idx + 1}`,
          chapterLevel: 1,
          order: idx + 1,
        })
      })

      return chapters
    }, bookId)

    // Also try to update book info from the page
    const bookInfo = await this.page.evaluate(() => {
      const info: any = {}
      
      const titleEl = document.querySelector('h1, [class*="title"]')
      const descEl = document.querySelector('[class*="description"], [class*="abstract"], [class*="summary"]')
      const editionEl = document.querySelector('[class*="edition"], [class*="version"]')
      
      if (titleEl) info.title = titleEl.textContent?.trim()
      if (descEl) info.description = descEl.textContent?.trim()
      if (editionEl) info.edition = editionEl.textContent?.trim()
      
      return info
    })

    // Update book with additional info
    if (bookInfo.title || bookInfo.description) {
      await prisma.book.update({
        where: { id: bookId },
        data: {
          ...(bookInfo.title && bookInfo.title !== bookId ? { title: bookInfo.title } : {}),
          ...(bookInfo.description ? { description: bookInfo.description } : {}),
          ...(bookInfo.edition ? { edition: bookInfo.edition } : {}),
          totalChapters: catalog.length,
        },
      }).catch(() => {})
    }

    // Save chapters
    for (const ch of catalog) {
      try {
        const existing = await prisma.chapter.findUnique({ where: { id: ch.chapterId } })
        if (!existing) {
          await prisma.chapter.create({
            data: {
              id: ch.chapterId,
              bookId,
              title: ch.chapterName || `Chapter ${ch.order}`,
              chapterLevel: ch.chapterLevel || 1,
              orderNum: ch.order || 0,
              hasMainContent: true,
            },
          })
          this.stats.chapters++
        }
      } catch (e) {
        // Chapter might already exist or have ID constraints
      }
    }
  }

  // ============ Phase 4: Import Chapter Content ============

  async importChapterContent() {
    console.log('\n📝 Phase 4: Importing chapter content...')

    const chapters = await prisma.chapter.findMany({
      where: { hasMainContent: true, content: null },
      take: 500, // Process in batches
    })

    console.log(`Processing ${chapters.length} chapters for content import`)

    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i]
      console.log(`  [${i + 1}/${chapters.length}] ${ch.title} (${ch.id})`)

      try {
        await this.importSingleChapterContent(ch.bookId, ch.id)
      } catch (e) {
        console.warn(`  ⚠️  Failed: ${ch.id}`, e)
      }
    }
  }

  private async importSingleChapterContent(bookId: string, chapterId: string) {
    if (!this.page) throw new Error('Browser not initialized')

    // Navigate to chapter page
    await this.page.goto(`${BASE}/book/${bookId}/chapter/${chapterId}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    await this.waitForPageLoad()

    // Extract text content from the rendered page
    const textContent = await this.page.evaluate(() => {
      // Try to find the main text content
      const readerContent = document.querySelector('[class*="chapter-reader"], [class*="text-content"], [class*="content"], article, main')
      if (readerContent) {
        return readerContent.textContent?.trim() || ''
      }
      return ''
    })

    if (textContent && textContent.length > 10) {
      const existing = await prisma.pageContent.findUnique({ where: { chapterId } })
      if (!existing) {
        await prisma.pageContent.create({
          data: {
            chapterId,
            content: textContent,
            wordCount: textContent.length,
          },
        })
        this.stats.contentChapters++
      }
    }
  }

  // ============ Run the full pipeline ============

  async run(phases: string[]) {
    try {
      await this.init(true)

      for (const phase of phases) {
        this.currentPhase = phase
        switch (phase) {
          case 'categories':
            await this.importCategories()
            break
          case 'metadata':
            await this.importCategories()
            await this.importBooks()
            await this.importChapters()
            break
          case 'chapters':
            await this.importChapterContent()
            break
          case 'all':
            await this.importCategories()
            await this.importBooks()
            await this.importChapters()
            await this.importChapterContent()
            break
          default:
            console.log(`Unknown phase: ${phase}`)
        }
      }

      console.log('\n🎉 Import pipeline completed!')
      console.log(`Stats:`, this.stats)
    } catch (e) {
      console.error('❌ Pipeline failed:', e)
    } finally {
      await this.close()
      await prisma.$disconnect()
    }
  }
}

// === CLI Entry Point ===

async function main() {
  const args = process.argv.slice(2)
  const phaseArg = args.find(a => a.startsWith('--phase='))
  const phase = phaseArg?.split('=')[1] || 'all'
  
  console.log(`📚 识典古籍数据导入管线`)
  console.log(`Phase: ${phase}`)
  console.log(`Start time: ${new Date().toISOString()}`)

  const importer = new ShidiangujiImporter()
  await importer.run(phase.split(','))
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error)
}

export { ShidiangujiImporter }
export type { ImportStats }

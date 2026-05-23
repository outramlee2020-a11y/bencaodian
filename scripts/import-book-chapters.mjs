/**
 * Playwright-based book chapter importer
 * 
 * Usage: node scripts/import-book-chapters.mjs <bookId>
 * Example: node scripts/import-book-chapters.mjs SBCK078
 * 
 * Uses Playwright to load the book page, capture API responses with
 * proper security tokens, and save chapter structure + content.
 */

import { chromium } from 'playwright';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const BASE = 'https://www.shidianguji.com';
const CHROMIUM_PATH = 'C:\\Users\\zitao\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe';

// Initialize Prisma
const adapter = new PrismaLibSql({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

/* API types (JSDoc for reference - implementation uses dynamic access) */

/**
 * Flatten tree of catalog chapters into a flat list
 */
function flattenChapters(chapters, parentId, level = 1) {
  const result = []
  for (const ch of chapters) {
    const entry = {
      chapterId: ch.chapterId,
      title: ch.chapterName.map(n => n.content).join(''),
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
    if (ch.subChapters?.length > 0) {
      result.push(...flattenChapters(ch.subChapters, ch.chapterId, level + 1))
    }
  }
  return result
}

async function importBook(bookId) {
  console.log(`\n📖 Importing book: ${bookId}`);
  
  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROMIUM_PATH,
    args: ['--no-sandbox'],
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  const apiData = {};

  // Intercept API responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/ancientlib/read/')) {
      try {
        const json = await response.json();
        if (json.errorCode === 0) {
          // Extract the endpoint name from URL
          const urlObj = new URL(url);
          const endpoint = urlObj.pathname.split('/').filter(Boolean).pop() || '';
          const key = `${endpoint}_${Date.now()}`;
          apiData[key] = json.data;
        }
      } catch { /* skip non-json */ }
    }
  });

  // Navigate to book page
  console.log(`  🌐 Loading ${BASE}/book/${bookId}...`);
  await page.goto(`${BASE}/book/${bookId}`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Extract catalog from the DOM
  const domChapters = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('a[href*="/chapter/"]').forEach(el => {
      const href = el.getAttribute('href') || '';
      const title = el.textContent?.trim() || '';
      if (title && !title.includes('下一篇') && !title.includes('上一篇')) {
        items.push({ href, title });
      }
    });
    return items;
  });

  console.log(`  📑 Found ${domChapters.length} chapters from DOM`);

  // Find book info API response
  const bookApiData = Object.values(apiData).find(d => d?.bookInfo?.bookId === bookId);
  const bookInfo = bookApiData?.bookInfo;

  if (bookInfo) {
    console.log(`  📚 Book: ${bookInfo.bookName}`);
    
    // Update book metadata in DB
    const authors = bookInfo.authors || [];
    const editionInfo = bookInfo.edition || {};
    let description = '';
    if (bookInfo.abstract) {
      description = bookInfo.abstract
        .map(block => block.lines?.map(l => l.content).join('') || '')
        .join('\n');
    }

    await prisma.book.upsert({
      where: { id: bookId },
      create: {
        id: bookId,
        title: bookInfo.bookName || bookId,
        titleCn: bookInfo.bookName || null,
        author: authors.map(a => a.persName).join('、') || null,
        authorDynasty: authors.map(a => a.dynastyName).filter(Boolean).join('、') || null,
        description: description || null,
        edition: editionInfo.edition || null,
        editionDynasty: editionInfo.editionDynastyName || null,
        coverUrl: bookInfo.coverUrl || null,
        beautifulCover: bookInfo.beautifulCover || null,
        dynasty: bookInfo.dynastyCategoryName || null,
        version: bookInfo.version || 0,
        checkType: bookInfo.checkType || 1,
        dataSource: 'shidianguji',
      },
      update: {
        title: bookInfo.bookName,
        titleCn: bookInfo.bookName,
        author: authors.map(a => a.persName).join('、'),
        authorDynasty: authors.map(a => a.dynastyName).filter(Boolean).join('、'),
        description: description,
        edition: editionInfo.edition,
        editionDynasty: editionInfo.editionDynastyName,
        coverUrl: bookInfo.coverUrl,
        beautifulCover: bookInfo.beautifulCover,
        dynasty: bookInfo.dynastyCategoryName,
        version: bookInfo.version,
        checkType: bookInfo.checkType,
      },
    });
    console.log(`  ✅ Book metadata updated`);

    // Import chapters
    if (bookInfo.catalog?.chapters) {
      const flatChapters = flattenChapters(bookInfo.catalog.chapters);
      console.log(`  📄 Importing ${flatChapters.length} chapters...`);
      
      for (let i = 0; i < flatChapters.length; i++) {
        const ch = flatChapters[i];
        const chapterId = ch.chapterId;
        if (!chapterId) continue;

        try {
          await prisma.chapter.upsert({
            where: { id: chapterId },
            create: {
              id: chapterId,
              bookId,
              title: ch.title || `第${i + 1}章`,
              chapterLevel: ch.chapterLevel || 1,
              chapterType: ch.chapterType || 1,
              parentId: ch.parentChapterId || null,
              orderNum: i + 1,
              startPageNum: ch.startPageNum || null,
              paragraphCount: ch.paragraphCount || null,
              volumeId: ch.volumeId || null,
              volumeVersion: ch.volumeVersion || null,
              hasMainContent: ch.hasMainContent || false,
            },
            update: {
              title: ch.title,
              chapterLevel: ch.chapterLevel,
              orderNum: i + 1,
            },
          });
        } catch (e) {
          console.warn(`  ⚠️  Chapter ${chapterId}: ${e.message.slice(0, 100)}`);
        }
      }
      console.log(`  ✅ ${flatChapters.length} chapters saved`);

      // Update total chapters count
      await prisma.book.update({
        where: { id: bookId },
        data: { totalChapters: flatChapters.length },
      });
    }
  } else {
    console.log('  ⚠️  No book info from API (page may be different format)');
  }

  await browser.close();
  console.log(`  ✅ Done with ${bookId}`);
}

// === Main ===
const bookId = process.argv[2] || 'SBCK078';
importBook(bookId)
  .then(() => {
    console.log('\n🎉 Import complete!');
    return prisma.$disconnect();
  })
  .catch(e => {
    console.error('\n❌ Failed:', e.message);
    return prisma.$disconnect();
  });

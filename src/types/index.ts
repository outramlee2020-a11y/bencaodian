// ===== Core Data Models =====

export interface Book {
  id: string
  title: string
  titleCn: string        // Chinese title
  author: string
  authorDynasty: string  // e.g. "明", "唐"
  description: string
  category: Category
  subcategory?: string
  edition: string        // e.g. "明刻本", "四部丛刊景宋本"
  coverUrl?: string
  dynasty: string        // e.g. "明代", "宋代"
  totalChapters: number
  quality: 'rough' | 'polished'  // 粗校/精校
  createdAt: string
  teamName?: string              // 整理团队
  contributors?: string          // 整理者列表（JSON string）
}

export type CategoryId = 'jing' | 'shi' | 'zi' | 'ji' | 'fo' | 'dao'

export interface Category {
  id: CategoryId
  name: string          // e.g. "经部"
  nameEn: string
  subcategories?: { id: string; name: string }[]
}

export interface Chapter {
  id: string
  bookId: string
  number: number
  title: string
  level: number         // 1=卷, 2=篇, 3=章
  parentId?: string
}

export interface PageContent {
  chapterId: string
  pageNumber: number
  text: string          // OCR text
  imageUrl?: string     // Original page image
  annotations?: Annotation[]
}

export interface Annotation {
  id: string
  type: 'punctuation' | 'entity' | 'note'
  startOffset: number
  endOffset: number
  label?: string        // entity type: person|place|book|time|title
  note?: string
}

// ===== Search Models =====

export interface SearchResult {
  bookId: string
  bookTitle: string
  chapterId: string
  chapterTitle: string
  snippet: string
  highlight: string     // with <mark> tags
  bookAuthor: string
  bookDynasty: string
  pageNumber?: number
}

export interface SearchFilters {
  query: string
  categories?: CategoryId[]
  dynasty?: string
  author?: string
  fuzzy?: boolean
  originalChar?: boolean
  sortBy?: 'relevance' | 'time'
  page?: number
  pageSize?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  page: number
  pageSize: number
}

// ===== User Models =====

export interface User {
  id: string
  name: string
  email: string
  image?: string
}

export interface Bookmark {
  id: string
  userId: string
  bookId: string
  chapterId?: string
  pageNumber?: number
  text?: string
  note?: string
  createdAt: string
}

export interface ReadingHistory {
  id: string
  userId: string
  bookId: string
  chapterId: string
  pageNumber: number
  progress: number       // 0-100
  lastReadAt: string
}

// ===== Dictionary =====

export interface DictionaryEntry {
  character: string
  pinyin: string
  meaning: string
  radical?: string
  strokes?: number
  source?: string
}

// ===== API Response Wrapper =====

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  total?: number
}

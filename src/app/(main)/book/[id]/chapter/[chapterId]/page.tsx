'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ReaderToolbar } from '@/components/reader/reader-toolbar'
import { DictionaryPopup } from '@/components/reader/dictionary-popup'
import { AiReaderPanel } from '@/components/reader/ai-reader-panel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, BookOpen, X, Plus, LogIn, Bot, ZoomIn, ZoomOut, Highlighter, Trash2, Languages } from 'lucide-react'
import { traditionalToSimplified, simplifiedToTraditional } from '@/lib/chinese-convert'

interface ChapterInfo {
  id: string
  bookId: string
  number: number
  title: string
  level: number
  parentId?: string | null
}

interface BookInfo {
  id: string
  title: string
  titleCn: string
  author: string
  authorDynasty: string
  description: string
  category: { id: string; name: string; nameEn: string }
  subcategory?: string
  edition: string
  coverUrl?: string
  dynasty: string
  totalChapters: number
  quality: 'rough' | 'polished'
  createdAt: string
}

// Toast component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  const bgMap = { success: 'bg-green-50 border-green-200 text-green-700', error: 'bg-red-50 border-red-200 text-red-700', info: 'bg-blue-50 border-blue-200 text-blue-700' }
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-[100] rounded-lg border px-4 py-3 text-sm shadow-lg ${bgMap[type]}`}>
      {message}
    </div>
  )
}

// Default placeholder text when no content exists
const PLACEHOLDER_CONTENT = `（本章正文尚未导入）

您可以通过点击工具栏中的「识典古籍数据」按钮，从识典古籍获取本章内容。
获取后，内容将被缓存以供离线阅读。`

export default function ReaderPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: authStatus } = useSession()
  const bookId = params.id as string
  const chapterId = params.chapterId as string
  const progressTracked = useRef(false)

  // Data state
  const [book, setBook] = useState<BookInfo | null>(null)
  const [chapters, setChapters] = useState<ChapterInfo[]>([])
  const [chapterIndex, setChapterIndex] = useState(-1)
  const [loading, setLoading] = useState(true)

  // Load book and chapters from API
  useEffect(() => {
    async function load() {
      try {
        const [bookRes, chaptersRes] = await Promise.all([
          fetch(`/api/books/${bookId}`).then(r => r.json()),
          fetch(`/api/chapters?bookId=${bookId}`).then(r => r.json()),
        ])
        if (bookRes.success) setBook(bookRes.data)
        if (chaptersRes.success) {
          setChapters(chaptersRes.data)
          const idx = chaptersRes.data.findIndex((c: ChapterInfo) => c.id === chapterId)
          setChapterIndex(idx)
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookId, chapterId])

  // Load local chapter content from PageContent DB
  useEffect(() => {
    async function loadContent() {
      setContentLoading(true)
      try {
        const res = await fetch(`/api/chapters/${chapterId}/content`)
        const data = await res.json()
        if (data.success && data.data) {
          setLocalContent(data.data.content)
          setLocalImages(data.data.imageUrls || [])
        } else {
          setLocalContent(null)
          setLocalImages([])
        }
      } catch {
        setLocalContent(null)
        setLocalImages([])
      } finally {
        setContentLoading(false)
      }
    }
    loadContent()
  }, [chapterId])

  // Reset image index when chapter changes
  useEffect(() => {
    setCurrentImageIndex(0)
    setShowImage(false)
  }, [chapterId])

  const chapter = chapters[chapterIndex] || null
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null
  const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null

  interface HighlightData {
    id: string
    text: string
    paragraphIndex: number
    color: string
    note: string | null
  }

  // Reader state
  const [fontSize, setFontSize] = useState(18)
  const [showImage, setShowImage] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [textMode, setTextMode] = useState<'traditional' | 'simplified' | 'original'>('traditional')
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [dictChar, setDictChar] = useState<{ char: string; x: number; y: number } | null>(null)
  const [highlightKeyword, setHighlightKeyword] = useState('')

  // Highlight state
  const [highlights, setHighlights] = useState<HighlightData[]>([])
  const [selToolbar, setSelToolbar] = useState<{ text: string; paraIdx: number; x: number; y: number } | null>(null)
  const [activeHighlight, setActiveHighlight] = useState<HighlightData | null>(null)
  const [editNoteText, setEditNoteText] = useState('')

  const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'] as const
  const COLOR_MAP: Record<string, string> = {
    yellow: 'bg-yellow-200 text-yellow-900',
    green: 'bg-green-200 text-green-900',
    blue: 'bg-blue-200 text-blue-900',
    pink: 'bg-pink-200 text-pink-900',
  }
  const [hlActiveColor, setHlActiveColor] = useState<string>('yellow')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Auto-expand ancestors of current chapter
    const findAncestors = (chaps: ChapterInfo[], targetId: string): string[] => {
      const target = chaps.find(c => c.id === targetId)
      if (!target || !target.parentId) return []
      return [target.parentId, ...findAncestors(chaps, target.parentId)]
    }
    return new Set(findAncestors(chapters, chapterId))
  })

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  /** Build a tree of chapters and render recursively */
  function ChapterTree({ parentId, depth }: { parentId: string | null; depth: number }) {
    const children = chapters.filter(c => c.parentId === parentId)
    if (children.length === 0) return null
    return (
      <ul className={depth > 0 ? 'ml-3 border-l border-amber-100 pl-2' : ''}>
        {children.map((c) => {
          const hasChildren = chapters.some(child => child.parentId === c.id)
          const isCurrent = c.id === chapterId
          const isExpanded = expandedNodes.has(c.id)
          const levelLabel = c.level === 1 ? '卷' : c.level === 2 ? '篇' : '节'
          return (
            <li key={c.id} className="my-0.5">
              <div className="flex items-center gap-0.5">
                {/* Expand/collapse toggle */}
                {hasChildren ? (
                  <button
                    onClick={() => toggleNode(c.id)}
                    className="flex-shrink-0 p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <ChevronRight className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                ) : (
                  <span className="w-4 flex-shrink-0" />
                )}
                {/* Chapter button */}
                <button
                  onClick={() => router.push(`/book/${bookId}/chapter/${c.id}`)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                    isCurrent
                      ? 'bg-amber-100 font-medium text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-[10px] text-gray-400 mr-1">{levelLabel}</span>
                  <span className="line-clamp-1">{c.title}</span>
                </button>
              </div>
              {/* Children */}
              {hasChildren && isExpanded && (
                <ChapterTree parentId={c.id} depth={depth + 1} />
              )}
            </li>
          )
        })}
      </ul>
    )
  }

  // Read highlight param from URL (for search result navigation)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const h = params.get('highlight')
    if (h) setHighlightKeyword(h)
  }, [])

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)

  // AI panel state
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [aiInitialQuestion, setAiInitialQuestion] = useState('')

  // Notes state
  const [showNotesPanel, setShowNotesPanel] = useState(false)
  const [notes, setNotes] = useState<Array<{ id: string; text: string; createdAt: string }>>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [noteLoading, setNoteLoading] = useState(false)

  // Local content (from PageContent DB)
  const [localContent, setLocalContent] = useState<string | null>(null)
  const [localImages, setLocalImages] = useState<string[]>([])
  const [contentLoading, setContentLoading] = useState(true)

  // Real data state (from remote shidianguji proxy)
  const [useRealData, setUseRealData] = useState(false)
  const [realDataLoading, setRealDataLoading] = useState(false)
  const [realDataText, setRealDataText] = useState<string | null>(null)

  // Image panel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageZoom, setImageZoom] = useState(1)
  const [showThumbnails, setShowThumbnails] = useState(true)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const isLoggedIn = authStatus === 'authenticated'

  // Determine which text to show: local DB content > remote proxy data > placeholder
  const displayText = localContent || realDataText || PLACEHOLDER_CONTENT
  const images = realDataText ? [] : localImages

  // AI-detected entities for this chapter
  const [aiEntities, setAiEntities] = useState<string[]>([])

  // Load highlights for this chapter (only when logged in)
  useEffect(() => {
    if (!isLoggedIn) { setHighlights([]); return }
    fetch(`/api/highlights?chapterId=${chapterId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setHighlights(data.data) })
      .catch(() => setHighlights([]))
  }, [chapterId, isLoggedIn])

  // Load AI entities for this chapter (when content is loaded and annotations are on)
  useEffect(() => {
    if (!showAnnotations || !displayText || displayText === PLACEHOLDER_CONTENT) return
    const timer = setTimeout(() => {
      fetch('/api/ai/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: displayText.slice(0, 3000) }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setAiEntities(data.data.map((e: { name: string }) => e.name))
          }
        })
        .catch(() => { /* ignore */ })
    }, 1000) // delay 1s to not block initial render
    return () => clearTimeout(timer)
  }, [chapterId, showAnnotations, displayText])

  // Bookmark logic
  useEffect(() => {
    if (!isLoggedIn) return
    fetch(`/api/bookmarks?bookId=${bookId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data.length > 0) {
          setIsBookmarked(true)
          setBookmarkId(data.data[0].id)
        }
      })
      .catch(() => {})
  }, [bookId, isLoggedIn])

  const handleToggleBookmark = useCallback(async () => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
    setBookmarkLoading(true)
    try {
      if (isBookmarked && bookmarkId) {
        const res = await fetch(`/api/bookmarks?id=${bookmarkId}`, { method: 'DELETE' })
        const data = await res.json()
        if (data.success) {
          setIsBookmarked(false)
          setBookmarkId(null)
          setToast({ message: '已取消书签', type: 'success' })
        }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookId, chapterId, text: chapter?.title || '' }),
        })
        const data = await res.json()
        if (data.success) {
          setIsBookmarked(true)
          setBookmarkId(data.data.id)
          setToast({ message: '已添加书签', type: 'success' })
        }
      }
    } catch {
      setToast({ message: '操作失败', type: 'error' })
    } finally {
      setBookmarkLoading(false)
    }
  }, [isLoggedIn, isBookmarked, bookmarkId, bookId, chapterId, chapter, router])

  // Notes logic
  const fetchNotes = useCallback(() => {
    if (!isLoggedIn) return
    fetch(`/api/notes?bookId=${bookId}${chapterId ? `&chapterId=${chapterId}` : ''}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setNotes(data.data)
      })
      .catch(() => {})
  }, [bookId, chapterId, isLoggedIn])

  useEffect(() => {
    if (showNotesPanel) fetchNotes()
  }, [showNotesPanel, fetchNotes])

  const handleAddNote = useCallback(async () => {
    if (!newNoteText.trim() || !isLoggedIn) return
    setNoteLoading(true)
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, chapterId, text: newNoteText.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setNotes(prev => [data.data, ...prev])
        setNewNoteText('')
        setToast({ message: '笔记已添加', type: 'success' })
      }
    } catch {
      setToast({ message: '添加笔记失败', type: 'error' })
    } finally {
      setNoteLoading(false)
    }
  }, [newNoteText, isLoggedIn, bookId, chapterId])

  const handleDeleteNote = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setNotes(prev => prev.filter(n => n.id !== id))
      setToast({ message: '笔记已删除', type: 'success' })
    }
  }, [])

  // Progress tracking
  useEffect(() => {
    if (!isLoggedIn || progressTracked.current || chapterIndex < 0) return
    progressTracked.current = true
    fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        chapterId,
        pageNumber: chapterIndex + 1,
        progress: chapters.length > 0 ? Math.round(((chapterIndex + 1) / chapters.length) * 100) : 0,
      }),
    }).catch(() => {})
  }, [bookId, chapterId, chapterIndex, chapters.length, isLoggedIn])

  // Real data fetching
  const handleToggleRealData = useCallback(async () => {
    if (useRealData) {
      setUseRealData(false)
      setRealDataText(null)
      return
    }
    setRealDataLoading(true)
    try {
      const res = await fetch(`/api/proxy/shidianguji?action=chapter&bookId=${bookId}&chapterId=${chapterId}`)
      const data = await res.json()
      if (data.success && data.data?.text) {
        setRealDataText(data.data.text)
        setUseRealData(true)
        setToast({ message: '已从识典古籍获取内容', type: 'success' })
      } else {
        setToast({ message: '未获取到远程数据，使用本地数据', type: 'info' })
      }
    } catch {
      setToast({ message: '获取远程数据失败', type: 'error' })
    } finally {
      setRealDataLoading(false)
    }
  }, [useRealData, bookId, chapterId])

  // Handle single click for dictionary
  const handleTextClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection()
      if (!selection || !selection.isCollapsed) return // skip if text is selected
      const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
      if (range) {
        const char = range?.startContainer?.textContent?.[range.startOffset] || ''
        if (char && /[\u4e00-\u9fff]/.test(char)) {
          setDictChar({ char, x: e.clientX, y: e.clientY + 10 })
        }
      }
    },
    []
  )

  // Create a highlight
  const handleCreateHighlight = useCallback(async (color: string) => {
    if (!selToolbar || !isLoggedIn) return
    const { text, paraIdx } = selToolbar
    try {
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId, chapterId, text, paragraphIndex: paraIdx, color }),
      })
      const data = await res.json()
      if (data.success) {
        if (data.data) {
          setHighlights(prev => [...prev.filter(h => !(h.paragraphIndex === paraIdx && h.text === text)), data.data])
        } else {
          // Toggle off: remove existing
          setHighlights(prev => prev.filter(h => !(h.paragraphIndex === paraIdx && h.text === text)))
        }
        setSelToolbar(null)
        window.getSelection()?.removeAllRanges()
      }
    } catch {
      // ignore
    }
  }, [selToolbar, isLoggedIn, bookId, chapterId])

  // Delete a highlight
  const handleDeleteHighlight = useCallback(async (id: string) => {
    try {
      await fetch(`/api/highlights?id=${id}`, { method: 'DELETE' })
      setHighlights(prev => prev.filter(h => h.id !== id))
      setActiveHighlight(null)
    } catch { /* ignore */ }
  }, [])

  // Update highlight note
  const handleUpdateHighlightNote = useCallback(async (id: string, note: string) => {
    try {
      const res = await fetch('/api/highlights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, note }),
      })
      const data = await res.json()
      if (data.success) {
        setHighlights(prev => prev.map(h => h.id === id ? { ...h, note } : h))
        setActiveHighlight(prev => prev ? { ...prev, note } : null)
      }
    } catch { /* ignore */ }
  }, [])

  const getDisplayText = () => {
    if (textMode === 'original') return displayText
    if (textMode === 'simplified') return traditionalToSimplified(displayText)
    if (textMode === 'traditional') return simplifiedToTraditional(displayText)
    return displayText
  }

  const currentText = getDisplayText()

  // Handle mouse up for highlight selection
  const handleTextMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelToolbar(null)
        return
      }
      const selectedText = selection.toString().trim()
      if (!selectedText || selectedText.length > 30 || selectedText.length === 0) return

      const paragraphs = currentText.split('\n\n').filter(Boolean)
      const range = selection.getRangeAt(0)
      const container = range.startContainer
      let el = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
      while (el && !el.closest('[data-para-idx]')) el = el.parentElement!
      const paraEl = el?.closest('[data-para-idx]')
      const paraIdx = paraEl ? parseInt(paraEl.getAttribute('data-para-idx') || '-1') : -1

      if (paraIdx < 0 || paraIdx >= paragraphs.length) return

      const rect = range.getBoundingClientRect()
      setSelToolbar({
        text: selectedText,
        paraIdx,
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      })
    },
    [currentText]
  )

  /** Build paragraph-to-image mapping.
   *  Evenly distributes available images across text paragraphs. */
  const paragraphImageMap = useMemo(() => {
    const paragraphs = currentText.split('\n\n').filter(Boolean)
    if (images.length === 0 || paragraphs.length === 0) return new Map<number, number>()
    const map = new Map<number, number>()
    const imagesPerPara = images.length / paragraphs.length
    paragraphs.forEach((_, idx) => {
      const imageIdx = Math.min(Math.floor(idx * imagesPerPara), images.length - 1)
      map.set(idx, imageIdx)
    })
    return map
  }, [currentText, images])

  /** Render a paragraph with annotations, user highlights, and keyword highlight support */
  function renderParagraph(text: string, showAnnot: boolean, keyword: string, paraIdx: number) {
    const entities = [
      // Core TCM drugs
      '人参', '白术', '黄芪', '甘草', '当归', '川芎', '茯苓', '半夏',
      '陈皮', '麻黄', '桂枝', '附子', '柴胡', '白芍', '丹参', '桃仁',
      '杏仁', '黄连', '黄芩', '大黄', '生地', '麦冬', '细辛', '葛根',
      '生姜', '大枣', '薄荷', '菊花', '栀子', '肉桂', '升麻', '芪',
      '芍药', '甘草', '干姜', '茯苓', '泽泻', '猪苓', '滑石', '阿胶',
      // TCM symptoms
      '伤寒', '温病', '虚劳', '痹证', '咳嗽', '痰饮', '瘀血', '痞满',
      '发热', '头痛', '呕吐', '泄泻', '水肿', '黄疸', '消渴', '中风',
      // Classics & people
      '黄帝内经', '伤寒论', '金匮要略', '本草纲目', '神农本草经', '难经',
      '张仲景', '孙思邈', '李时珍', '华佗', '扁鹊',
      // Prescriptions
      '麻黄汤', '桂枝汤', '小柴胡汤', '四君子汤', '四物汤', '六味地黄丸',
      '八珍汤', '补中益气汤', '归脾汤',
      // AI-extended entities
      ...aiEntities,
    ]
    const punctPattern = /([（）。，、；：？！])/g
    const entityPattern = new RegExp(`(${entities.join('|')})`, 'g')
    const paraHighlights = highlights.filter(h => h.paragraphIndex === paraIdx)

    /** Apply user highlights to a text segment, returning JSX parts */
    function applyUserHighlights(segment: string): React.ReactNode {
      if (paraHighlights.length === 0) return keyword ? highlightText(segment, keyword) : segment

      // Sort highlights by position in text
      const sorted = [...paraHighlights].sort((a, b) => text.indexOf(a.text) - text.indexOf(b.text))

      // Find highlight that overlaps this segment
      let result: React.ReactNode = segment
      for (const hl of sorted) {
        const hlIdx = (typeof result === 'string' ? result : '').indexOf(hl.text)
        if (hlIdx >= 0) {
          const before = (typeof result === 'string' ? result : '').slice(0, hlIdx)
          const after = (typeof result === 'string' ? result : '').slice(hlIdx + hl.text.length)
          result = (
            <>
              {keyword ? highlightText(before, keyword) : before}
              <mark
                className={`cursor-pointer rounded-sm px-0.5 ${COLOR_MAP[hl.color] || COLOR_MAP.yellow}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setEditNoteText(hl.note || '')
                  setActiveHighlight(hl)
                }}
              >
                {keyword ? highlightText(hl.text, keyword) : hl.text}
              </mark>
              {keyword ? highlightText(after, keyword) : after}
            </>
          )
          break
        }
      }
      // If no highlight found, apply keyword highlight
      if (typeof result === 'string' && keyword) result = highlightText(result, keyword)
      return result
    }

    // Step 1: Split by entities or punctuation
    const parts = showAnnot
      ? text.split(entityPattern)
      : text.split(punctPattern)

    // Step 2: Render each part
    return parts.map((part, j) => {
      // Entity highlight
      if (showAnnot && entities.includes(part)) {
        return (
          <span
            key={j}
            className="entity-book cursor-pointer border-b border-dashed border-amber-400 hover:bg-amber-50"
            title={`点击查看「${part}」详情`}
            onClick={(e) => {
              e.stopPropagation()
              setDictChar({ char: part, x: e.clientX, y: e.clientY + 10 })
            }}
          >
            {keyword ? highlightText(part, keyword) : part}
          </span>
        )
      }
      // Punctuation
      if (/^[（）。，、；：？！]$/.test(part)) {
        return (
          <span key={j} className="text-red-400">{part}</span>
        )
      }
      // Regular text with user highlights and keyword highlight
      return <span key={j}>{applyUserHighlights(part)}</span>
    })
  }

  /** Highlight keyword occurrences in text, returning JSX fragments */
  function highlightText(text: string, keyword: string): React.ReactNode {
    if (!keyword) return text
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    if (parts.length === 1) return text
    return parts.map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase()
        ? <mark key={i} className="rounded-sm bg-amber-300 px-0.5 text-amber-900">{part}</mark>
        : part
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-800 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">加载中...</p>
        </div>
      </div>
    )
  }



  return (
    <div className="flex h-screen flex-col bg-stone-50">
      {/* Top Toolbar */}
      <ReaderToolbar
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        showImage={showImage}
        onToggleImage={() => setShowImage(!showImage)}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        textMode={textMode}
        onTextModeChange={setTextMode}
        showAnnotations={showAnnotations}
        onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
        bookmarkLoading={bookmarkLoading}
        onOpenNotes={() => {
          if (!isLoggedIn) { router.push('/auth/login'); return }
          setShowNotesPanel(!showNotesPanel)
        }}
        useRealData={useRealData}
        onToggleRealData={handleToggleRealData}
        realDataLoading={realDataLoading}
        showAiPanel={showAiPanel}
        onToggleAiPanel={() => {
          if (!isLoggedIn) { router.push('/auth/login'); return }
          setShowAiPanel(!showAiPanel)
          if (!showAiPanel) setShowNotesPanel(false)
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter Sidebar — Tree */}
        {showSidebar && (
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="p-4">
              <Link
                href={`/book/${bookId}`}
                className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-800 hover:text-amber-600"
              >
                <ChevronLeft className="h-4 w-4" />
                {book?.titleCn || '返回'}
              </Link>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                目录
                <span className="ml-1 font-normal text-gray-400">({chapters.length})</span>
              </h3>
            </div>
            <div className="px-2 pb-4">
              <ChapterTree
                parentId={null}
                depth={0}
              />
            </div>
          </div>
        )}

        {/* Main Reader Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chapter Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-lg font-semibold text-gray-900">
                  {book?.titleCn || book?.title} · {chapter?.title}
                </h1>
                <p className="mt-0.5 text-xs text-gray-400">
                  {book?.authorDynasty && `${book.authorDynasty}·`}{book?.author}
                  {book?.edition && ` · ${book.edition.slice(0, 20)}`}
                  {localContent && !useRealData && <span className="ml-2 text-green-600">· 本地数据</span>}
                  {useRealData && <span className="ml-2 text-blue-500">· 识典古籍数据</span>}
                  {!localContent && !useRealData && <span className="ml-2 text-gray-400">· 无数据</span>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={book?.quality === 'polished' ? 'success' : 'warning'}>
                  {book?.quality === 'polished' ? '精校' : '粗校'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-auto">
            {/* Text Panel */}
            <div className={`flex-1 overflow-y-auto px-8 py-8 ${showNotesPanel ? '' : ''}`} onClick={handleTextClick} onMouseUp={handleTextMouseUp}>
              <div
                className="reader-text mx-auto max-w-3xl"
                style={{ fontSize: `${fontSize}px` }}
              >
                {chapter && (
                  <h2 className="text-center text-2xl font-bold mb-8" style={{ fontSize: `${fontSize + 4}px` }}>
                    {chapter.title}
                  </h2>
                )}

                {currentText.split('\n\n').filter(Boolean).map((para, i) => {
                  const mappedImageIdx = paragraphImageMap.get(i)
                  const isMappedToCurrentImage = showImage && mappedImageIdx !== undefined && mappedImageIdx === currentImageIndex
                  return (
                    <div key={i} data-para-idx={i} className={`mb-6 group relative flex items-start gap-3 ${isMappedToCurrentImage ? 'bg-amber-50/40 -mx-4 px-4 py-2 rounded-lg' : ''}`}>
                      {/* Page marker */}
                      {showImage && images.length > 0 && mappedImageIdx !== undefined && (
                        <button
                          onClick={() => { setCurrentImageIndex(mappedImageIdx); setShowImage(true) }}
                          className={`flex-shrink-0 mt-1 rounded px-1.5 py-0.5 text-[10px] font-mono transition-colors ${
                            mappedImageIdx === currentImageIndex
                              ? 'bg-amber-200 text-amber-800 font-medium'
                              : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-600'
                          }`}
                          title={`跳转至第${mappedImageIdx + 1}页影像`}
                        >
                          {mappedImageIdx + 1}
                        </button>
                      )}
                      <div className="flex-1">
                        <p>
                          {renderParagraph(para, showAnnotations, highlightKeyword, i)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Panel */}
            {showAiPanel && (
              <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white">
                <AiReaderPanel
                  key={chapterId + (aiInitialQuestion || '')}
                  bookId={bookId}
                  chapterId={chapterId}
                  chapterTitle={chapter?.title || ''}
                  chapterContent={displayText}
                  onClose={() => setShowAiPanel(false)}
                  initialQuestion={aiInitialQuestion || undefined}
                />
              </div>
            )}

            {/* Notes Panel */}
            {showNotesPanel && (
              <div className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-white">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-900">笔记</h3>
                  <button
                    onClick={() => setShowNotesPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Add note */}
                <div className="border-b border-gray-100 p-4">
                  <textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="添加笔记..."
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={noteLoading || !newNoteText.trim()}
                    className="mt-2 flex items-center gap-1 rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    {noteLoading ? '保存中...' : '添加笔记'}
                  </button>
                </div>

                {/* Notes list */}
                <div className="p-4 space-y-3">
                  {notes.length === 0 ? (
                    <p className="text-center text-xs text-gray-400 py-4">暂无笔记</p>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="group rounded-lg border border-gray-100 bg-stone-50 p-3">
                        <div className="flex items-start justify-between">
                          <p className="text-xs text-gray-700 whitespace-pre-wrap flex-1">{note.text}</p>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="ml-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            title="删除"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Image Panel */}
            {showImage && (
              <div className="w-[45%] flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-100">
                <div className="sticky top-0 z-10 bg-gray-100 border-b border-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-600">底本影像</h3>
                    {images.length > 0 && (
                      <Badge variant="info">第{currentImageIndex + 1}/{images.length}页</Badge>
                    )}
                  </div>
                  {/* Zoom controls */}
                  {images.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        title="缩小"
                      >
                        <ZoomOut className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] text-gray-400 min-w-[3rem] text-center">
                        {Math.round(imageZoom * 100)}%
                      </span>
                      <button
                        onClick={() => setImageZoom(z => Math.min(3, z + 0.25))}
                        className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        title="放大"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setImageZoom(1)}
                        className="ml-1 rounded px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                        title="重置缩放"
                      >
                        重置
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {images.length > 0 ? (
                    <>
                      {/* Main image */}
                      <div className="w-full overflow-auto rounded-lg border border-gray-200 bg-white flex items-start justify-center"
                           style={{ maxHeight: '60vh' }}>
                        <img
                          key={currentImageIndex}
                          src={`/api/proxy/image?picUrl=${encodeURIComponent(images[currentImageIndex])}`}
                          alt={`底本第${currentImageIndex + 1}页`}
                          className="object-contain transition-transform duration-200 cursor-zoom-in"
                          style={{ transform: `scale(${imageZoom})`, transformOrigin: 'top center' }}
                          onClick={() => setImageZoom(z => z === 1 ? 2 : z === 2 ? 3 : 1)}
                          onError={(e) => {
                            const img = e.target as HTMLImageElement
                            img.style.display = 'none'
                            const fallback = document.createElement('div')
                            fallback.className = 'text-center p-8'
                            fallback.innerHTML = '<p class="text-sm text-gray-400">影像加载失败</p>'
                            img.parentElement?.appendChild(fallback)
                          }}
                        />
                      </div>

                      {/* Page navigation */}
                      {images.length > 1 && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => { setCurrentImageIndex(i => Math.max(0, i - 1)); setImageZoom(1) }}
                            disabled={currentImageIndex === 0}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            上一页
                          </button>
                          <span className="text-xs text-gray-400">
                            {currentImageIndex + 1} / {images.length}
                          </span>
                          <button
                            onClick={() => { setCurrentImageIndex(i => Math.min(images.length - 1, i + 1)); setImageZoom(1) }}
                            disabled={currentImageIndex === images.length - 1}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                          >
                            下一页
                          </button>
                        </div>
                      )}

                      {/* Thumbnail strip */}
                      {showThumbnails && images.length > 1 && (
                        <div>
                          <button
                            onClick={() => setShowThumbnails(false)}
                            className="mb-2 text-[10px] text-gray-400 hover:text-gray-600"
                          >
                            收起缩略图 ▲
                          </button>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {images.map((url, idx) => (
                              <button
                                key={idx}
                                onClick={() => { setCurrentImageIndex(idx); setImageZoom(1) }}
                                className={`flex-shrink-0 w-16 h-20 overflow-hidden rounded border-2 transition-all ${
                                  idx === currentImageIndex
                                    ? 'border-amber-500 shadow-md'
                                    : 'border-gray-200 opacity-60 hover:opacity-100'
                                }`}
                              >
                                <img
                                  src={`/api/proxy/image?picUrl=${encodeURIComponent(url)}`}
                                  alt={`缩略图${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {!showThumbnails && images.length > 1 && (
                        <button
                          onClick={() => setShowThumbnails(true)}
                          className="text-[10px] text-gray-400 hover:text-gray-600"
                        >
                          展开缩略图 ▼
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="aspect-[3/4] w-full rounded-lg bg-amber-50 flex items-center justify-center border border-gray-200">
                      <div className="text-center p-8">
                        <BookOpen className="mx-auto h-12 w-12 text-amber-300" />
                        <p className="mt-3 text-sm text-gray-400">本章无底本影像</p>
                        <p className="mt-1 text-xs text-gray-300">(仅 295/3354 章有影像)</p>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 leading-relaxed">
                    影像与文本逐行对照查看，点击页码标记快速跳转。点击图片切换缩放。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
            <div>
              {prevChapter && (
                <Link
                  href={`/book/${bookId}/chapter/${prevChapter.id}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-amber-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {prevChapter.title}
                </Link>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {chapters.length > 0 ? `第${chapterIndex + 1} / ${chapters.length} 节` : ''}
            </div>
            <div>
              {nextChapter && (
                <Link
                  href={`/book/${bookId}/chapter/${nextChapter.id}`}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-amber-800"
                >
                  {nextChapter.title}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dictionary Popup */}
      {dictChar && (
        <DictionaryPopup
          character={dictChar.char}
          position={{ x: dictChar.x, y: dictChar.y }}
          onClose={() => setDictChar(null)}
        />
      )}

      {/* Selection Toolbar — Highlight */}
      {selToolbar && isLoggedIn && (
        <div
          className="fixed z-50 flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 shadow-lg"
          style={{
            left: Math.max(8, Math.min(selToolbar.x - 80, window.innerWidth - 200)),
            top: selToolbar.y - 40,
          }}
        >
          {HIGHLIGHT_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleCreateHighlight(color)}
              className={`h-6 w-6 rounded-full border-2 transition-all hover:scale-110 ${
                color === 'yellow' ? 'bg-yellow-200 border-yellow-400' :
                color === 'green' ? 'bg-green-200 border-green-400' :
                color === 'blue' ? 'bg-blue-200 border-blue-400' :
                'bg-pink-200 border-pink-400'
              } ${hlActiveColor === color ? 'ring-2 ring-offset-1 ring-amber-400' : ''}`}
              title={`${color === 'yellow' ? '黄色' : color === 'green' ? '绿色' : color === 'blue' ? '蓝色' : '粉色'}高亮`}
            />
          ))}
          <div className="mx-1 h-5 w-px bg-gray-200" />
          {/* Translate button */}
          <button
            onClick={() => {
              const text = selToolbar?.text || ''
              if (text) {
                setAiInitialQuestion('将这段翻译成白话文：' + text)
                setShowAiPanel(true)
                setSelToolbar(null)
                window.getSelection()?.removeAllRanges()
              }
            }}
            className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-gray-500 hover:text-amber-800 hover:bg-amber-50 transition-colors"
            title="翻译成白话文"
          >
            <Languages className="h-3 w-3" />
            翻译
          </button>
          <button
            onClick={() => { setSelToolbar(null); window.getSelection()?.removeAllRanges() }}
            className="rounded p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Highlight Popup — click on existing highlight */}
      {activeHighlight && (
        <div
          className="fixed z-50 w-72 rounded-xl border border-gray-200 bg-white shadow-xl"
          style={{
            left: '50%',
            top: '30%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Highlighter className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">高亮</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] ${COLOR_MAP[activeHighlight.color] || COLOR_MAP.yellow}`}>
                {activeHighlight.text.slice(0, 20)}{activeHighlight.text.length > 20 ? '…' : ''}
              </span>
            </div>
            <button onClick={() => setActiveHighlight(null)} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 py-3">
            <textarea
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              placeholder="添加笔记..."
              className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-amber-400 focus:outline-none resize-none"
              rows={3}
            />
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => handleDeleteHighlight(activeHighlight.id)}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
                删除
              </button>
              <button
                onClick={() => {
                  handleUpdateHighlightNote(activeHighlight.id, editNoteText)
                  setActiveHighlight(null)
                }}
                className="rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
              >
                保存笔记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Floating Button */}
      <button
        onClick={() => window.open('/ai', '_blank')}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-800 text-white shadow-lg hover:bg-amber-700 transition-all hover:scale-105"
        title="AI助手"
      >
        <Bot className="h-6 w-6" />
      </button>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ReaderToolbar } from '@/components/reader/reader-toolbar'
import { DictionaryPopup } from '@/components/reader/dictionary-popup'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, BookOpen, X, Plus, LogIn, Bot } from 'lucide-react'

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

  // Reader state
  const [fontSize, setFontSize] = useState(18)
  const [showImage, setShowImage] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [textMode, setTextMode] = useState<'traditional' | 'simplified' | 'original'>('traditional')
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [dictChar, setDictChar] = useState<{ char: string; x: number; y: number } | null>(null)

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarkId, setBookmarkId] = useState<string | null>(null)

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

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const isLoggedIn = authStatus === 'authenticated'

  // Determine which text to show: local DB content > remote proxy data > placeholder
  const displayText = localContent || realDataText || PLACEHOLDER_CONTENT
  const images = realDataText ? [] : localImages

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

  // Handle character click for dictionary
  const handleTextClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY)
        if (range) {
          const char = range?.startContainer?.textContent?.[range.startOffset] || ''
          if (char && /[\u4e00-\u9fff]/.test(char)) {
            setDictChar({ char, x: e.clientX, y: e.clientY + 10 })
          }
        }
      }
    },
    []
  )

  const getDisplayText = () => {
    if (textMode === 'original') return displayText
    if (textMode === 'simplified') {
      return displayText.replace(/[學藥醫氣門問關開發見體聖賢經書語論時說]/g, (c) => {
        const map: Record<string, string> = {
          '學': '学', '藥': '药', '醫': '医', '氣': '气', '門': '门',
          '問': '问', '關': '关', '開': '开', '發': '发', '見': '见',
          '體': '体', '聖': '圣', '賢': '贤', '經': '经', '書': '书',
          '語': '语', '論': '论', '時': '时', '說': '说',
        }
        return map[c] || c
      })
    }
    return displayText
  }

  const currentText = getDisplayText()

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
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chapter Sidebar */}
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
            <div className="space-y-0.5 px-2 pb-4">
              {chapters.map((c) => (
                <button
                  key={c.id}
                  onClick={() => router.push(`/book/${bookId}/chapter/${c.id}`)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    c.id === chapterId
                      ? 'bg-amber-100 font-medium text-amber-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs text-gray-400">
                    {c.level === 1 ? `卷${c.number}` : `第${c.number}节`}
                  </span>
                  <br />
                  <span className="line-clamp-1">{c.title}</span>
                </button>
              ))}
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
            <div className={`flex-1 overflow-y-auto px-8 py-8 ${showNotesPanel ? '' : ''}`} onClick={handleTextClick}>
              <div
                className="reader-text mx-auto max-w-3xl"
                style={{ fontSize: `${fontSize}px` }}
              >
                {chapter && (
                  <h2 className="text-center text-2xl font-bold mb-8" style={{ fontSize: `${fontSize + 4}px` }}>
                    {chapter.title}
                  </h2>
                )}

                {currentText.split('\n\n').filter(Boolean).map((para, i) => (
                  <div key={i} className="mb-6 group relative">
                    <p>
                      {showAnnotations
                        ? para.split(/(人参|白术|黄芪|甘草|当归|川芎)/g).map((part, j) => {
                            if (['人参', '白术', '黄芪', '甘草', '当归', '川芎'].includes(part)) {
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
                                  {part}
                                </span>
                              )
                            }
                            if (['（', '）', '。', '，', '、', '；', '：', '？', '！'].includes(part)) {
                              return <span key={j} className="text-red-400">{part}</span>
                            }
                            return <span key={j}>{part}</span>
                          })
                        : para.split(/([（）。，、；：？！])/g).map((part, j) =>
                            /^[（）。，、；：？！]$/.test(part) ? (
                              <span key={j} className="text-red-400">{part}</span>
                            ) : (
                              <span key={j}>{part}</span>
                            )
                          )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
              <div className="w-[45%] flex-shrink-0 overflow-y-auto border-l border-gray-200 bg-gray-100 p-4">
                <div className="sticky top-0 mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-600">底本影像</h3>
                  {images.length > 0 && (
                    <Badge variant="info">第{currentImageIndex + 1}/{images.length}页</Badge>
                  )}
                </div>
                {images.length > 0 ? (
                  <div className="space-y-3">
                    <div className="aspect-[3/4] w-full overflow-hidden rounded-lg border border-gray-200 bg-white flex items-center justify-center">
                      <img
                        key={currentImageIndex}
                        src={`/api/proxy/image?picUrl=${encodeURIComponent(images[currentImageIndex])}`}
                        alt={`底本第${currentImageIndex + 1}页`}
                        className="max-h-full max-w-full object-contain"
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
                          onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))}
                          disabled={currentImageIndex === 0}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          上一页
                        </button>
                        <span className="text-xs text-gray-400">
                          {currentImageIndex + 1} / {images.length}
                        </span>
                        <button
                          onClick={() => setCurrentImageIndex(i => Math.min(images.length - 1, i + 1))}
                          disabled={currentImageIndex === images.length - 1}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                          下一页
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[3/4] w-full rounded-lg bg-amber-50 flex items-center justify-center border border-gray-200">
                    <div className="text-center p-8">
                      <BookOpen className="mx-auto h-12 w-12 text-amber-300" />
                      <p className="mt-3 text-sm text-gray-400">本章无底本影像</p>
                      <p className="mt-1 text-xs text-gray-300">(仅 295/3354 章有影像)</p>
                    </div>
                  </div>
                )}
                <p className="mt-3 text-xs text-gray-400 leading-relaxed">
                  影像与文本逐行对照查看，确保内容准确可靠。
                </p>
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

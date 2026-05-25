'use client'

import { Button } from '@/components/ui/button'
import {
  PanelLeft,
  Image,
  Type,
  Minus,
  Plus,
  Bookmark,
  FileText,
  Globe,
  StickyNote,
  Loader2,
  Sparkles,
} from 'lucide-react'

interface ReaderToolbarProps {
  fontSize: number
  onFontSizeChange: (size: number) => void
  showImage: boolean
  onToggleImage: () => void
  showSidebar: boolean
  onToggleSidebar: () => void
  textMode: 'traditional' | 'simplified' | 'original'
  onTextModeChange: (mode: 'traditional' | 'simplified' | 'original') => void
  showAnnotations: boolean
  onToggleAnnotations: () => void
  // New props
  isBookmarked: boolean
  onToggleBookmark: () => void
  bookmarkLoading: boolean
  onOpenNotes: () => void
  useRealData: boolean
  onToggleRealData: () => void
  realDataLoading: boolean
  showAiPanel: boolean
  onToggleAiPanel: () => void
}

export function ReaderToolbar({
  fontSize,
  onFontSizeChange,
  showImage,
  onToggleImage,
  showSidebar,
  onToggleSidebar,
  textMode,
  onTextModeChange,
  showAnnotations,
  onToggleAnnotations,
  isBookmarked,
  onToggleBookmark,
  bookmarkLoading,
  onOpenNotes,
  useRealData,
  onToggleRealData,
  realDataLoading,
  showAiPanel,
  onToggleAiPanel,
}: ReaderToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className={`rounded-lg p-2 transition-colors ${
            showSidebar ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="目录"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <button
          onClick={onToggleImage}
          className={`rounded-lg p-2 transition-colors ${
            showImage ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="底本影像"
        >
          <Image className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-gray-200" />

        {/* Text Mode */}
        <div className="flex rounded-lg border border-gray-200 p-0.5">
          {(['original', 'traditional', 'simplified'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onTextModeChange(mode)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                textMode === mode
                  ? 'bg-amber-800 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'original' ? '原字' : mode === 'traditional' ? '繁体' : '简体'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Bookmark Button */}
        <button
          onClick={onToggleBookmark}
          disabled={bookmarkLoading}
          className={`rounded-lg p-2 transition-colors ${
            isBookmarked
              ? 'bg-amber-100 text-amber-800'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={isBookmarked ? '取消书签' : '添加书签'}
        >
          {bookmarkLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-800' : ''}`} />
          )}
        </button>

        {/* Notes Button */}
        <button
          onClick={onOpenNotes}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          title="笔记"
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* AI Assistant Button */}
        <button
          onClick={onToggleAiPanel}
          className={`rounded-lg p-2 transition-colors ${
            showAiPanel ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="AI助手"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Fetch from Shidianguji */}
        <button
          onClick={onToggleRealData}
          disabled={realDataLoading}
          className={`rounded-lg p-2 transition-colors ${
            useRealData
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={useRealData ? '使用本地数据' : '从识典古籍获取'}
        >
          {realDataLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
        </button>

        <div className="h-4 w-px bg-gray-200" />

        {/* Font Size */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1">
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            className="rounded p-0.5 text-gray-500 hover:text-gray-700"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="min-w-[2rem] text-center text-xs text-gray-600">
            {fontSize}
          </span>
          <button
            onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
            className="rounded p-0.5 text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Annotations toggle */}
        <button
          onClick={onToggleAnnotations}
          className={`rounded-lg p-2 transition-colors ${
            showAnnotations ? 'bg-amber-100 text-amber-800' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title="显示标注"
        >
          <Type className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

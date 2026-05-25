'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Volume2, ExternalLink, Loader2 } from 'lucide-react'
import { lookupDictionary, lookupTerm, getDictionaryUrl } from '@/lib/tcm-dictionary'

interface DictionaryPopupProps {
  character: string
  position: { x: number; y: number }
  onClose: () => void
}

/** Fetch pinyin/meaning from zdic.net (scraped). Returns null on failure. */
async function fetchFromZdic(char: string): Promise<{ pinyin: string; meaning: string } | null> {
  try {
    const res = await fetch(`/api/proxy/zdic?char=${encodeURIComponent(char)}`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.success) {
      return { pinyin: data.pinyin || '', meaning: data.meaning || '' }
    }
    return null
  } catch {
    return null
  }
}

/** Provide a human-readable label for a character's category */
function categoryLabel(cat?: string): string {
  switch (cat) {
    case 'tcm_drug': return '中草药'
    case 'tcm_point': return '针灸穴位'
    case 'tcm_symptom': return '中医证候'
    default: return '常用字'
  }
}

export function DictionaryPopup({ character, position, onClose }: DictionaryPopupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [onlineResult, setOnlineResult] = useState<{ pinyin: string; meaning: string } | null>(null)
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [onlineError, setOnlineError] = useState(false)

  // 1) Try multi-character term lookup first
  const termInfo = character.length > 1 ? lookupTerm(character) : null

  // 2) Look up each character in offline dictionary (for multi-char, show all)
  const chars = [...character]
  const offlineEntries = chars.map(c => ({ char: c, entry: lookupDictionary(c) }))

  // 3) For single characters not found offline, try online lookup
  const needsOnline = chars.length === 1 && !offlineEntries[0].entry

  useEffect(() => {
    if (needsOnline && !onlineResult && !onlineLoading) {
      setOnlineLoading(true)
      fetchFromZdic(character)
        .then(result => {
          if (result) {
            setOnlineResult(result)
          } else {
            setOnlineError(true)
          }
        })
        .catch(() => setOnlineError(true))
        .finally(() => setOnlineLoading(false))
    }
  }, [needsOnline, character, onlineResult, onlineLoading])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Adjust position to keep popup in viewport
  const adjustedPos = { ...position }
  if (typeof window !== 'undefined') {
    const popupWidth = 340
    const popupHeight = 280
    if (adjustedPos.x + popupWidth > window.innerWidth - 16) {
      adjustedPos.x = window.innerWidth - popupWidth - 16
    }
    if (adjustedPos.y + popupHeight > window.innerHeight - 16) {
      adjustedPos.y = position.y - popupHeight - 20
    }
  }

  // Build meaning display
  const hasTermInfo = termInfo !== null
  const hasOffline = offlineEntries.some(e => e.entry)
  const hasOnline = onlineResult !== null
  const hasAnyData = hasTermInfo || hasOffline || hasOnline

  return (
    <div
      ref={ref}
      className="fixed z-50 w-[340px] rounded-xl border border-gray-200 bg-white shadow-xl"
      style={{
        left: Math.max(8, adjustedPos.x),
        top: Math.max(8, adjustedPos.y),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-serif text-2xl text-gray-900 flex-shrink-0">
            {character.length <= 2 ? character : character.slice(0, 2) + '…'}
          </span>
          <div className="min-w-0">
            {termInfo ? (
              <span className="block text-sm text-amber-700">{termInfo.pinyin}</span>
            ) : (onlineResult?.pinyin) ? (
              <span className="block text-sm text-amber-700">{onlineResult.pinyin}</span>
            ) : offlineEntries[0]?.entry?.pinyin ? (
              <span className="block text-sm text-amber-700">
                {offlineEntries.filter(e => e.entry).map(e => e.entry!.pinyin).join(' / ')}
              </span>
            ) : null}
            <span className="text-[10px] text-gray-400">
              {character.length > 1 ? '词组' : categoryLabel(offlineEntries[0]?.entry?.category)}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-[320px] overflow-y-auto">
        {hasTermInfo && (
          <div className="mb-3">
            <p className="text-sm leading-relaxed text-gray-700">{termInfo.meaning}</p>
          </div>
        )}

        {hasOffline && (
          <div className="space-y-3">
            {offlineEntries.map(({ char, entry }) =>
              entry ? (
                <div key={char}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-serif text-lg text-gray-900">{char}</span>
                    <span className="text-xs text-amber-600">{entry.pinyin}</span>
                    {entry.radical && (
                      <span className="text-[10px] text-gray-400">
                        部首{entry.radical} · {entry.strokes}画
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{entry.meaning}</p>
                  {entry.example && (
                    <p className="mt-1 text-xs italic text-gray-500">
                      例：{entry.example}
                    </p>
                  )}
                </div>
              ) : null
            )}
          </div>
        )}

        {hasOnline && !hasOffline && (
          <div>
            <p className="text-sm leading-relaxed text-gray-700">{onlineResult.meaning}</p>
          </div>
        )}

        {onlineLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            查询中...
          </div>
        )}

        {!hasAnyData && !onlineLoading && (
          <div>
            <p className="text-sm text-gray-500">
              「{character}」暂未收录详细释义
            </p>
            {onlineError && (
              <p className="mt-1 text-xs text-gray-400">
                在线查询不可用，请稍后重试
              </p>
            )}
          </div>
        )}

        {/* zdic.net link for single characters */}
        {chars.length === 1 && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <a
              href={getDictionaryUrl(character)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              在汉典网查看详细解释
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

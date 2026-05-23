'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Volume2 } from 'lucide-react'

interface DictEntry {
  character: string
  pinyin: string
  meaning: string
  radical?: string
  strokes?: number
}

// Sample dictionary - in production, this would come from an API
const sampleDict: Record<string, DictEntry> = {
  人: {
    character: '人',
    pinyin: 'rén',
    meaning: '人类，人。能制造并使用工具进行劳动的高等动物。',
    radical: '人',
    strokes: 2,
  },
  参: {
    character: '参',
    pinyin: 'shēn',
    meaning: '人参。多年生草本植物，根入药，有滋补作用。也读cān、cēn。',
    radical: '厶',
    strokes: 8,
  },
  草: {
    character: '草',
    pinyin: 'cǎo',
    meaning: '草本植物的总称。也指草稿、草率。',
    radical: '艹',
    strokes: 9,
  },
  药: {
    character: '药',
    pinyin: 'yào',
    meaning: '药物，药材。能治疗疾病的物质。',
    radical: '艹',
    strokes: 9,
  },
  医: {
    character: '医',
    pinyin: 'yī',
    meaning: '医生，医学。治疗疾病的工作或知识体系。',
    radical: '匚',
    strokes: 7,
  },
}

interface DictionaryPopupProps {
  character: string
  position: { x: number; y: number }
  onClose: () => void
}

export function DictionaryPopup({ character, position, onClose }: DictionaryPopupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const entry = sampleDict[character]

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
    const popupWidth = 320
    const popupHeight = 200
    if (adjustedPos.x + popupWidth > window.innerWidth - 16) {
      adjustedPos.x = window.innerWidth - popupWidth - 16
    }
    if (adjustedPos.y + popupHeight > window.innerHeight - 16) {
      adjustedPos.y = position.y - popupHeight - 20
    }
  }

  return (
    <div
      ref={ref}
      className="fixed z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl"
      style={{
        left: Math.max(8, adjustedPos.x),
        top: Math.max(8, adjustedPos.y),
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="font-serif text-2xl text-gray-900">{character}</span>
          <div>
            <span className="text-sm text-amber-700">{entry?.pinyin || ''}</span>
            {entry?.radical && (
              <span className="ml-2 text-xs text-gray-400">
                部首：{entry.radical} · {entry.strokes}画
              </span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {entry ? (
          <>
            <p className="text-sm leading-relaxed text-gray-700">{entry.meaning}</p>
            {character === '参' && (
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>参 (cān) - 参加，参与</p>
                <p>参 (cēn) - 参差，不齐</p>
                <p>参 (shēn) - 人参</p>
                <p className="text-xs text-amber-600 mt-1">
                  来源：《汉语大词典》· 识典古籍
                </p>
              </div>
            )}
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-500">
              「{character}」暂未收录详细释义
            </p>
            <p className="mt-1 text-xs text-gray-400">
              来源：《汉语大词典》· 识典古籍
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'

interface AiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AiReaderPanelProps {
  bookId: string
  chapterId: string
  chapterTitle: string
  chapterContent: string
  onClose: () => void
  initialQuestion?: string
}

const QUICK_QUESTIONS = [
  '总结本章内容',
  '解释这段的核心医理',
  '翻译成白话文',
  '列出本章提到的药方',
]

export function AiReaderPanel({
  bookId,
  chapterId,
  chapterTitle,
  chapterContent,
  onClose,
  initialQuestion,
}: AiReaderPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: `您好！我是本草典AI助手。关于「${chapterTitle}」这一章，我可以帮您：\n\n• 总结本章内容\n• 解释其中的医理\n• 翻译成白话文\n• 列出药方和药物\n\n请问您想了解什么？`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-focus input after mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-submit initial question
  const initialSent = useRef(false)
  useEffect(() => {
    if (initialQuestion && !initialSent.current) {
      initialSent.current = true
      handleSend(initialQuestion)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuestion])

  const handleSend = async (overrideText?: string) => {
    const text = overrideText || input.trim()
    if (!text || loading) return

    const userMsg: AiMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setStreamingText('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          bookId,
          chapterId,
          chapterContent: chapterContent.slice(0, 8000), // limit context
          chapterTitle,
          stream: true,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content || ''
            fullContent += delta
            setStreamingText(fullContent)
          } catch { /* skip */ }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
      setStreamingText('')
    } catch {
      // Fallback
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            bookId,
            chapterId,
            chapterContent: chapterContent.slice(0, 8000),
            chapterTitle,
            stream: false,
          }),
        })
        const data = await res.json()
        if (data.success && data.data?.message) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.data.message.content }])
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，暂时无法回答，请稍后再试。' }])
        }
      } catch {
        setMessages((prev) => [...prev, { role: 'assistant', content: '网络错误，请检查连接后重试。' }])
      }
    } finally {
      setLoading(false)
      setStreamingText('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI 助手</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
                <Bot className="h-3 w-3 text-amber-700" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-800 text-white'
                  : 'border border-gray-100 bg-stone-50 text-gray-700'
              }`}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-1.5' : ''}>{line}</p>
              ))}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 mt-0.5">
                <User className="h-3 w-3 text-gray-500" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming */}
        {streamingText && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
              <Bot className="h-3 w-3 text-amber-700" />
            </div>
            <div className="max-w-[85%] rounded-xl border border-gray-100 bg-stone-50 px-3 py-2 text-xs leading-relaxed text-gray-700">
              {streamingText.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-1.5' : ''}>{line}</p>
              ))}
              <span className="inline-block w-1.5 h-3 bg-amber-600 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !streamingText && (
          <div className="flex gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 mt-0.5">
              <Bot className="h-3 w-3 text-amber-700" />
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-gray-100 bg-stone-50 px-3 py-2">
              <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
              <span className="text-xs text-gray-400">思考中...</span>
            </div>
          </div>
        )}

        {/* Quick questions */}
        {messages.length === 1 && !loading && (
          <div className="pt-2">
            <p className="mb-2 text-[10px] text-gray-400 text-center">快捷提问</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] text-gray-500 hover:border-amber-200 hover:text-amber-800 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题..."
            className="flex-1 resize-none rounded-lg border border-gray-200 px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
            rows={1}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="self-end rounded-lg bg-amber-800 p-2 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 text-center">
          AI 生成内容仅供参考，不构成医疗建议
        </p>
      </div>
    </div>
  )
}

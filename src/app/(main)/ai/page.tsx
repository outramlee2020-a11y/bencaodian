'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const suggestedQuestions = [
  '什么是本草？',
  '《黄帝内经》的主要内容是什么？',
  '如何理解阴阳五行？',
  '简述《伤寒论》六经辨证',
]

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '您好！我是本草典AI助手，专门解答关于中医古籍、本草学、中医药理论的问题。请告诉我您想了解什么？',
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

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setStreamingText('')

    try {
      // Try streaming first
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      })

      if (!res.ok) {
        throw new Error('API error')
      }

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
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: fullContent }])
      setStreamingText('')
    } catch {
      // Fallback to non-streaming
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
            stream: false,
          }),
        })
        const data = await res.json()
        if (data.success && data.data?.message) {
          setMessages((prev) => [...prev, { role: 'assistant', content: data.data.message.content }])
        } else {
          setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，我暂时无法回答，请稍后再试。' }])
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
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
          <Sparkles className="h-5 w-5 text-amber-700" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold text-gray-900">本草AI助手</h1>
          <p className="text-xs text-gray-500">中医古籍智能问答 · 基于大语言模型</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <Bot className="h-4 w-4 text-amber-700" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-800 text-white'
                  : 'border border-gray-200 bg-white text-gray-800'
              }`}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
            </div>
            {msg.role === 'user' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                <User className="h-4 w-4 text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {streamingText && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Bot className="h-4 w-4 text-amber-700" />
            </div>
            <div className="max-w-[75%] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-gray-800">
              {streamingText.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>
                  {line}
                </p>
              ))}
              <span className="inline-block w-2 h-4 bg-amber-600 animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {loading && !streamingText && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Bot className="h-4 w-4 text-amber-700" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <span className="text-sm text-gray-400">思考中...</span>
            </div>
          </div>
        )}

        {/* Suggested questions (only show at start) */}
        {messages.length === 1 && !loading && (
          <div className="pt-4">
            <p className="mb-3 text-xs text-gray-400 text-center">试试这些问题</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q)
                    inputRef.current?.focus()
                  }}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs text-gray-600 hover:border-amber-200 hover:text-amber-800 transition-colors"
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
      <div className="border-t border-gray-200 py-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入关于中医古籍的问题..."
            className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="self-end"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400 text-center">
          AI生成内容仅供参考，不构成医疗建议
        </p>
      </div>
    </div>
  )
}

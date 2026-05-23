'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, Minus } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AiAssistantProps {
  selectedText?: string
}

export function AiAssistant({ selectedText }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '您好！有什么关于古籍的问题吗？' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-fill with selected text
  useEffect(() => {
    if (selectedText && isOpen) {
      setInput(`请解释这段文字：${selectedText}`)
    }
  }, [selectedText, isOpen])

  const handleSend = async () => {
    const text = selectedText && !input.trim()
      ? `请解释这段文字：${selectedText}`
      : input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

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
        setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，暂时无法回答。' }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '网络错误，请稍后重试。' }])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-amber-800 text-white shadow-lg hover:bg-amber-700 transition-all hover:scale-105"
        title="AI助手"
      >
        <Bot className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div
      className={`fixed right-6 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl transition-all duration-200 ${
        isMinimized ? 'bottom-6 h-12 overflow-hidden' : 'bottom-6 h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-amber-700" />
          <span className="text-sm font-medium text-gray-900">AI助手</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[calc(100%-8rem)] overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-800 text-white'
                  : 'border border-gray-100 bg-stone-50 text-gray-700'
              }`}
            >
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            思考中...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={selectedText ? '选中文本已就绪，发送询问...' : '输入问题...'}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-amber-400 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() && !selectedText || loading}
            className="rounded-lg bg-amber-800 p-1.5 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

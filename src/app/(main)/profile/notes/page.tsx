'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, Trash2, BookOpen, Edit3 } from 'lucide-react'

interface NoteItem {
  id: string
  bookId: string
  chapterId: string | null
  text: string
  pageNumber: number | null
  createdAt: string
  updatedAt: string
}

export default function NotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/notes')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setNotes(data.data)
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setNotes((prev) => prev.filter((n) => n.id !== id))
    }
  }

  const handleUpdate = async (id: string) => {
    const res = await fetch('/api/notes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: editText }),
    })
    const data = await res.json()
    if (data.success) {
      setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text: editText } : n)))
      setEditingId(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center text-gray-400">
        加载中...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-gray-900">我的笔记</h1>
        <p className="mt-1 text-sm text-gray-500">共 {notes.length} 条笔记</p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400">还没有笔记</p>
          <p className="mt-1 text-xs text-gray-300">阅读古籍时选中文字即可添加笔记</p>
          <Link
            href="/library"
            className="mt-4 inline-block text-sm font-medium text-amber-700 hover:text-amber-600"
          >
            去书库浏览 →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors hover:border-amber-200"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={note.chapterId ? `/book/${note.bookId}/chapter/${note.chapterId}` : `/book/${note.bookId}`}
                    className="text-sm font-medium text-amber-800 hover:text-amber-600"
                  >
                    {note.bookId}
                    {note.chapterId && <span className="text-xs text-gray-400"> · 章节</span>}
                  </Link>

                  {editingId === note.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-amber-400 focus:outline-none"
                        rows={3}
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={() => handleUpdate(note.id)}
                          className="text-xs font-medium text-amber-700 hover:text-amber-600"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-sm text-gray-600 whitespace-pre-wrap">{note.text}</p>
                  )}

                  <p className="mt-1 text-xs text-gray-300">
                    {new Date(note.createdAt).toLocaleDateString('zh-CN')}
                    {note.updatedAt !== note.createdAt && ' (已编辑)'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingId(note.id)
                      setEditText(note.text)
                    }}
                    className="p-1.5 text-gray-300 hover:text-amber-600 transition-colors"
                    title="编辑笔记"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                    title="删除笔记"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

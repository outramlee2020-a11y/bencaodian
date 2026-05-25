'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  nameEn: string | null
  parentId: string | null
  createdAt: string
  updatedAt: string
  _count: { books: number }
}

type FormMode = 'add' | 'edit'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<FormMode>('add')
  const [formId, setFormId] = useState('')
  const [formName, setFormName] = useState('')
  const [formNameEn, setFormNameEn] = useState('')
  const [formParentId, setFormParentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function fetchCategories() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/categories')
      const json = await res.json()
      if (json.success) {
        setCategories(json.data)
      } else {
        setError('加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  function openAddForm() {
    setFormMode('add')
    setFormId('')
    setFormName('')
    setFormNameEn('')
    setFormParentId('')
    setFormError('')
    setShowForm(true)
  }

  function openEditForm(cat: Category) {
    setFormMode('edit')
    setFormId(cat.id)
    setFormName(cat.name)
    setFormNameEn(cat.nameEn || '')
    setFormParentId(cat.parentId || '')
    setFormError('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setFormError('')
  }

  async function handleSave() {
    if (!formName.trim()) {
      setFormError('名称不能为空')
      return
    }
    if (formMode === 'add' && !formId.trim()) {
      setFormError('ID不能为空')
      return
    }

    setSaving(true)
    setFormError('')
    setSuccessMsg('')

    try {
      const url = formMode === 'add' ? '/api/admin/categories' : `/api/admin/categories/${formId}`
      const method = formMode === 'add' ? 'POST' : 'PUT'
      const body: Record<string, unknown> = {
        name: formName,
        nameEn: formNameEn || undefined,
        parentId: formParentId || undefined,
      }
      if (formMode === 'add') body.id = formId

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        setSuccessMsg(formMode === 'add' ? '添加成功' : '保存成功')
        closeForm()
        fetchCategories()
      } else {
        setFormError(json.error || '保存失败')
      }
    } catch {
      setFormError('网络错误')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(cat: Category) {
    if (!window.confirm(`确定要删除分类「${cat.name}」吗？`)) return

    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
      const json = await res.json()

      if (json.success) {
        setSuccessMsg('删除成功')
        fetchCategories()
      } else {
        setError(json.error || '删除失败')
      }
    } catch {
      setError('网络错误')
    }
  }

  const parentMap = Object.fromEntries(
    categories.map(c => [c.id, c.name])
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">分类管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理古籍分类</p>
      </div>

      {successMsg && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-700">{successMsg}</div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {!showForm ? (
        <div className="mb-6">
          <Button onClick={openAddForm}>
            <Plus className="mr-1.5 h-4 w-4" />
            添加分类
          </Button>
        </div>
      ) : (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold text-gray-900">
                {formMode === 'add' ? '添加分类' : '编辑分类'}
              </h3>
              <Button variant="ghost" size="sm" onClick={closeForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {formMode === 'add' && (
                <Input
                  label="ID"
                  id="cat-id"
                  value={formId}
                  onChange={e => setFormId(e.target.value)}
                  placeholder="分类唯一标识"
                />
              )}
              <Input
                label="名称"
                id="cat-name"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="分类名称"
              />
              <Input
                label="英文名称"
                id="cat-nameen"
                value={formNameEn}
                onChange={e => setFormNameEn(e.target.value)}
                placeholder="英文名称（可选）"
              />
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="cat-parent">
                  父分类
                </label>
                <select
                  id="cat-parent"
                  value={formParentId}
                  onChange={e => setFormParentId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                >
                  <option value="">无（顶级分类）</option>
                  {categories
                    .filter(c => formMode === 'add' || c.id !== formId)
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </Button>
                <Button variant="secondary" onClick={closeForm}>
                  取消
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="py-20 text-center text-stone-400">加载中...</div>
      )}

      {!loading && !error && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <Th>ID</Th>
                  <Th>名称</Th>
                  <Th>英文名称</Th>
                  <Th>父分类</Th>
                  <Th>书籍数量</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                      暂无分类
                    </td>
                  </tr>
                ) : (
                  categories.map(cat => (
                    <tr key={cat.id} className="transition-colors hover:bg-stone-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500">
                        {cat.id}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {cat.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {cat.nameEn || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {cat.parentId ? parentMap[cat.parentId] || cat.parentId : '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {cat._count.books}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditForm(cat)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
      {children}
    </th>
  )
}

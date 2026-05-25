'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Users } from 'lucide-react'

interface UserItem {
  id: string
  name: string | null
  email: string
  role: string
  image: string | null
  createdAt: string
  _count: {
    bookmarks: number
    histories: number
    notes: number
  }
}

interface ApiResponse {
  success: boolean
  data: {
    users: UserItem[]
    pagination: { total: number; offset: number; limit: number }
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<ApiResponse['data'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  async function fetchUsers(searchQuery = '') {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('limit', '500')
      if (searchQuery) params.set('search', searchQuery)
      const res = await fetch(`/api/admin/users?${params}`)
      const json: ApiResponse = await res.json()
      if (json.success) {
        setData(json.data)
      } else {
        setError('加载失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchUsers(search)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="mt-1 text-sm text-gray-500">管理平台注册用户</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm">
          <Users className="h-4 w-4 text-stone-400" />
          <span className="text-stone-500">注册用户:</span>
          <span className="font-semibold text-stone-800">
            {data?.pagination.total ?? '-'}
          </span>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <Input
            placeholder="搜索邮箱或用户名..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-amber-800 px-4 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Search className="mr-1.5 h-4 w-4" />
            搜索
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="py-20 text-center text-stone-400">加载中...</div>
      )}

      {data && !loading && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead className="bg-stone-50">
                <tr>
                  <Th>ID</Th>
                  <Th>用户名</Th>
                  <Th>邮箱</Th>
                  <Th>角色</Th>
                  <Th>注册时间</Th>
                  <Th>书签数</Th>
                  <Th>笔记数</Th>
                  <Th>操作</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data.users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-stone-400">
                      暂无用户
                    </td>
                  </tr>
                ) : (
                  data.users.map(user => (
                    <tr key={user.id} className="transition-colors hover:bg-stone-50">
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-500">
                        {user.id.slice(0, 8)}...
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                        {user.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                          {user.role === 'admin' ? '管理员' : '用户'}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {user._count.bookmarks}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                        {user._count.notes}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50"
                        >
                          详情
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {data && (
        <p className="mt-4 text-xs text-stone-400">
          共 {data.pagination.total} 条记录，显示 {data.users.length} 条
        </p>
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

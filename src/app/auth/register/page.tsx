'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || '注册失败')
        return
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/login')
      }
    } catch {
      setError('注册失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-gray-200 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-800" />
          <span className="text-base font-bold text-gray-900">本草典</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-bold text-gray-900">注册</h1>
            <p className="mt-2 text-sm text-gray-500">
              创建账号，开启古籍研究之旅
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Input
              id="name"
              label="用户名"
              type="text"
              placeholder="你的名字"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              id="email"
              label="邮箱"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="密码"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              已有账号？{' '}
              <Link
                href="/auth/login"
                className="font-medium text-amber-700 hover:text-amber-600"
              >
                登录
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

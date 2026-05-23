'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BookOpen } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('邮箱或密码错误')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('登录失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Simple header */}
      <div className="border-b border-gray-200 px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-amber-800" />
          <span className="text-base font-bold text-gray-900">本草典</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl font-bold text-gray-900">登录</h1>
            <p className="mt-2 text-sm text-gray-500">
              登录后即可使用收藏、笔记等个性化功能
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
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
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              还没有账号？{' '}
              <Link
                href="/auth/register"
                className="font-medium text-amber-700 hover:text-amber-600"
              >
                注册
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

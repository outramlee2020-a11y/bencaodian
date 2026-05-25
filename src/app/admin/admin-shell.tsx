'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/cn'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Tags,
  Users,
  Upload,
  Menu,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { href: '/admin/books', label: '书籍管理', icon: BookOpen },
  { href: '/admin/chapters', label: '章节管理', icon: FileText },
  { href: '/admin/categories', label: '分类管理', icon: Tags },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/import', label: '数据导入', icon: Upload },
]

const pageTitles: Record<string, string> = {
  '/admin': '仪表盘',
  '/admin/books': '书籍管理',
  '/admin/chapters': '章节管理',
  '/admin/categories': '分类管理',
  '/admin/users': '用户管理',
  '/admin/import': '数据导入',
}

function getPageTitle(pathname: string): string {
  // Exact match first
  if (pageTitles[pathname]) return pageTitles[pathname]
  // Match /admin/books/xxx etc.
  for (const [prefix, title] of Object.entries(pageTitles)) {
    if (pathname.startsWith(prefix + '/')) return title
  }
  return '管理后台'
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auth check via session.user.role (no extra API call)
  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search)
      router.replace(`/auth/login?callbackUrl=${callbackUrl}`)
    }
  }, [status, router])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Show debug info in the "no permission" view
  const role = session?.user?.role
  const email = session?.user?.email

  // Loading state
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-stone-400 text-sm">验证身份中...</div>
      </div>
    )
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-stone-400 text-sm">正在跳转到登录页...</div>
      </div>
    )
  }

  // Not admin
  if (status === 'authenticated' && role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
        <div className="text-center">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">无权限访问</h1>
          <p className="text-stone-500 mb-4">该账号不是管理员，无法访问管理后台</p>
          <div className="mb-6 rounded-lg bg-stone-100 p-4 text-left text-xs text-stone-500 max-w-sm mx-auto space-y-1">
            <p>登录状态: 已登录</p>
            <p>用户: {email || '(无email)'}</p>
            <p>角色: {role || '(无角色)'}</p>
            <p>会话状态: {status}</p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-stone-100">
          <BookOpen className="h-6 w-6 text-amber-800" />
          <span className="font-serif text-lg font-bold text-stone-900">本草典 管理后台</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-amber-50 text-amber-800 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div className="border-t border-stone-100 px-6 py-4">
          <div className="text-xs text-stone-400 truncate mb-2">
            {session?.user?.email || '未登录'}
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-red-600 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-60">
        {/* Top header bar */}
        <header className="bg-white border-b border-stone-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-stone-500 hover:text-stone-700 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-serif text-lg font-semibold text-stone-800">
              {getPageTitle(pathname)}
            </h2>
          </div>
          <div className="text-sm text-stone-400">
            {session?.user?.email && (
              <span className="hidden sm:inline">{session.user.email}</span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/button'
import { BookOpen, Search, Menu, X, User, Library, Bookmark, FileText, LogOut, Sparkles } from 'lucide-react'

const navLinks = [
  { href: '/library', label: '书库', icon: Library },
  { href: '/search', label: '搜索', icon: Search },
  { href: '/ai', label: 'AI助手', icon: Sparkles },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isLoggedIn = status === 'authenticated'

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-amber-800" />
          <span className="text-xl font-bold tracking-tight text-gray-900">
            本草典
          </span>
          <span className="hidden text-xs text-gray-400 sm:inline">· 中医古籍平台</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-1.5 text-sm font-medium transition-colors',
                  pathname.startsWith(link.href)
                    ? 'text-amber-800'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}

          {/* Inline Search */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索古籍全文..."
                  className="h-8 w-56 rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-200"
                  onBlur={() => { if (!searchQuery) setSearchOpen(false) }}
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                  className="-ml-7 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors"
                title="搜索全文"
              >
                <Search className="h-3.5 w-3.5" />
                <span className="text-xs">搜索</span>
              </button>
            )}
          </div>
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[100px] truncate">
                  {session?.user?.name || session?.user?.email || '用户'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="p-2">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-amber-50"
                    >
                      <User className="h-4 w-4" />
                      个人中心
                    </Link>
                    <Link
                      href="/profile/bookmarks"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-amber-50"
                    >
                      <Bookmark className="h-4 w-4" />
                      我的书签
                    </Link>
                    <Link
                      href="/profile/notes"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-amber-50"
                    >
                      <FileText className="h-4 w-4" />
                      我的笔记
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut() }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block"
              >
                登录
              </Link>
              <Link href="/auth/register">
                <Button variant="primary" size="sm" className="hidden sm:inline-flex">
                  注册
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center p-2 text-gray-600 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="space-y-1 px-4 pb-4 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                    pathname.startsWith(link.href)
                      ? 'bg-amber-50 text-amber-800'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
            <hr className="my-2 border-gray-200" />
            {isLoggedIn ? (
              <>
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  个人中心
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut() }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                登录
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

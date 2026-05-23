import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Serif_SC } from 'next/font/google'
import { SessionProvider } from '@/components/layout/session-provider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const notoSerif = Noto_Serif_SC({
  variable: '--font-noto-serif',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
})

export const metadata: Metadata = {
  title: '本草典 - 中医古籍数字化平台',
  description:
    '本草典是专注于中医古籍的数字化阅读与研究平台，提供全文检索、图文对照、繁简转换、字典释义等功能。基于识典古籍公开数据构建。',
  keywords: ['中医古籍', '本草', '数字化', '古籍阅读', '中医'],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-Hans" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerif.variable} min-h-full font-sans antialiased flex flex-col`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}

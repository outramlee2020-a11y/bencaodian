import Link from 'next/link'

const footerLinks = [
  {
    title: '古籍分类',
    links: [
      { href: '/library?category=jing', label: '经部' },
      { href: '/library?category=shi', label: '史部' },
      { href: '/library?category=zi', label: '子部' },
      { href: '/library?category=ji', label: '集部' },
      { href: '/library?category=fo', label: '佛教部' },
      { href: '/library?category=dao', label: '道教部' },
    ],
  },
  {
    title: '功能',
    links: [
      { href: '/search', label: '全文搜索' },
      { href: '/library', label: '书库浏览' },
      { href: '/', label: 'AI助手' },
    ],
  },
  {
    title: '关于',
    links: [
      { href: '/', label: '关于我们' },
      { href: '/', label: '用户协议' },
      { href: '/', label: '隐私政策' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">本草典</span>
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              中医古籍数字化平台
              <br />
              让经典触手可及
            </p>
          </div>

          {/* Link Groups */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-gray-900">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-400">
            基于 识典古籍 公开数据构建 · 仅供学习研究使用
          </p>
        </div>
      </div>
    </footer>
  )
}

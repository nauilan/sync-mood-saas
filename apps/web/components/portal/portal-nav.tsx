'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Music, Home, BookOpen, DollarSign, FileText, TrendingUp, Info, User } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: Home },
  { href: '/portal/obras', label: 'Obras', icon: BookOpen },
  { href: '/portal/recebimentos', label: 'Recebimentos', icon: DollarSign },
  { href: '/portal/demonstrativos', label: 'Demonstrativos', icon: FileText },
  { href: '/portal/royalties-futuros', label: 'Royalties', icon: TrendingUp },
  { href: '/portal/informe-rendimentos', label: 'Informe IR', icon: Info },
  { href: '/portal/perfil', label: 'Perfil', icon: User },
]

export function PortalNav() {
  const path = usePathname()
  return (
    <nav className="border-b border-white/[0.06] bg-[#0a0916]/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
        <Link href="/portal/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <Music className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white/80">Portal do Autor</span>
        </Link>
        <div className="flex-1 flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = path === item.href || path.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${active ? 'bg-violet-600 text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'}`}>
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
          NB
        </div>
      </div>
    </nav>
  )
}

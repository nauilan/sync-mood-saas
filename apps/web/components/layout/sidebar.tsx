'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Music2, LayoutDashboard, Users, FileText, Music, Download,
  PieChart, CreditCard, Wallet, TrendingUp, Settings, MessageSquare,
  Building2, GitBranch, BarChart3, Receipt, BookOpen, Send, Shield, Bell
} from 'lucide-react'
import type { NavSection } from './nav-config'

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>

const ICON_MAP: Record<string, IconComponent> = {
  LayoutDashboard, Users, FileText, Music, Download, PieChart, CreditCard,
  Wallet, TrendingUp, Settings, MessageSquare, Building2, GitBranch,
  BarChart3, Receipt, BookOpen, Send, Shield, Bell,
}

interface SidebarProps {
  nav: NavSection[]
  role: 'master' | 'editora' | 'titular'
  editoraNome?: string
  userName?: string
  userInitials?: string
}

export function Sidebar({ nav, role, editoraNome, userName, userInitials }: SidebarProps) {
  const pathname = usePathname()

  const roleBadge = {
    master: 'bg-violet-500/15 text-violet-400 border border-violet-500/20',
    editora: 'bg-sky-500/15 text-sky-400 border border-sky-500/20',
    titular: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  }[role]

  const roleLabel = { master: 'Portal Master', editora: 'Portal Editora', titular: 'Portal Titular' }[role]

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-[#0d1526] border-r border-white/[0.05] shrink-0">
      {/* Logo / Wordmark */}
      <div className="flex flex-col gap-3 px-5 pt-6 pb-5 border-b border-white/[0.05]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgb(139_92_246_/_0.4)] group-hover:shadow-[0_0_16px_rgb(139_92_246_/_0.5)] transition-all duration-200">
            <Music2 className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-bold tracking-tight gradient-brand-text">sync.mood</span>
        </Link>
        <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit', roleBadge)}>
          {roleLabel}
        </span>
        {editoraNome && <span className="text-xs text-white/40 truncate">{editoraNome}</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {nav.map((section) => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest px-2 mb-1.5">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-all duration-150 group relative',
                        isActive
                          ? [
                              'bg-gradient-to-r from-violet-500/12 to-cyan-500/6',
                              'text-white/90 font-medium',
                              'border border-violet-500/15',
                            ].join(' ')
                          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/75'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r bg-gradient-to-b from-violet-400 to-cyan-400" />
                      )}
                      <Icon
                        className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-violet-400' : 'text-white/25 group-hover:text-white/50')}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge != null && (
                        <span className="ml-auto text-[10px] font-bold bg-rose-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      {userName && (
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.06] transition-colors">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600/70 to-cyan-600/50 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitials ?? userName[0]}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-white/75 truncate">{userName}</p>
              <p className="text-[10px] text-white/35 capitalize">{role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

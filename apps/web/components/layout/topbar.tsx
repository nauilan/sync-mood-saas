'use client'

import { Bell, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopbarProps {
  breadcrumb?: string[]
  actions?: React.ReactNode
  badge?: string
  badgeColor?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'
  notificationCount?: number
}

export function Topbar({ breadcrumb, actions, badge, badgeColor = 'violet', notificationCount }: TopbarProps) {
  const badgeColors = {
    violet: 'bg-violet-500/12 text-violet-300 border border-violet-500/20',
    sky: 'bg-sky-500/12 text-sky-300 border border-sky-500/20',
    emerald: 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20',
    amber: 'bg-amber-500/12 text-amber-300 border border-amber-500/20',
    rose: 'bg-rose-500/12 text-rose-300 border border-rose-500/20',
  }

  return (
    <header className="h-14 flex items-center gap-3 px-6 border-b border-white/[0.05] shrink-0 backdrop-blur-md bg-[#0a0e1a]/80 sticky top-0 z-20">
      <nav className="flex items-center gap-1.5 text-sm flex-1 min-w-0">
        {breadcrumb?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="w-3 h-3 text-white/20 shrink-0" strokeWidth={1.5} />}
            <span className={cn('truncate', i === (breadcrumb.length - 1) ? 'text-white/80 font-medium' : 'text-white/30')}>
              {crumb}
            </span>
          </span>
        ))}
        {badge && (
          <span className={cn('text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ml-2', badgeColors[badgeColor])}>
            {badge}
          </span>
        )}
      </nav>
      <div className="flex items-center gap-2 shrink-0">
        {actions}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
          <Bell className="w-4 h-4" strokeWidth={1.5} />
          {notificationCount != null && notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_6px_rgb(239_68_68_/_0.4)]">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

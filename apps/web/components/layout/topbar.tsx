'use client'

import { Search, Sparkles, Bell, Mail, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopbarProps {
  breadcrumb?: string[]
  actions?: React.ReactNode
  badge?: string
  badgeColor?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'
  notificationCount?: number
  userName?: string
  userInitials?: string
}

export function Topbar({ breadcrumb, actions, badge, badgeColor = 'violet', notificationCount, userName, userInitials }: TopbarProps) {
  return (
    <header className="h-14 flex items-center gap-4 px-6 border-b border-white/[0.05] shrink-0 bg-[#07060f]/90 backdrop-blur-md sticky top-0 z-20">
      {/* Search bar — center */}
      <div className="flex-1 max-w-xl mx-auto">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-white/25 pointer-events-none" strokeWidth={1.5}/>
          <input
            type="text"
            placeholder="Buscar obras, autores, ISWC, gravacoes, contratos..."
            className="w-full h-9 pl-9 pr-14 rounded-xl bg-white/[0.05] border border-white/[0.07] text-[12.5px] text-white/60 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.07] transition-all duration-150"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 bg-white/[0.06] rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-white/30 font-medium">⌘K</span>
          </div>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Sparkle / IA */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150">
          <Sparkles className="w-4 h-4" strokeWidth={1.5}/>
        </button>

        {/* Bell with badge */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150">
          <Bell className="w-4 h-4" strokeWidth={1.5}/>
          {(notificationCount ?? 3) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_6px_rgb(239_68_68_/_0.4)]">
              {(notificationCount ?? 3) > 9 ? '9+' : (notificationCount ?? 3)}
            </span>
          )}
        </button>

        {/* Mail */}
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150">
          <Mail className="w-4 h-4" strokeWidth={1.5}/>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-1"/>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all duration-150 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
            {userInitials ?? (userName ? userName[0] : 'ML')}
          </div>
          <span className="text-[12.5px] font-medium text-white/70 hidden sm:block">
            {userName ?? 'Marina Lopes'}
          </span>
          <ChevronDown className="w-3 h-3 text-white/25 group-hover:text-white/50 transition-colors" strokeWidth={2}/>
        </button>
      </div>
    </header>
  )
}

'use client'

import { Search, Sparkles, Bell, Mail, ChevronDown, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TopbarProps {
  breadcrumb?: string[]
  actions?: React.ReactNode
  badge?: string
  badgeColor?: 'violet' | 'sky' | 'emerald' | 'amber' | 'rose'
  notificationCount?: number
  userName?: string
  userInitials?: string
  onMenuClick?: () => void
}

export function Topbar({
  breadcrumb, actions, badge, badgeColor = 'violet',
  notificationCount, userName, userInitials, onMenuClick,
}: TopbarProps) {
  return (
    <header className="h-14 flex items-center gap-3 px-4 md:px-6 border-b border-white/[0.05] shrink-0 bg-[#07060f]/90 backdrop-blur-md sticky top-0 z-20">

      {/* Hamburger — apenas mobile */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors shrink-0"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5" strokeWidth={1.5} />
      </button>

      {/* Search bar — oculta em mobile, visível em md+ */}
      <div className="hidden md:flex flex-1 max-w-xl mx-auto">
        <div className="relative flex items-center w-full">
          <Search className="absolute left-3 w-3.5 h-3.5 text-white/25 pointer-events-none" strokeWidth={1.5}/>
          <input
            type="text"
            placeholder="Buscar obras, autores, ISWC, gravações, contratos..."
            className="w-full h-9 pl-9 pr-14 rounded-xl bg-white/[0.05] border border-white/[0.07] text-[12.5px] text-white/60 placeholder:text-white/25 focus:outline-none focus:border-violet-500/40 focus:bg-white/[0.07] transition-all duration-150"
          />
          <div className="absolute right-2.5 flex items-center gap-0.5 bg-white/[0.06] rounded-md px-1.5 py-0.5">
            <span className="text-[10px] text-white/30 font-medium">⌘K</span>
          </div>
        </div>
      </div>

      {/* Spacer mobile (empurra ações para a direita) */}
      <div className="flex-1 md:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Sparkle / IA — oculto em mobile pequeno */}
        <button className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/35 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150">
          <Sparkles className="w-4 h-4" strokeWidth={1.5}/>
        </button>

        {/* Bell com badge */}
        <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150">
          <Bell className="w-4 h-4" strokeWidth={1.5}/>
          {(notificationCount ?? 3) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-[0_0_6px_rgb(239_68_68_/_0.4)]">
              {(notificationCount ?? 3) > 9 ? '9+' : (notificationCount ?? 3)}
            </span>
          )}
        </button>

        {/* Mail — oculto em mobile */}
        <button className="hidden sm:flex w-8 h-8 rounded-lg items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/[0.05] transition-all duration-150">
          <Mail className="w-4 h-4" strokeWidth={1.5}/>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-0.5"/>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.05] transition-all duration-150 group">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
            {userInitials ?? (userName ? userName[0] : 'ML')}
          </div>
          <span className="text-[12.5px] font-medium text-white/70 hidden sm:block">
            {userName ?? 'Marina Lopes'}
          </span>
          <ChevronDown className="w-3 h-3 text-white/25 group-hover:text-white/50 transition-colors hidden sm:block" strokeWidth={2}/>
        </button>
      </div>
    </header>
  )
}

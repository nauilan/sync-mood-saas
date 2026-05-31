'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Music, DollarSign, Shield, Link as LinkIcon, GitBranch,
  FileText, BarChart3, TrendingUp, Sparkles, Puzzle, Users, Download,
  PieChart, CreditCard, Wallet, Receipt, BookOpen, Bell, Settings,
  Coins, FolderOpen, Building2, FilePlus, Mic2, GitFork, Archive, ListMusic,
  ChevronDown, SkipBack, SkipForward, Play, Pause, ShieldAlert, Tags,
  Database, Upload, AlertTriangle, Activity, Tv, Target,
} from 'lucide-react'
import type { NavSection } from './nav-config'
import { PerfilSwitcher } from './perfil-switcher'

type IconComponent = React.ComponentType<{ className?: string; strokeWidth?: number }>

const ICON_MAP: Record<string, IconComponent> = {
  LayoutDashboard, Music, DollarSign, Shield, Link: LinkIcon, GitBranch,
  FileText, BarChart3, TrendingUp, Sparkles, Puzzle, Users, Download,
  PieChart, CreditCard, Wallet, Receipt, BookOpen, Bell, Settings,
  Coins, FolderOpen, Building2, FilePlus, Mic2, GitFork, Archive, ListMusic,
  ShieldAlert, Tags, Database, Upload, AlertTriangle, Activity, Tv, Target,
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
  const navRef   = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    const nav  = navRef.current
    const item = activeRef.current
    if (!nav || !item) return

    // Calcula posicao do item RELATIVA ao container nav (nao a pagina)
    const navRect  = nav.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const relTop   = itemRect.top  - navRect.top  + nav.scrollTop
    const target   = relTop - nav.clientHeight / 2 + itemRect.height / 2

    nav.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [pathname])

  return (
    <aside className="flex flex-col w-[242px] min-h-screen bg-[#0a0916] border-r border-white/[0.05] shrink-0">
      {/* Logo — Sync Mood */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-3 group">
          {/* Circle logo with violet gradient */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_16px_rgb(139_92_246_/_0.5)]"
            style={{ background: 'radial-gradient(circle at 30% 30%, #a78bfa, #6d28d9)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3.5" stroke="white" strokeWidth="1.5"/>
              <path d="M9 2.5 C9 2.5 14 5 14 9 C14 13 9 15.5 9 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 2.5 C9 2.5 4 5 4 9 C4 13 9 15.5 9 15.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-[0.15em] text-white uppercase">sync.mood</span>
            <span className="text-[9px] font-medium tracking-[0.25em] text-white/40 uppercase">Gestão Inteligente</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav ref={navRef} className="flex-1 overflow-y-auto px-3 py-2 scroll-smooth">
        {nav.map((section) => (
          <div key={section.title}>
            {section.title !== 'Principal' && (
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest px-3 mb-1 mt-3">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                const Icon = ICON_MAP[item.iconName] ?? LayoutDashboard
                return (
                  <li key={item.href}>
                    <Link
                      ref={isActive ? activeRef : undefined}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150 group relative',
                        isActive
                          ? 'bg-gradient-to-r from-violet-600/20 to-violet-500/8 text-white font-medium border border-violet-500/20'
                          : 'text-[#8a8a9a] hover:bg-white/[0.04] hover:text-white/80'
                      )}
                    >
                      <Icon
                        className={cn('w-4 h-4 shrink-0 transition-colors',
                          isActive ? 'text-violet-400' : 'text-[#5a5a6a] group-hover:text-white/50'
                        )}
                        strokeWidth={1.5}
                      />
                      <span className="truncate text-[13px]">{item.label}</span>
                      {item.badge != null && (
                        <span className="ml-auto text-[9px] font-bold bg-violet-600 text-white rounded-md px-1.5 py-0.5 tracking-wide">
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

      {/* Music Player */}
      <div className="mx-3 mb-3 rounded-2xl overflow-hidden border border-white/[0.06]" style={{ background: '#11111d' }}>
        {/* Album art placeholder */}
        <div className="relative w-full h-[120px] overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 60% 40%, #6d28d9 0%, #3b1a6e 40%, #0f0a1e 100%)'
          }} />
          {/* Abstract figure silhouette */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice">
            <defs>
              <radialGradient id="glow1" cx="60%" cy="40%" r="50%">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="transparent"/>
              </radialGradient>
            </defs>
            <ellipse cx="140" cy="50" rx="60" ry="60" fill="url(#glow1)"/>
            <path d="M120 110 Q130 70 140 50 Q150 30 145 20 Q140 10 130 15 Q120 20 115 40 Q110 60 120 110Z"
              fill="rgba(30,20,60,0.9)"/>
            <circle cx="135" cy="16" r="8" fill="rgba(30,20,60,0.9)"/>
          </svg>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-xs font-semibold text-white truncate">Sol de Janeiro</p>
            <p className="text-[10px] text-white/50 truncate">Ana Silva, Joao Marques</p>
          </div>
        </div>
        {/* Progress & controls */}
        <div className="px-3 pb-3 pt-2">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] text-white/30">1:23</span>
            <div className="flex-1 h-1 rounded-full bg-white/10 relative">
              <div className="absolute left-0 top-0 h-full rounded-full bg-violet-500 w-[35%]" />
              <div className="absolute h-2.5 w-2.5 rounded-full bg-violet-400 top-1/2 -translate-y-1/2 shadow-[0_0_6px_#8b5cf6]"
                style={{ left: 'calc(35% - 5px)' }} />
            </div>
            <span className="text-[9px] text-white/30">3:47</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button className="text-white/30 hover:text-white/70 transition-colors">
              <SkipBack className="w-3.5 h-3.5" strokeWidth={2}/>
            </button>
            <button className="w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)] hover:bg-violet-100 transition-colors">
              <Play className="w-3 h-3 text-black ml-0.5" strokeWidth={2.5} fill="black"/>
            </button>
            <button className="text-white/30 hover:text-white/70 transition-colors">
              <SkipForward className="w-3.5 h-3.5" strokeWidth={2}/>
            </button>
          </div>
        </div>
      </div>

      {/* User pill */}
      {userName && (
        <div className="px-3 pb-4">
          <button className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {userInitials ?? userName[0]}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[12px] font-medium text-white/80 truncate">{userName}</p>
              <p className="text-[10px] text-white/35 truncate">Editora Top Show</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-white/25 shrink-0 group-hover:text-white/50 transition-colors" strokeWidth={2}/>
          </button>
        </div>
      )}

      {/* Perfil Switcher */}
      <div className="px-3 pb-4">
        <PerfilSwitcher />
      </div>
    </aside>
  )
}

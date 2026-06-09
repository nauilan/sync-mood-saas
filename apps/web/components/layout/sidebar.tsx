'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Music, DollarSign, Shield, Link as LinkIcon, GitBranch,
  FileText, BarChart3, TrendingUp, Sparkles, Puzzle, Users, Download,
  PieChart, CreditCard, Wallet, Receipt, BookOpen, Bell, Settings,
  Coins, FolderOpen, Building2, FilePlus, Mic2, GitFork, Archive, ListMusic,
  ChevronDown, Pause, ShieldAlert, Tags,
  Database, Upload, AlertTriangle, Activity, Tv, Target,
  Eye, Lock, Calendar, FileInput, FileCode2, Shuffle, Radio,
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
  Eye, Lock, Calendar, FileInput, FileCode2, Shuffle, Radio,
}

interface SidebarProps {
  nav: NavSection[]
  role: 'master' | 'editora' | 'titular'
  editoraNome?: string
  tenantNome?: string
  userName?: string
  userInitials?: string
  mobileOpen?: boolean
  onClose?: () => void
}

const NAV_SCROLL_KEY = 'sidebar_scroll_top'

export function Sidebar({ nav, role, editoraNome, tenantNome, userName, userInitials, mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const navRef    = useRef<HTMLElement>(null)
  const activeRef = useRef<HTMLAnchorElement>(null)

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    onClose?.()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restaura posição de scroll salva ao montar
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const saved = sessionStorage.getItem(NAV_SCROLL_KEY)
    if (saved !== null) nav.scrollTop = parseInt(saved, 10)
  }, [])

  // Persiste posição de scroll ao rolar
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const onScroll = () => sessionStorage.setItem(NAV_SCROLL_KEY, String(nav.scrollTop))
    nav.addEventListener('scroll', onScroll, { passive: true })
    return () => nav.removeEventListener('scroll', onScroll)
  }, [])

  // Centraliza item ativo no container da nav
  useEffect(() => {
    const nav  = navRef.current
    const item = activeRef.current
    if (!nav || !item) return
    const navRect  = nav.getBoundingClientRect()
    const itemRect = item.getBoundingClientRect()
    const relTop   = itemRect.top - navRect.top + nav.scrollTop
    const target   = relTop - nav.clientHeight / 2 + itemRect.height / 2
    nav.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [pathname])

  return (
    <aside
      className={cn(
        // Desktop: sempre visível
        'flex flex-col h-full w-[242px] bg-[#0a0916] border-r border-white/[0.05] shrink-0',
        // Mobile: drawer deslizante (z-50 acima do overlay z-40)
        'fixed md:relative inset-y-0 left-0 z-50',
        'transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* Logo — Sync Mood */}
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_16px_rgb(139_92_246_/_0.5)]"
            style={{ background: 'radial-gradient(circle at 30% 30%, #a78bfa, #6d28d9)' }}
          >
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

        {/* Botão fechar — apenas mobile */}
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
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

      {/* User pill */}
      {userName && (
        <div className="px-3 pb-4">
          <button className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-colors group">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {userInitials ?? userName[0]}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[12px] font-medium text-white/80 truncate">{userName}</p>
              <p className="text-[10px] text-white/35 truncate">{tenantNome ?? editoraNome ?? ''}</p>
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

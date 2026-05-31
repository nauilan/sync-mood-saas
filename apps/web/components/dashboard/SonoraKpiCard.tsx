'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SonoraKpiCardProps {
  title: string
  value: string
  trend?: string
  trendUp?: boolean
  icon?: React.ReactNode
  sparkline?: boolean
}

// Sparkline paths (pre-computed violet trend line)
const SPARKLINE = "M 0 24 L 8 22 L 16 20 L 24 18 L 32 15 L 40 17 L 48 13 L 56 11 L 64 14 L 72 10 L 80 8"

export function SonoraKpiCard({ title, value, trend, trendUp = true, icon, sparkline }: SonoraKpiCardProps) {
  return (
    <div className="relative rounded-2xl p-5 border border-white/[0.06] overflow-hidden group transition-all duration-200 hover:border-white/[0.09]"
      style={{ background: '#11111d' }}>
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(ellipse at 0% 0%, rgba(139,92,246,0.05) 0%, transparent 60%)' }}/>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11.5px] text-[#8a8a9a] font-medium">{title}</p>
          {icon && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1))' }}>
              {icon}
            </div>
          )}
        </div>

        <p className="text-[22px] font-bold text-white leading-none mb-3 tabular-nums">{value}</p>

        <div className="flex items-end justify-between gap-2">
          {trend && (
            <div className={cn('flex items-center gap-1 text-[11px] font-semibold',
              trendUp ? 'text-emerald-400' : 'text-rose-400')}>
              {trendUp
                ? <TrendingUp className="w-3 h-3" strokeWidth={2.5}/>
                : <TrendingDown className="w-3 h-3" strokeWidth={2.5}/>
              }
              {trend}
            </div>
          )}
          {sparkline && (
            <svg width="80" height="28" viewBox="0 0 80 28" fill="none" className="shrink-0">
              <defs>
                <linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.5"/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="1"/>
                </linearGradient>
              </defs>
              <path d={SPARKLINE} stroke="url(#sparkGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          )}
        </div>
      </div>
    </div>
  )
}

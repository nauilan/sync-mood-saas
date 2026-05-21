import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendLabel?: string
  accent?: 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'cyan'
  icon?: React.ReactNode
  className?: string
  onClick?: () => void
}

const accentConfig = {
  violet: {
    text: 'text-violet-400',
    glow: 'from-violet-600/8 via-transparent',
    border: 'border-violet-500/10',
    iconBg: 'bg-violet-500/10',
    gradient: 'from-violet-400 to-violet-300',
  },
  emerald: {
    text: 'text-emerald-400',
    glow: 'from-emerald-600/8 via-transparent',
    border: 'border-emerald-500/10',
    iconBg: 'bg-emerald-500/10',
    gradient: 'from-emerald-400 to-cyan-400',
  },
  amber: {
    text: 'text-amber-400',
    glow: 'from-amber-600/8 via-transparent',
    border: 'border-amber-500/10',
    iconBg: 'bg-amber-500/10',
    gradient: 'from-amber-400 to-amber-300',
  },
  rose: {
    text: 'text-rose-400',
    glow: 'from-rose-600/8 via-transparent',
    border: 'border-rose-500/10',
    iconBg: 'bg-rose-500/10',
    gradient: 'from-rose-400 to-rose-300',
  },
  sky: {
    text: 'text-sky-400',
    glow: 'from-sky-600/8 via-transparent',
    border: 'border-sky-500/10',
    iconBg: 'bg-sky-500/10',
    gradient: 'from-sky-400 to-cyan-400',
  },
  cyan: {
    text: 'text-cyan-400',
    glow: 'from-cyan-600/8 via-transparent',
    border: 'border-cyan-500/10',
    iconBg: 'bg-cyan-500/10',
    gradient: 'from-cyan-400 to-sky-300',
  },
}

export function KpiCard({ title, value, subtitle, trend, trendLabel = 'vs mes anterior', accent = 'violet', icon, className, onClick }: KpiCardProps) {
  const cfg = accentConfig[accent]
  const TrendIcon = trend == null ? null : trend >= 0 ? TrendingUp : TrendingDown
  const trendColor = trend == null ? '' : trend >= 0 ? 'text-emerald-400' : 'text-rose-400'

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        'bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5',
        'shadow-[var(--shadow-card)]',
        'transition-all duration-200 ease-out',
        onClick && 'cursor-pointer hover:border-white/10 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      {/* Subtle radial gradient accent */}
      <div className={cn('absolute inset-0 bg-gradient-radial', cfg.glow, 'to-transparent opacity-60 pointer-events-none')} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <span className="text-xs font-medium text-white/50 tracking-wide">{title}</span>
          {icon && (
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cfg.iconBg)}>
              {icon}
            </div>
          )}
        </div>

        <div className={cn('text-2xl font-bold mb-1 tabular-nums', cfg.text)}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </div>

        {subtitle && <p className="text-xs text-white/35 leading-relaxed">{subtitle}</p>}

        {trend != null && TrendIcon && (
          <div className={cn('flex items-center gap-1 mt-2.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3 h-3" strokeWidth={1.5} />
            <span>{Math.abs(trend).toFixed(1)}% {trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  )
}

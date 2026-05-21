import { cn } from '@/lib/utils'

type BadgeVariant = 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'cyan'

const variantMap: Record<BadgeVariant, string> = {
  violet: 'bg-violet-500/12 text-violet-300 border border-violet-500/20 shadow-[0_0_8px_rgb(139_92_246_/_0.1)]',
  emerald: 'bg-emerald-500/12 text-emerald-300 border border-emerald-500/20',
  amber: 'bg-amber-500/12 text-amber-300 border border-amber-500/20',
  rose: 'bg-rose-500/12 text-rose-300 border border-rose-500/20',
  sky: 'bg-sky-500/12 text-sky-300 border border-sky-500/20',
  cyan: 'bg-cyan-500/12 text-cyan-300 border border-cyan-500/20',
  slate: 'bg-white/5 text-white/50 border border-white/[0.06]',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'slate', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full',
      'text-[10px] font-semibold uppercase tracking-wider',
      'px-2 py-0.5',
      variantMap[variant],
      className
    )}>
      {children}
    </span>
  )
}

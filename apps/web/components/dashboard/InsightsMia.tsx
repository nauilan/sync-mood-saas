'use client'

import { ChevronRight, Shield, Diamond, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Insight {
  icon: React.ReactNode
  iconBg: string
  title: string
  description: string
  badge: string
  badgeColor: string
}

const insights: Insight[] = [
  {
    icon: <Shield className="w-4 h-4 text-rose-400" strokeWidth={1.5}/>,
    iconBg: 'bg-rose-500/10',
    title: 'Uso nao autorizado detectado',
    description: '32 usos identificados esta semana',
    badge: 'ALTO IMPACTO',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  },
  {
    icon: <Diamond className="w-4 h-4 text-violet-400" strokeWidth={1.5}/>,
    iconBg: 'bg-violet-500/10',
    title: 'Oportunidade de sincronizacao',
    description: 'Nova campanha combinando com suas obras',
    badge: 'NOVO',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
  },
  {
    icon: <Zap className="w-4 h-4 text-cyan-400" strokeWidth={1.5}/>,
    iconBg: 'bg-cyan-500/10',
    title: 'Tendencia em alta',
    description: '"Sol de Janeiro" +215% nas ultimas 4 semanas',
    badge: 'TENDENCIA',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20',
  },
]

export function InsightsMia() {
  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold text-white">✦ Insights da Mia</span>
        </div>
        <button className="text-[11px] text-[#8a8a9a] hover:text-white/70 transition-colors">Ver todos</button>
      </div>

      {insights.map((insight) => (
        <button
          key={insight.title}
          className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03] transition-all duration-150 group text-left w-full"
          style={{ background: '#11111d' }}>
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5', insight.iconBg)}>
            {insight.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-white/85 leading-snug mb-1">{insight.title}</p>
            <p className="text-[11px] text-[#8a8a9a] mb-2">{insight.description}</p>
            <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wider', insight.badgeColor)}>
              {insight.badge}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors shrink-0 mt-0.5"/>
        </button>
      ))}
    </div>
  )
}

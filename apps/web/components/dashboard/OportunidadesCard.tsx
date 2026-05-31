'use client'

import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const oportunidades = [
  {
    title: 'Campanha de Moda Verao 2024',
    badge: 'SINCRONIZACAO',
    badgeColor: 'bg-violet-600/30 text-violet-300 border-violet-500/30',
    value: 'Potencial de R$ 120K+',
    gradient: 'linear-gradient(135deg, #4c1d95, #7c3aed)',
  },
  {
    title: 'Serie de TV',
    badge: 'LICENCIAMENTO',
    badgeColor: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/20',
    value: 'Potencial de R$ 85K+',
    gradient: 'linear-gradient(135deg, #1e3a5f, #1e6bad)',
  },
  {
    title: 'Expansao na America Latina',
    badge: 'CRESCIMENTO',
    badgeColor: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/20',
    value: '+15% de crescimento projetado',
    gradient: 'linear-gradient(135deg, #064e3b, #059669)',
  },
]

export function OportunidadesCard() {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: '#11111d' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-white">Oportunidades para voce</h3>
        <button className="text-[11px] text-[#8a8a9a] hover:text-white/70 transition-colors">Ver todas</button>
      </div>

      <div className="space-y-3">
        {oportunidades.map((op) => (
          <button key={op.title}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-white/[0.03] transition-all duration-150 group text-left border border-transparent hover:border-white/[0.06]">
            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
              style={{ background: op.gradient }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 3 L17 7 L17 13 L10 17 L3 13 L3 7Z" stroke="white" strokeWidth="1.2" strokeOpacity="0.6" fill="none"/>
                <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.5"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-white/85 truncate mb-1">{op.title}</p>
              <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded-md border tracking-wider', op.badgeColor)}>
                {op.badge}
              </span>
              <p className="text-[10px] text-[#8a8a9a] mt-1">{op.value}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 shrink-0 transition-colors"/>
          </button>
        ))}
      </div>
    </div>
  )
}

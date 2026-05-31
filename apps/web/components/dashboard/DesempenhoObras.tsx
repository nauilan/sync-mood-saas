'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const periods = ['7D', '30D', '3M', '12M'] as const
type Period = typeof periods[number]

const obras = [
  { rank: 1, title: 'Sol de Janeiro', authors: 'Ana Silva, Joao Marques', value: 'R$ 23.540,32', pct: 23.5, up: true },
  { rank: 2, title: 'Fortaleza', authors: 'Ana Silva, Maria Santos', value: 'R$ 18.230,11', pct: 12.7, up: true },
  { rank: 3, title: 'Vento no Mar', authors: 'Lucas Oliveira, Pedro Costa', value: 'R$ 15.890,75', pct: 8.1, up: true },
  { rank: 4, title: 'Ate o Fim', authors: 'Joao Marques, Ana Silva', value: 'R$ 12.450,90', pct: 3.2, up: false },
  { rank: 5, title: 'Liberdade', authors: 'Maria Santos, Lucas Oliveira', value: 'R$ 9.876,54', pct: 5.4, up: true },
]

// Mini sparklines
const SPARKS_UP = [
  "M0 16 L10 14 L20 12 L30 9 L40 11 L50 7",
  "M0 18 L10 15 L20 16 L30 12 L40 9 L50 11",
  "M0 16 L10 13 L20 15 L30 10 L40 8 L50 6",
  "M0 12 L10 14 L20 10 L30 9 L40 7 L50 5",
  "M0 16 L10 14 L20 11 L30 13 L40 9 L50 8",
]
const SPARKS_DOWN = [
  "M0 8 L10 10 L20 9 L30 13 L40 15 L50 18",
]

export function DesempenhoObras() {
  const [period, setPeriod] = useState<Period>('30D')

  return (
    <div className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: '#11111d' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-white">Desempenho de obras</h3>
        <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5">
          {periods.map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={cn('text-[10px] font-medium px-2 py-1 rounded-md transition-all duration-150',
                period === p ? 'bg-violet-600 text-white shadow-sm' : 'text-[#8a8a9a] hover:text-white')}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {obras.map((obra, i) => (
          <div key={obra.rank} className="flex items-center gap-3 group">
            <span className="text-[11px] text-[#5a5a6a] font-medium w-4 text-center shrink-0">{obra.rank}</span>
            {/* Thumbnail */}
            <div className="w-8 h-8 rounded-lg shrink-0 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${['#6d28d9','#7c3aed','#5b21b6','#4c1d95','#7c3aed'][i]}, ${['#a78bfa','#8b5cf6','#7c3aed','#6d28d9','#9061f9'][i]})` }}>
              <svg width="32" height="32" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="5" fill="none" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
                <path d="M16 10 L16 5 L21 7" stroke="white" strokeWidth="1.5" strokeOpacity="0.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white/85 truncate">{obra.title}</p>
              <p className="text-[10px] text-[#8a8a9a] truncate">{obra.authors}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-semibold text-white/80 tabular-nums">{obra.value}</p>
              <div className={cn('flex items-center justify-end gap-0.5 text-[10px] font-medium',
                obra.up ? 'text-emerald-400' : 'text-rose-400')}>
                {obra.up ? <TrendingUp className="w-2.5 h-2.5" strokeWidth={2.5}/> : <TrendingDown className="w-2.5 h-2.5" strokeWidth={2.5}/>}
                {obra.pct}%
              </div>
            </div>
            {/* Sparkline */}
            <svg width="50" height="20" viewBox="0 0 50 20" className="shrink-0">
              <path d={obra.up ? SPARKS_UP[i] || SPARKS_UP[0] : SPARKS_DOWN[0]}
                stroke={obra.up ? '#a78bfa' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
        ))}
      </div>

      <button className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
        Ver todas as obras <ChevronRight className="w-3 h-3" strokeWidth={2}/>
      </button>
    </div>
  )
}

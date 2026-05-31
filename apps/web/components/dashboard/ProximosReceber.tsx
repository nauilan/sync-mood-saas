'use client'

import { ChevronRight } from 'lucide-react'

const proximosReceber = [
  {
    name: 'Spotify',
    color: '#1DB954',
    sub: 'Pagamentos de Maio/2024',
    value: 'R$ 152.230,10',
    days: 7,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill="#1DB954"/>
        <path d="M6 12.5 Q10 10.5 14 12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5.5 10 Q10 7.5 14.5 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M5 7.5 Q10 5 15 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: 'YouTube Content ID',
    color: '#FF0000',
    sub: 'Pagamentos de Maio/2024',
    value: 'R$ 68.450,00',
    days: 9,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="1" y="1" width="18" height="18" rx="4" fill="#FF0000"/>
        <path d="M8 7 L14 10 L8 13Z" fill="white"/>
      </svg>
    ),
  },
  {
    name: 'Deezer',
    color: '#a100ff',
    sub: 'Pagamentos de Maio/2024',
    value: 'R$ 21.350,05',
    days: 12,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill="#a100ff"/>
        <rect x="5" y="8" width="2" height="5" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="9" y="6" width="2" height="7" rx="1" fill="white" fillOpacity="0.9"/>
        <rect x="13" y="9" width="2" height="4" rx="1" fill="white" fillOpacity="0.9"/>
      </svg>
    ),
  },
]

export function ProximosReceber() {
  return (
    <div className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: '#11111d' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-white">Proximos a receber</h3>
        <button className="text-[11px] text-[#8a8a9a] hover:text-white/70 transition-colors">Ver todos</button>
      </div>

      <div className="space-y-3">
        {proximosReceber.map((item) => (
          <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
            <div className="shrink-0">{item.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-medium text-white/85">{item.name}</p>
              <p className="text-[10px] text-[#8a8a9a]">{item.sub}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12.5px] font-semibold text-white/80 tabular-nums">{item.value}</p>
              <p className="text-[10px] text-[#8a8a9a]">Em {item.days} dias</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
        Ver calendario completo <ChevronRight className="w-3 h-3" strokeWidth={2}/>
      </button>
    </div>
  )
}

'use client'

import { ChevronRight } from 'lucide-react'

// Royalties por fonte — Donut chart (SVG)
export function RoyaltiesPorFonteChart() {
  const data = [
    { label: 'Execucao Publica', pct: 52.8, value: 'R$ 285.450,30', color: '#8b5cf6' },
    { label: 'Streaming', pct: 28.1, value: 'R$ 152.230,10', color: '#a78bfa' },
    { label: 'Sincronizacao', pct: 12.6, value: 'R$ 68.450,00', color: '#6d28d9' },
    { label: 'Venda Fisica/Digital', pct: 3.9, value: 'R$ 21.350,05', color: '#c4b5fd' },
    { label: 'Outros', pct: 2.6, value: 'R$ 15.200,00', color: '#4c1d95' },
  ]

  // Build donut segments
  const R = 52, cx = 70, cy = 70, stroke = 18
  let cumPct = 0
  const circ = 2 * Math.PI * R

  const segments = data.map((d) => {
    const offset = circ * (1 - cumPct / 100)
    const len = circ * d.pct / 100
    cumPct += d.pct
    return { ...d, offset, len }
  })

  return (
    <div className="rounded-2xl border border-white/[0.06] p-5"
      style={{ background: '#11111d' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold text-white">Royalties por fonte</h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="relative shrink-0">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke}/>
            {segments.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                stroke={s.color} strokeWidth={stroke}
                strokeDasharray={`${s.len} ${circ - s.len}`}
                strokeDashoffset={s.offset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}/>
            ))}
            {/* Center text */}
            <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="9" fontWeight="600" opacity="0.6">Total</text>
            <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize="8.5" fontWeight="700">R$ 542.680</text>
            <text x={cx} y={cy + 17} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="600">↑ 18,6%</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.label} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }}/>
              <div className="flex-1 min-w-0">
                <p className="text-[10.5px] text-white/65 truncate">{d.label}</p>
                <p className="text-[9px] text-[#8a8a9a]">{d.pct}%</p>
              </div>
              <p className="text-[10px] text-white/55 tabular-nums shrink-0">{d.value.replace('R$ ', '')}</p>
            </div>
          ))}
        </div>
      </div>

      <button className="mt-3 text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
        Ver relatorio completo <ChevronRight className="w-3 h-3" strokeWidth={2}/>
      </button>
    </div>
  )
}

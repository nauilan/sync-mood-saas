'use client'

import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { MOCK_CC_OBRAS, fmtBRL } from '@/lib/mock-cc'
import { Music, TrendingUp, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react'

export default function CCObraDashboardPage() {
  const sorted = [...MOCK_CC_OBRAS].sort((a, b) => b.saldo_distribuido - a.saldo_distribuido)
  const totalSaldo = MOCK_CC_OBRAS.reduce((s, o) => s + o.saldo_atual, 0)
  const totalDist = MOCK_CC_OBRAS.reduce((s, o) => s + o.saldo_distribuido, 0)
  const comBloqueio = MOCK_CC_OBRAS.filter(o => o.bloqueios.length > 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics — CC Obras"
        description="Ranking de rentabilidade, recoupment ativo e evolução de saldos por obra."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Saldo Total" value={fmtBRL(totalSaldo)} accent="emerald" icon={<DollarSign className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Total Distribuído" value={fmtBRL(totalDist)} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Obras Ativas" value={MOCK_CC_OBRAS.length} accent="sky" icon={<Music className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Com Bloqueio" value={comBloqueio.length} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
      </div>

      {/* Ranking obras mais rentáveis */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white/70 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-violet-400" />
            Obras mais rentáveis (por total distribuído)
          </h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {sorted.map((obra, i) => {
            const maxDist = sorted[0]?.saldo_distribuido || 1
            const pct = (obra.saldo_distribuido / maxDist) * 100
            return (
              <div key={obra.id} className="px-5 py-3.5 flex items-center gap-4">
                <span className="text-xs font-bold text-white/20 w-5 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{obra.obra_titulo}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/35 shrink-0">{pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-violet-400 tabular-nums">{fmtBRL(obra.saldo_distribuido)}</p>
                  <p className="text-[10px] text-white/30 tabular-nums">saldo: {fmtBRL(obra.saldo_atual)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Obras com bloqueio */}
      {comBloqueio.length > 0 && (
        <div className="bg-[#0d1526] border border-rose-500/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-rose-500/10">
            <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Obras com bloqueio ativo
            </h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {comBloqueio.map(obra =>
              obra.bloqueios.map((b, i) => (
                <div key={`${obra.id}-${i}`} className="px-5 py-3 flex items-start gap-3">
                  <Music className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-white/70">{obra.obra_titulo}</p>
                    <p className="text-[10px] text-rose-400/70 mt-0.5">{b.descricao}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

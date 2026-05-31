'use client'

import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { MOCK_CC_TITULARES, fmtBRL } from '@/lib/mock-cc'
import { Users, DollarSign, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react'

export default function CCTitularDashboardPage() {
  const totalSaldo = MOCK_CC_TITULARES.reduce((s, t) => s + t.saldo_atual, 0)
  const totalPago = MOCK_CC_TITULARES.reduce((s, t) => s + t.saldo_pago, 0)
  const totalRecoupment = MOCK_CC_TITULARES.filter(t => t.recoupment_ativo).reduce((s, t) => s + (t.recoupment_ativo?.saldo_devedor ?? 0), 0)

  const sortedPorSaldo = [...MOCK_CC_TITULARES].sort((a, b) => (b.saldo_atual + b.saldo_pago) - (a.saldo_atual + a.saldo_pago))
  const pfTitulares = MOCK_CC_TITULARES.filter(t => t.titular_tipo === 'PF')
  const pjTitulares = MOCK_CC_TITULARES.filter(t => t.titular_tipo === 'PJ')
  const totalRetencoesPF = pfTitulares.flatMap(t => t.movimentos).reduce((s, m) => s + m.retencoes_total, 0)

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics — CC Titulares" description="Ranking de receita, retenções IRPF, distribuição PF vs PJ." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Saldo Total Titulares" value={fmtBRL(totalSaldo)} accent="emerald" icon={<DollarSign className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Total Pago (histórico)" value={fmtBRL(totalPago)} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
        <KpiCard title="Retenções IRPF (PF)" value={fmtBRL(totalRetencoesPF)} accent="amber" icon={<BarChart3 className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Recoupment Total" value={fmtBRL(totalRecoupment)} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
      </div>

      {/* PF vs PJ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0d1526] border border-amber-500/10 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-amber-400 mb-3">Pessoa Física ({pfTitulares.length})</h3>
          <p className="text-2xl font-bold text-amber-400 tabular-nums">{fmtBRL(pfTitulares.reduce((s, t) => s + t.saldo_atual, 0))}</p>
          <p className="text-[10px] text-white/30 mt-1">—</p>
        </div>
        <div className="bg-[#0d1526] border border-sky-500/10 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-sky-400 mb-3">Pessoa Jurídica ({pjTitulares.length})</h3>
          <p className="text-2xl font-bold text-sky-400 tabular-nums">{fmtBRL(pjTitulares.reduce((s, t) => s + t.saldo_atual, 0))}</p>
          <p className="text-[10px] text-white/30 mt-1">IRPF não incide</p>
        </div>
      </div>

      {/* Ranking */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white/70">Ranking titulares por receita total</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {sortedPorSaldo.map((t, i) => {
            const total = t.saldo_atual + t.saldo_pago
            const maxTotal = (sortedPorSaldo[0]?.saldo_atual ?? 0) + (sortedPorSaldo[0]?.saldo_pago ?? 0) || 1
            const pct = (total / maxTotal) * 100
            return (
              <div key={t.id} className="px-5 py-3.5 flex items-center gap-4">
                <span className="text-xs font-bold text-white/20 w-5 shrink-0">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-violet-400">{t.titular_nome.split(' ').map(n => n[0]).slice(0, 2).join('')}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{t.titular_nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className={['text-[9px] font-semibold px-1 rounded', t.titular_tipo === 'PF' ? 'text-amber-400' : 'text-sky-400'].join(' ')}>{t.titular_tipo}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-violet-400 tabular-nums">{fmtBRL(total)}</p>
                  <p className="text-[10px] text-white/30">atual: {fmtBRL(t.saldo_atual)}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

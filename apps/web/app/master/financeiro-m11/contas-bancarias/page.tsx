'use client'

import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Banknote, TrendingUp, Plus, ArrowUpRight } from 'lucide-react'
import { MOCK_CONTAS_BANCARIAS, fmtBRL } from '@/lib/mock-financeiro-m11'

export default function ContasBancariasPage() {
  const totalBRL = MOCK_CONTAS_BANCARIAS.filter(c => c.ativa && c.moeda === 'BRL').reduce((s, c) => s + c.saldo_atual, 0)
  const totalUSD = MOCK_CONTAS_BANCARIAS.filter(c => c.ativa && c.moeda === 'USD').reduce((s, c) => s + c.saldo_atual, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas Bancárias"
        description="Saldos e movimentos das contas bancárias cadastradas."
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Nova Conta
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard title="Saldo BRL (total)" value={fmtBRL(totalBRL)} accent="emerald" icon={<Banknote className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Saldo USD" value={`$ ${totalUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} accent="sky" icon={<Banknote className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Contas Ativas" value={MOCK_CONTAS_BANCARIAS.filter(c => c.ativa).length} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_CONTAS_BANCARIAS.map(cb => (
          <div key={cb.id} className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-5 space-y-3 hover:border-violet-500/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-lg">
                  {cb.bandeira ?? '🏦'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{cb.banco}</p>
                  <p className="text-[10px] text-white/30">{cb.tipo} · {cb.moeda ?? 'BRL'}</p>
                </div>
              </div>
              <div className={['w-2 h-2 rounded-full', cb.ativa ? 'bg-emerald-400' : 'bg-white/20'].join(' ')} title={cb.ativa ? 'Ativa' : 'Inativa'} />
            </div>

            {(cb.agencia || cb.conta) && (
              <div className="flex items-center gap-4 text-xs">
                {cb.agencia && <span className="text-white/40">Ag. <span className="font-mono text-white/60">{cb.agencia}</span></span>}
                {cb.conta && <span className="text-white/40">Conta <span className="font-mono text-white/60">{cb.conta}</span></span>}
              </div>
            )}

            {cb.titular_conta && (
              <p className="text-[10px] text-white/30">{cb.titular_conta}</p>
            )}

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/30">Saldo Atual</p>
                <p className="text-xl font-bold text-white/80 tabular-nums">{fmtBRL(cb.saldo_atual, cb.moeda ?? 'BRL')}</p>
              </div>
              <button className="flex items-center gap-1 h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/40 hover:text-white/70 transition-colors">
                Ver Movimentos <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

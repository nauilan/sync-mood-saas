'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Upload, CheckCircle, AlertTriangle, Clock, Check, X } from 'lucide-react'
import { MOCK_CONCILIACAO, fmtBRL, fmtDate } from '@/lib/mock-financeiro-m11'
import { STATUS_CONCILIACAO_LABELS, STATUS_CONCILIACAO_COLORS, type StatusConciliacao } from '@/lib/types-financeiro-m11'

export default function ConciliacaoBancariaPage() {
  const [filtro, setFiltro] = useState<StatusConciliacao | 'todos'>('todos')
  const [conciliados, setConciliados] = useState<string[]>([])

  const filtered = MOCK_CONCILIACAO.filter(c => filtro === 'todos' || c.status === filtro)

  const pendentes = MOCK_CONCILIACAO.filter(c => c.status === 'pendente').length
  const conciliadosCount = MOCK_CONCILIACAO.filter(c => c.status === 'conciliado').length
  const divergentes = MOCK_CONCILIACAO.filter(c => c.status === 'divergente').length

  function handleConciliar(id: string) {
    setConciliados(prev => [...prev, id])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conciliação Bancária"
        description="Reconciliação de extratos bancários com lançamentos do sistema."
        actions={
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-white/[0.10] text-xs text-white/50 hover:text-white/80 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Upload Extrato
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Pendentes" value={pendentes - conciliados.length} accent="amber" icon={<Clock className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Conciliadas" value={conciliadosCount + conciliados.length} accent="emerald" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Divergentes" value={divergentes} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
      </div>

      <div className="flex items-center gap-2">
        {(['todos', 'pendente', 'conciliado', 'divergente'] as const).map(s => (
          <button key={s} onClick={() => setFiltro(s)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtro === s ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
            {s === 'todos' ? 'Todos' : STATUS_CONCILIACAO_LABELS[s as StatusConciliacao]}
          </button>
        ))}
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Conta</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor Extrato</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Observação</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(c => {
              const forcadoConciliado = conciliados.includes(c.id)
              const statusEfetivo = forcadoConciliado ? 'conciliado' : c.status
              return (
                <tr key={c.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-xs text-white/50 tabular-nums">{fmtDate(c.data_extrato)}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-white/50">{c.conta_nome}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={['text-sm font-semibold tabular-nums', c.valor_extrato >= 0 ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
                      {fmtBRL(Math.abs(c.valor_extrato))}
                    </span>
                    {c.valor_extrato < 0 && <span className="text-[10px] text-rose-400/60 block">débito</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-white/40">{c.observacao ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONCILIACAO_COLORS[statusEfetivo]}`}>
                      {STATUS_CONCILIACAO_LABELS[statusEfetivo]}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {statusEfetivo === 'pendente' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleConciliar(c.id)} className="flex items-center gap-1 h-6 px-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">
                          <Check className="w-3 h-3" /> Conciliar
                        </button>
                        <button className="flex items-center gap-1 h-6 px-2 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] hover:bg-rose-500/20 transition-colors border border-rose-500/20">
                          <X className="w-3 h-3" /> Divergente
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} transação(ões)</p>
        </div>
      </div>
    </div>
  )
}

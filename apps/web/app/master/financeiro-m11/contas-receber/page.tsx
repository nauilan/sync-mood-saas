'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Search, TrendingUp, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { MOCK_RECEBIMENTOS_FIN, fmtBRL, fmtDate } from '@/lib/mock-financeiro-m11'
import { STATUS_RECEBIMENTO_LABELS, STATUS_RECEBIMENTO_COLORS, type StatusRecebimentoM11 } from '@/lib/types-financeiro-m11'

export default function ContasReceberPage() {
  const [filtro, setFiltro] = useState<StatusRecebimentoM11 | 'todos'>('todos')
  const [search, setSearch] = useState('')

  const filtered = MOCK_RECEBIMENTOS_FIN.filter(r => {
    const matchStatus = filtro === 'todos' || r.status === filtro
    const matchSearch = !search || r.fonte_pagadora.toLowerCase().includes(search.toLowerCase()) || r.codigo.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const previstos = MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'previsto')
  const recebidos = MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'recebido')
  const inadimplentes = MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'inadimplente')

  return (
    <div className="space-y-6">
      <PageHeader title="Contas a Receber" description="Recebimentos previstos, confirmados e inadimplentes." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Previstos" value={`R$ ${previstos.reduce((s, r) => s + r.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="sky" icon={<Clock className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Recebidos" value={recebidos.length} accent="emerald" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Inadimplentes" value={`R$ ${inadimplentes.reduce((s, r) => s + r.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} accent="rose" icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} />
        <KpiCard title="Total Previsto" value={`R$ ${previstos.reduce((s, r) => s + r.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} accent="violet" icon={<TrendingUp className="w-4 h-4 text-violet-400" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50" placeholder="Buscar fonte ou código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5">
          {(['todos', 'previsto', 'recebido', 'inadimplente', 'cancelado'] as const).map(s => (
            <button key={s} onClick={() => setFiltro(s)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtro === s ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
              {s === 'todos' ? 'Todos' : STATUS_RECEBIMENTO_LABELS[s as StatusRecebimentoM11]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Fonte Pagadora</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Valor</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Data Prevista</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Data Recebimento</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3"><span className="text-xs font-mono text-white/60">{r.codigo}</span></td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white/75">{r.fonte_pagadora}</p>
                  {r.observacoes && <p className="text-[10px] text-white/30">{r.observacoes}</p>}
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(r.valor, r.moeda)}</span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-white/40 tabular-nums">{r.data_prevista ? fmtDate(r.data_prevista) : '—'}</span></td>
                <td className="px-4 py-3 hidden xl:table-cell"><span className="text-xs text-white/40 tabular-nums">{r.data_recebimento ? fmtDate(r.data_recebimento) : '—'}</span></td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_RECEBIMENTO_COLORS[r.status]}`}>
                    {STATUS_RECEBIMENTO_LABELS[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} recebimento(s)</p>
        </div>
      </div>
    </div>
  )
}

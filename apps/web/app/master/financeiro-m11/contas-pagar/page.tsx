'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import { Plus, Search, Filter, TrendingDown, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import {
  MOCK_PAGAMENTOS, fmtBRL, fmtDate,
} from '@/lib/mock-financeiro-m11'
import {
  STATUS_PAGAMENTO_LABELS, STATUS_PAGAMENTO_COLORS, METODO_PAGAMENTO_LABELS,
  type StatusPagamentoM11,
} from '@/lib/types-financeiro-m11'

export default function ContasPagarPage() {
  const [filtroStatus, setFiltroStatus] = useState<StatusPagamentoM11 | 'todos'>('todos')
  const [search, setSearch] = useState('')
  const [selecionados, setSelecionados] = useState<string[]>([])

  const filtered = MOCK_PAGAMENTOS.filter(p => {
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    const matchSearch = !search || p.titular_nome.toLowerCase().includes(search.toLowerCase()) || p.codigo.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const programados = MOCK_PAGAMENTOS.filter(p => p.status === 'programado').length
  const emProcesso = MOCK_PAGAMENTOS.filter(p => p.status === 'em_processamento').length
  const pagosMes = MOCK_PAGAMENTOS.filter(p => p.status === 'pago').length
  const falhas = MOCK_PAGAMENTOS.filter(p => p.status === 'falhou').length

  function toggleSel(id: string) {
    setSelecionados(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contas a Pagar"
        description="Pagamentos programados, em processamento e pagos."
        actions={
          <Link href="/master/financeiro-m11/contas-pagar/novo" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />
            Novo Pagamento
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Programados" value={programados} accent="sky" icon={<Clock className="w-4 h-4 text-sky-400" />} />
        <KpiCard title="Em Processamento" value={emProcesso} accent="amber" icon={<TrendingDown className="w-4 h-4 text-amber-400" />} />
        <KpiCard title="Pagos no Mês" value={pagosMes} accent="emerald" icon={<CheckCircle className="w-4 h-4 text-emerald-400" />} />
        <KpiCard title="Falhas" value={falhas} accent="rose" icon={<AlertCircle className="w-4 h-4 text-rose-400" />} />
      </div>

      {selecionados.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl">
          <span className="text-xs text-violet-400 font-semibold">{selecionados.length} selecionado(s)</span>
          <button className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            Pagar selecionados via PIX
          </button>
          <button onClick={() => setSelecionados([])} className="text-xs text-white/30 hover:text-white/60">Cancelar</button>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50" placeholder="Buscar titular ou código..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['todos', 'programado', 'em_processamento', 'pago', 'falhou', 'cancelado'] as const).map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)} className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtroStatus === s ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}>
              {s === 'todos' ? 'Todos' : STATUS_PAGAMENTO_LABELS[s as StatusPagamentoM11]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="w-10 px-4 py-3" />
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Código</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Titular</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Método</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Data Prog.</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  {(p.status === 'programado' || p.status === 'em_processamento') && (
                    <input type="checkbox" checked={selecionados.includes(p.id)} onChange={() => toggleSel(p.id)} className="accent-violet-600 w-4 h-4" />
                  )}
                </td>
                <td className="px-5 py-3"><span className="text-xs font-mono text-white/60">{p.codigo}</span></td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white/75">{p.titular_nome}</p>
                  <span className={['text-[9px] font-semibold px-1 rounded', p.titular_tipo === 'PF' ? 'text-amber-400' : 'text-sky-400'].join(' ')}>{p.titular_tipo}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-rose-400 tabular-nums">{fmtBRL(p.valor, p.moeda)}</span>
                  {p.moeda !== 'BRL' && <p className="text-[10px] text-white/30">{p.moeda}</p>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs text-white/50">{METODO_PAGAMENTO_LABELS[p.metodo]}</span></td>
                <td className="px-4 py-3 hidden lg:table-cell"><span className="text-xs text-white/40 tabular-nums">{p.data_programada ? fmtDate(p.data_programada) : '—'}</span></td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_PAGAMENTO_COLORS[p.status]}`}>
                    {STATUS_PAGAMENTO_LABELS[p.status]}
                  </span>
                  {p.motivo_falha && <p className="text-[9px] text-rose-400/60 mt-0.5">{p.motivo_falha.slice(0, 40)}…</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} pagamento(s)</p>
        </div>
      </div>
    </div>
  )
}

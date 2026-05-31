'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Search, Filter, Users, Wallet, DollarSign, AlertTriangle,
  ChevronRight, BarChart3, TrendingUp,
} from 'lucide-react'
import { MOCK_CC_TITULARES, KPI_CC_TITULARES, fmtBRL, fmtDate } from '@/lib/mock-cc'

// Extrai campos chave da descrição pipe-delimited
function getMeta(desc?: string): { editora?: string; periodo?: string; fonte?: string } {
  if (!desc) return {}
  const parts = desc.split(' | ')
  const get = (label: string) => {
    const p = parts.find(x => x.startsWith(label + ':'))
    return p ? p.slice(label.length + 1).trim() : undefined
  }
  return { editora: get('Editora'), periodo: get('Período'), fonte: get('Fonte') }
}

type FilterTipo = 'todos' | 'PF' | 'PJ' | 'com_bloqueio' | 'com_recoupment'

const FILTER_LABELS: Record<FilterTipo, string> = {
  todos: 'Todos', PF: 'PF', PJ: 'PJ', com_bloqueio: 'Com Bloqueio', com_recoupment: 'Recoupment',
}

export default function CCTitularPage() {
  const [search, setSearch] = useState('')
  const [filtro, setFiltro] = useState<FilterTipo>('todos')

  const filtered = MOCK_CC_TITULARES.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.titular_nome.toLowerCase().includes(q) || t.titular_codigo.toLowerCase().includes(q)
    const matchFiltro =
      filtro === 'todos' ? true :
      filtro === 'PF' ? t.titular_tipo === 'PF' :
      filtro === 'PJ' ? t.titular_tipo === 'PJ' :
      filtro === 'com_bloqueio' ? t.bloqueios.length > 0 :
      filtro === 'com_recoupment' ? !!t.recoupment_ativo :
      true
    return matchSearch && matchFiltro
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conta Corrente de Titulares"
        description="Carteira financeira de cada titular. Créditos originados das obras. IRPF incide para PF, não para PJ."
        actions={
          <Link href="/master/cc-titular/dashboard" className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
            <BarChart3 className="w-3.5 h-3.5" />
            Analytics
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Saldo Total Titulares" value={fmtBRL(KPI_CC_TITULARES.saldo_total_titulares)} accent="emerald" icon={<Wallet className="w-4 h-4 text-emerald-400" />} subtitle="saldo acumulado" />
        <KpiCard title="Saldo Disponível" value={fmtBRL(KPI_CC_TITULARES.saldo_disponivel)} accent="sky" icon={<TrendingUp className="w-4 h-4 text-sky-400" />} subtitle="liberado para pagamento" />
        <KpiCard title="Saldo Bloqueado" value={fmtBRL(KPI_CC_TITULARES.saldo_bloqueado)} accent="amber" icon={<AlertTriangle className="w-4 h-4 text-amber-400" />} subtitle="pendente resolução" />
        <KpiCard title="Pago em Mai/2026" value={fmtBRL(KPI_CC_TITULARES.total_pago_mes)} accent="violet" icon={<DollarSign className="w-4 h-4 text-violet-400" />} subtitle="pagamentos do mês" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="Buscar titular..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />
          {(Object.keys(FILTER_LABELS) as FilterTipo[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={['h-8 px-3 rounded-lg text-xs font-medium transition-colors', filtro === f ? 'bg-violet-600 text-white' : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80'].join(' ')}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Titular</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Saldo Atual</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-sky-500/60 uppercase tracking-wider hidden lg:table-cell">Disponível</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-amber-500/60 uppercase tracking-wider hidden md:table-cell">Bloqueado</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Última Mov.</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(t => {
            const meta = getMeta(t.movimentos[0]?.descricao)
            return (
              <tr key={t.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-violet-400">
                        {t.titular_nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{t.titular_nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className={['text-[9px] font-semibold px-1.5 py-0.5 rounded border',
                          t.titular_tipo === 'PF'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                        ].join(' ')}>
                          {t.titular_tipo} · {t.titular_tipo === 'PF' ? 'IRPF INCIDE' : 'IRPF NÃO INCIDE'}
                        </span>
                        {t.bloqueios.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {t.bloqueios.length} bloq.
                          </span>
                        )}
                        {t.recoupment_ativo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Recoupment
                          </span>
                        )}
                        {meta.editora && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            Ed: {meta.editora}
                          </span>
                        )}
                        {meta.periodo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/45 border border-white/[0.08]">
                            {meta.periodo}
                          </span>
                        )}
                        {meta.fonte && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                            {meta.fonte}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={['text-sm font-bold tabular-nums', t.saldo_atual > 0 ? 'text-emerald-400' : 'text-white/30'].join(' ')}>
                    {fmtBRL(t.saldo_atual)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <span className="text-sm text-white/55 tabular-nums">{fmtBRL(t.saldo_liberado)}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  {t.saldo_bloqueado > 0
                    ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">{fmtBRL(t.saldo_bloqueado)}</span>
                    : <span className="text-xs text-white/25">—</span>
                  }
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-white/40">{t.data_ultima_movimentacao ? fmtDate(t.data_ultima_movimentacao) : '—'}</span>
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`/master/cc-titular/${t.titular_id}`}
                    className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors"
                  >
                    Ver detalhe <ChevronRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">{filtered.length} titular(es)</p>
        </div>
      </div>
    </div>
  )
}

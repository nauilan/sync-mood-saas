'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Search, Filter, TrendingUp, TrendingDown, ChevronRight, X,
  ArrowUpCircle, ArrowDownCircle, Music, DollarSign, Layers, AlertCircle,
} from 'lucide-react'
import {
  MOCK_OBRAS_CC, formatCurrency, formatDate, ORIGEM_LABEL, isInformativo,
  type ObraCC, type LancamentoCCObra,
} from '@/lib/mock-financeiro'

type FilterStatus = 'todos' | 'com_saldo' | 'sem_movimento' | 'pendente_distribuicao'

const FILTER_LABELS: Record<FilterStatus, string> = {
  todos: 'Todas',
  com_saldo: 'Com saldo',
  sem_movimento: 'Sem movimento',
  pendente_distribuicao: 'Pendente distrib.',
}

function OrigemBadge({ origem }: { origem: string }) {
  const label = ORIGEM_LABEL[origem] ?? origem
  if (origem === 'dsp_backoffice') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/20">{label}</span>
  }
  if (origem === 'sync') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">{label}</span>
  }
  if (origem === 'distribuicao_titulares') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">{label}</span>
  }
  if (origem === 'estorno') {
    return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">{label}</span>
  }
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/8 text-white/50 border border-white/10">{label}</span>
}

function ExtratoLancamento({ l }: { l: LancamentoCCObra }) {
  const isCredito = l.tipo === 'credito'
  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
      <td className="px-4 py-3 text-xs text-white/50 tabular-nums whitespace-nowrap">{formatDate(l.data)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={[
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
            isCredito ? 'bg-emerald-500/10' : 'bg-rose-500/10',
          ].join(' ')}>
            {isCredito
              ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
              : <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div>
            <p className="text-xs text-white/75">{l.descricao}</p>
            {l.documento_ref && <p className="text-[10px] text-white/30 font-mono">{l.documento_ref}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <OrigemBadge origem={l.origem} />
      </td>
      <td className="px-4 py-3 text-right">
        <span className={['text-sm font-semibold tabular-nums', isCredito ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
          {isCredito ? '+' : '-'}{formatCurrency(l.valor_liquido)}
        </span>
        {l.ir_retido > 0 && (
          <p className="text-[10px] text-white/30 tabular-nums">IR: {formatCurrency(l.ir_retido)}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm tabular-nums text-white/60">{formatCurrency(l.saldo_pos)}</span>
      </td>
    </tr>
  )
}

function ObraDetalheModal({ obra, onClose }: { obra: ObraCC; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{obra.titulo}</h2>
              <p className="text-[11px] text-white/40">{obra.codigo} {obra.iswc ? `· ${obra.iswc}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Saldo cards */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400/70 mb-1">Saldo Atual</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(obra.saldo_atual)}</p>
          </div>
          <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-3">
            <p className="text-[10px] text-sky-400/70 mb-1">Total Recebido</p>
            <p className="text-lg font-bold text-sky-400 tabular-nums">{formatCurrency(obra.total_recebido)}</p>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-3">
            <p className="text-[10px] text-violet-400/70 mb-1">Total Distribuído</p>
            <p className="text-lg font-bold text-violet-400 tabular-nums">{formatCurrency(obra.total_distribuido)}</p>
          </div>
        </div>

        {/* Extrato */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0d1526]">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Origem</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {obra.extrato.map(l => <ExtratoLancamento key={l.id} l={l} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ContaCorrenteObrasPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos')
  const [selectedObra, setSelectedObra] = useState<ObraCC | null>(null)

  const filtered = MOCK_OBRAS_CC.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q || o.titulo.toLowerCase().includes(q) || o.codigo.toLowerCase().includes(q)
    const matchStatus =
      filterStatus === 'todos' ? true
        : filterStatus === 'com_saldo' ? o.saldo_atual > 0
        : filterStatus === 'sem_movimento' ? o.saldo_atual === 0 && o.total_recebido === 0
        : filterStatus === 'pendente_distribuicao' ? o.pendente_distribuicao > 0
        : true
    return matchSearch && matchStatus
  })

  const totalSaldo = MOCK_OBRAS_CC.reduce((s, o) => s + o.saldo_atual, 0)
  const totalEntradaMes = MOCK_OBRAS_CC.flatMap(o => o.extrato)
    .filter(l => l.tipo === 'credito' && l.data.startsWith('2026-05'))
    .reduce((s, l) => s + l.valor_liquido, 0)
  const totalSaidaMes = MOCK_OBRAS_CC.flatMap(o => o.extrato)
    .filter(l => l.tipo === 'debito' && l.data.startsWith('2026-05'))
    .reduce((s, l) => s + l.valor_liquido, 0)
  const totalPendente = MOCK_OBRAS_CC.reduce((s, o) => s + o.pendente_distribuicao, 0)

  return (
    <div className="space-y-6">
      {selectedObra && <ObraDetalheModal obra={selectedObra} onClose={() => setSelectedObra(null)} />}

      <PageHeader
        title="Conta Corrente de Obras"
        description="Extrato de entradas (DSP/Sync) e saidas (distribuicao) por obra. Apenas recebimentos operacionais."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Saldo Total Obras"
          value={formatCurrency(totalSaldo)}
          subtitle="saldo acumulado pendente"
          accent="emerald"
          icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Entradas Maio/2026"
          value={formatCurrency(totalEntradaMes)}
          subtitle="DSP + Sync este mes"
          accent="sky"
          icon={<TrendingUp className="w-4 h-4 text-sky-400" />}
        />
        <KpiCard
          title="Saidas Maio/2026"
          value={formatCurrency(totalSaidaMes)}
          subtitle="distribuicao aos titulares"
          accent="violet"
          icon={<TrendingDown className="w-4 h-4 text-violet-400" />}
        />
        <KpiCard
          title="Pendente Distrib."
          value={formatCurrency(totalPendente)}
          subtitle={`${MOCK_OBRAS_CC.filter(o => o.pendente_distribuicao > 0).length} obras aguardando`}
          accent="amber"
          icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="Buscar obra por titulo ou codigo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          {(Object.keys(FILTER_LABELS) as FilterStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={[
                'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                filterStatus === s
                  ? 'bg-violet-600 text-white'
                  : 'bg-white/[0.04] border border-white/[0.06] text-white/50 hover:text-white/80',
              ].join(' ')}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obra</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Saldo Atual</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider hidden lg:table-cell">Total Recebido</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-violet-500/60 uppercase tracking-wider hidden lg:table-cell">Total Distribuido</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-amber-500/60 uppercase tracking-wider hidden md:table-cell">Pendente</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Ultimo Mov.</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(obra => (
              <tr
                key={obra.id}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => setSelectedObra(obra)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Music className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{obra.titulo}</p>
                      <p className="text-[10px] text-white/35 font-mono">{obra.codigo}{obra.iswc ? ` · ${obra.iswc}` : ''}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={[
                    'text-sm font-bold tabular-nums',
                    obra.saldo_atual > 0 ? 'text-emerald-400' : 'text-white/30',
                  ].join(' ')}>
                    {formatCurrency(obra.saldo_atual)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <span className="text-sm text-white/55 tabular-nums">{formatCurrency(obra.total_recebido)}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <span className="text-sm text-white/55 tabular-nums">{formatCurrency(obra.total_distribuido)}</span>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  {obra.pendente_distribuicao > 0 ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">
                      {formatCurrency(obra.pendente_distribuicao)}
                    </span>
                  ) : (
                    <span className="text-xs text-white/25">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-white/40">{formatDate(obra.ultimo_movimento)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-1 text-xs text-white/25 group-hover:text-violet-400 transition-colors">
                    Extrato <ChevronRight className="w-3 h-3" />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-white/30 text-sm">
                  Nenhuma obra encontrada com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">
            {filtered.length} obra{filtered.length !== 1 ? 's' : ''} · Apenas recebimentos operacionais (DSP/Sync). Recebimentos de sociedades sao informativos.
          </p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
        <Layers className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-sky-400 mb-0.5">Recebimentos INFORMATIVOS nao aparecem aqui</p>
          <p className="text-xs text-white/45">
            Valores de Socinpro, ECAD, ABRAMUS, AMAR e Sombras sao distribuidos diretamente pela sociedade ao titular (PF). O sistema os registra apenas como informativo para fins de auditoria e BI — nao geram lancamento na CC da obra.
          </p>
        </div>
      </div>
    </div>
  )
}

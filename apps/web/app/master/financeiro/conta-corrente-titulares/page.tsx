'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { KpiCard } from '@/components/ui/kpi-card'
import {
  Search, Filter, X, Users, Wallet, TrendingUp, ArrowUpCircle, ArrowDownCircle,
  ChevronRight, AlertCircle, Info, BadgeCheck,
} from 'lucide-react'
import {
  MOCK_TITULARES_CC, formatCurrency, formatDate, isInformativo,
  type TitularCC, type LancamentoCCTitular, type AdiantamentoTitular,
} from '@/lib/mock-financeiro'

type FilterTipo = 'todos' | 'com_saldo' | 'com_adiantamento'

const FILTER_LABELS: Record<FilterTipo, string> = {
  todos: 'Todos',
  com_saldo: 'Com saldo',
  com_adiantamento: 'Com adiantamento',
}

function CategoriaBadge({ categoria, origem }: { categoria: 'operacional' | 'informativo'; origem: string }) {
  if (categoria === 'informativo') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/8 text-white/45 border border-white/10">
        <Info className="w-2.5 h-2.5" />
        Informativo
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
      <BadgeCheck className="w-2.5 h-2.5" />
      Operacional
    </span>
  )
}

function IrrfBadge({ tipo_pessoa }: { tipo_pessoa: 'PF' | 'PJ' }) {
  if (tipo_pessoa === 'PF') {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
        PF · IRRF 15%
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
      PJ · IR 1,5%
    </span>
  )
}

function RecoupmentBar({ adiantamento }: { adiantamento: AdiantamentoTitular }) {
  const pct = adiantamento.valor_adiantado > 0
    ? (adiantamento.valor_recuperado / adiantamento.valor_adiantado) * 100
    : 0
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">
          Adiantamento FIFO {adiantamento.tipo === 'recoupable' ? '· Recoupable' : '· Non-recoupable'}
        </p>
        <span className={[
          'text-[10px] font-bold px-1.5 py-0.5 rounded',
          adiantamento.status === 'em_recoupment' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
          adiantamento.status === 'recuperado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
          'bg-white/8 text-white/40 border border-white/10',
        ].join(' ')}>
          {adiantamento.status === 'em_recoupment' ? 'Em recoupment' : adiantamento.status === 'recuperado' ? 'Recuperado' : 'Cancelado'}
        </span>
      </div>
      {adiantamento.obra_titulo && (
        <p className="text-[10px] text-white/35 mb-1.5">{adiantamento.obra_titulo}</p>
      )}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-white/40">{formatCurrency(adiantamento.valor_recuperado)} recuperado</span>
        <span className="text-[10px] font-semibold text-amber-400">{formatCurrency(adiantamento.saldo_a_recuperar)} pendente</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
          }}
        />
      </div>
      <p className="text-[10px] text-white/30 mt-1">{pct.toFixed(1)}% recuperado de {formatCurrency(adiantamento.valor_adiantado)}</p>
    </div>
  )
}

function LancamentoRow({ l }: { l: LancamentoCCTitular }) {
  const isCredito = l.tipo === 'credito'
  const isInfo = l.categoria === 'informativo'
  return (
    <tr className={[
      'border-b border-white/[0.04] transition-colors',
      isInfo
        ? 'bg-white/[0.005] hover:bg-white/[0.015]'
        : 'hover:bg-violet-500/[0.03]',
    ].join(' ')}>
      <td className="px-4 py-3 text-xs text-white/50 tabular-nums whitespace-nowrap">{formatDate(l.data)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={[
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
            isInfo ? 'bg-white/5' : isCredito ? 'bg-emerald-500/10' : 'bg-rose-500/10',
          ].join(' ')}>
            {isInfo
              ? <Info className="w-3 h-3 text-white/30" />
              : isCredito
                ? <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />
                : <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />}
          </div>
          <div>
            <p className={['text-xs', isInfo ? 'text-white/45' : 'text-white/75'].join(' ')}>{l.descricao}</p>
            {l.obra_titulo && <p className="text-[10px] text-white/30">{l.obra_titulo}</p>}
            {l.documento_ref && <p className="text-[10px] text-white/25 font-mono">{l.documento_ref}</p>}
            {l.recoupment_descontado && l.recoupment_descontado > 0 && (
              <p className="text-[10px] text-amber-400/70">Recoupment FIFO: -{formatCurrency(l.recoupment_descontado)}</p>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <CategoriaBadge categoria={l.categoria} origem={l.origem} />
      </td>
      <td className="px-4 py-3 text-right">
        {isInfo ? (
          <div className="text-right">
            <span className="text-xs text-white/35 tabular-nums">{formatCurrency(l.valor_liquido)}</span>
            {l.ir_retido > 0 && <p className="text-[10px] text-white/25">IR: {formatCurrency(l.ir_retido)}</p>}
            {l.sociedade && <p className="text-[10px] text-white/30">{l.sociedade}</p>}
          </div>
        ) : (
          <div className="text-right">
            <span className={['text-sm font-semibold tabular-nums', isCredito ? 'text-emerald-400' : 'text-rose-400'].join(' ')}>
              {isCredito ? '+' : '-'}{formatCurrency(l.valor_liquido)}
            </span>
            {l.ir_retido > 0 && <p className="text-[10px] text-white/30">IR: {formatCurrency(l.ir_retido)}</p>}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!isInfo && (
          <span className="text-sm tabular-nums text-white/60">{formatCurrency(l.saldo_pos)}</span>
        )}
        {isInfo && <span className="text-xs text-white/20">—</span>}
      </td>
    </tr>
  )
}

function TitularDetalheModal({ titular, onClose }: { titular: TitularCC; onClose: () => void }) {
  const [showInfo, setShowInfo] = useState(true)
  const extratoFiltrado = showInfo ? titular.extrato : titular.extrato.filter(l => l.categoria === 'operacional')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl bg-[#0d1526] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{titular.nome}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <IrrfBadge tipo_pessoa={titular.tipo_pessoa} />
                <span className="text-[10px] text-white/30 capitalize">{titular.tipo_titular}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>

        {/* Saldo summary */}
        <div className="grid grid-cols-3 gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3">
            <p className="text-[10px] text-emerald-400/70 mb-1">Saldo Operacional</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatCurrency(titular.saldo_operacional)}</p>
            <p className="text-[9px] text-white/30 mt-0.5">A pagar (DSP/Sync)</p>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
            <p className="text-[10px] text-white/40 mb-1">Total Informativo Ano</p>
            <p className="text-lg font-bold text-white/50 tabular-nums">{formatCurrency(titular.total_informativo_ano)}</p>
            <p className="text-[9px] text-white/25 mt-0.5">Sociedades (não transita)</p>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3">
            <p className="text-[10px] text-amber-400/70 mb-1">Adiantamentos</p>
            <p className="text-lg font-bold text-amber-400 tabular-nums">{formatCurrency(titular.adiantamentos_pendentes)}</p>
            <p className="text-[9px] text-white/30 mt-0.5">Em recoupment FIFO</p>
          </div>
        </div>

        {/* Adiantamentos FIFO */}
        {titular.adiantamentos.length > 0 && (
          <div className="px-6 py-3 border-b border-white/[0.05] shrink-0 space-y-2">
            {titular.adiantamentos.map(a => <RecoupmentBar key={a.id} adiantamento={a} />)}
          </div>
        )}

        {/* Extrato filter toggle */}
        <div className="flex items-center gap-2 px-6 py-2.5 border-b border-white/[0.05] shrink-0">
          <span className="text-[11px] text-white/40">Mostrar:</span>
          <button
            onClick={() => setShowInfo(true)}
            className={['h-6 px-2.5 rounded text-[11px] font-medium transition-colors',
              showInfo ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'].join(' ')}
          >
            Tudo (incluindo informativo)
          </button>
          <button
            onClick={() => setShowInfo(false)}
            className={['h-6 px-2.5 rounded text-[11px] font-medium transition-colors',
              !showInfo ? 'bg-violet-600 text-white' : 'bg-white/5 text-white/40 hover:text-white/60'].join(' ')}
          >
            Apenas operacional
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-[#0d1526]">
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Descrição</th>
                <th className="text-center px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Tipo</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor</th>
                <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {extratoFiltrado.map(l => <LancamentoRow key={l.id} l={l} />)}
            </tbody>
          </table>
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 border-t border-white/[0.05] shrink-0">
          <p className="text-[10px] text-white/25">
            Saldo operacional é cumulativo. Registros informativos (sociedades) aparecem esmaecidos e não alteram o saldo — a sociedade distribui diretamente ao titular.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ContaCorrenteTitularesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTipo>('todos')
  const [selected, setSelected] = useState<TitularCC | null>(null)

  const filtered = MOCK_TITULARES_CC.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || t.nome.toLowerCase().includes(q)
    const matchFilter =
      filter === 'todos' ? true
        : filter === 'com_saldo' ? t.saldo_operacional > 0
        : filter === 'com_adiantamento' ? t.adiantamentos_pendentes > 0
        : true
    return matchSearch && matchFilter
  })

  const totalAPagar = MOCK_TITULARES_CC.reduce((s, t) => s + t.saldo_operacional, 0)
  const totalRecebidoAno = MOCK_TITULARES_CC.reduce((s, t) => s + t.total_recebido_operacional_ano, 0)
  const totalAdiantamentos = MOCK_TITULARES_CC.reduce((s, t) => s + t.adiantamentos_pendentes, 0)
  const titularesAtivos = MOCK_TITULARES_CC.filter(t => t.saldo_operacional > 0 || t.total_recebido_operacional_ano > 0).length

  return (
    <div className="space-y-6">
      {selected && <TitularDetalheModal titular={selected} onClose={() => setSelected(null)} />}

      <PageHeader
        title="Conta Corrente de Titulares"
        description="Saldo operacional (DSP/Sync) por titular. Registros informativos de sociedades sao exibidos como referencia sem alterar o saldo."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="A Pagar Agora"
          value={formatCurrency(totalAPagar)}
          subtitle="saldo operacional total"
          accent="emerald"
          icon={<Wallet className="w-4 h-4 text-emerald-400" />}
        />
        <KpiCard
          title="Recebido no Ano"
          value={formatCurrency(totalRecebidoAno)}
          subtitle="operacional acumulado 2026"
          accent="sky"
          icon={<TrendingUp className="w-4 h-4 text-sky-400" />}
        />
        <KpiCard
          title="Adiantamentos Pendentes"
          value={formatCurrency(totalAdiantamentos)}
          subtitle={`${MOCK_TITULARES_CC.filter(t => t.adiantamentos_pendentes > 0).length} titular(es) em recoupment`}
          accent="amber"
          icon={<AlertCircle className="w-4 h-4 text-amber-400" />}
        />
        <KpiCard
          title="Titulares Ativos"
          value={titularesAtivos}
          subtitle="com movimentação em 2026"
          accent="violet"
          icon={<Users className="w-4 h-4 text-violet-400" />}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-violet-500/50 transition-colors"
            placeholder="Buscar titular por nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-white/30" />
          {(Object.keys(FILTER_LABELS) as FilterTipo[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={[
                'h-8 px-3 rounded-lg text-xs font-medium transition-colors',
                filter === s
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
              <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Titular</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Saldo Operacional</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden lg:table-cell">Total Informativo</th>
              <th className="text-right px-4 py-3 text-[10px] font-semibold text-amber-500/60 uppercase tracking-wider hidden md:table-cell">Adiantamento</th>
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden xl:table-cell">Ultimo Mov.</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {filtered.map(titular => (
              <tr
                key={titular.id}
                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                onClick={() => setSelected(titular)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/10 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-violet-400">
                        {titular.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/85">{titular.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <IrrfBadge tipo_pessoa={titular.tipo_pessoa} />
                        <span className="text-[10px] text-white/30 capitalize">{titular.tipo_titular}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={[
                    'text-sm font-bold tabular-nums',
                    titular.saldo_operacional > 0 ? 'text-emerald-400' : 'text-white/30',
                  ].join(' ')}>
                    {formatCurrency(titular.saldo_operacional)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                  <div>
                    <span className="text-sm text-white/35 tabular-nums">{formatCurrency(titular.total_informativo_ano)}</span>
                    {titular.total_informativo_ano > 0 && (
                      <p className="text-[10px] text-white/20">informativo</p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right hidden md:table-cell">
                  {titular.adiantamentos_pendentes > 0 ? (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 tabular-nums">
                      {formatCurrency(titular.adiantamentos_pendentes)}
                    </span>
                  ) : (
                    <span className="text-xs text-white/25">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 hidden xl:table-cell">
                  <span className="text-xs text-white/40">{formatDate(titular.ultimo_movimento)}</span>
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
                <td colSpan={6} className="px-4 py-12 text-center text-white/30 text-sm">
                  Nenhum titular encontrado com os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="px-5 py-3 border-t border-white/[0.05]">
          <p className="text-xs text-white/30">
            {filtered.length} titular(es) · Saldo operacional = DSP/Sync. Informativo = sociedades (distribui diretamente ao titular, nao transita pela editora).
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/5 border border-violet-500/10">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20">
            <BadgeCheck className="w-2.5 h-2.5" />
            Operacional
          </span>
          <span className="text-xs text-white/40">DSP/Sync — movimenta saldo, sujeito a recoupment</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/8 text-white/45 border border-white/10">
            <Info className="w-2.5 h-2.5" />
            Informativo
          </span>
          <span className="text-xs text-white/40">Sociedades (ECAD/ABRAMUS/Socinpro) — registro apenas, nao altera saldo</span>
        </div>
      </div>
    </div>
  )
}

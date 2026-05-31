'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Eye, Music, Users, DollarSign, ChevronRight,
  AlertCircle, Lock, TrendingUp, Calendar, FileText,
} from 'lucide-react'
import {
  MOCK_PREVIA_OBRA, MOCK_PREVIA_TITULAR, KPI_PREVIA,
} from '@/lib/mock-distribuicao-previa'
import { PERIODO_CORRENTE } from '@/lib/mock-periodos-distribuicao'

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'cc-obra' | 'cc-titular'

// ─── CC Obra Virtual ─────────────────────────────────────────────────────────

function CCObraPrevia() {
  const [search, setSearch] = useState('')
  const filtered = MOCK_PREVIA_OBRA.filter(o =>
    !search || o.obra_titulo.toLowerCase().includes(search.toLowerCase()) || o.obra_codigo.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="relative">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por título ou código…"
          className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50"
        />
        <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25" />
      </div>

      {/* Tabela CC Obra Virtual */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.03] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-sky-500/15">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-sky-300 uppercase tracking-wider">CC Obra — Prévia {KPI_PREVIA.periodo}</p>
          <span className="ml-auto text-[10px] text-sky-400/50">{filtered.length} obras</span>
        </div>

        {/* Cabeçalho */}
        <div className="grid grid-cols-[70px_1fr_90px_90px_90px] gap-2 px-4 py-2 border-b border-sky-500/10 bg-sky-500/[0.02]">
          {['Código', 'Título', 'Fontes', 'Período', 'Valor Previsto'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-sky-400/40 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-sky-500/[0.08]">
          {filtered.map((obra, i) => (
            <div key={i} className="grid grid-cols-[70px_1fr_90px_90px_90px] gap-2 px-4 py-3 items-center hover:bg-sky-500/[0.04] transition-colors">
              <p className="text-[10px] font-mono text-white/50">{obra.obra_codigo}</p>
              <p className="text-xs font-medium text-white/80 truncate">{obra.obra_titulo}</p>
              <div className="flex flex-wrap gap-1">
                {obra.sources.map(s => (
                  <span key={s} className="text-[9px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full px-1.5 py-0.5">{s}</span>
                ))}
              </div>
              <p className="text-[10px] text-white/40">{obra.periodo}</p>
              <p className="text-sm font-bold text-sky-300 tabular-nums">{fmtBRL(obra.valor_previsto)}</p>
            </div>
          ))}
        </div>

        {/* Rodapé total */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-sky-500/15 bg-sky-500/[0.04]">
          <span className="text-[10px] text-sky-400/60">Total previsto — {filtered.length} obra(s)</span>
          <span className="text-base font-bold text-sky-300">
            {fmtBRL(filtered.reduce((s, o) => s + o.valor_previsto, 0))}
          </span>
        </div>
      </div>

      <p className="text-[10px] text-white/25 text-center">
        * Valores previstos, não efetivados. Serão gravados no CC Obra real ao encerrar a distribuição.
      </p>
    </div>
  )
}

// ─── CC Titular Virtual ───────────────────────────────────────────────────────

function CCTitularPrevia() {
  const tipos: Record<string, string> = {
    autor: 'AUTOR', editora: 'EDITORA', administradora: 'ADM',
  }
  const tipoCores: Record<string, string> = {
    autor: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    editora: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
    administradora: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  }

  const sorted = [...MOCK_PREVIA_TITULAR].sort((a, b) => b.valor_previsto - a.valor_previsto)
  const total = sorted.reduce((s, t) => s + t.valor_previsto, 0)

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.03] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-sky-500/15">
          <Eye className="w-3.5 h-3.5 text-sky-400" />
          <p className="text-[10px] font-semibold text-sky-300 uppercase tracking-wider">CC Titular — Prévia {KPI_PREVIA.periodo}</p>
          <span className="ml-auto text-[10px] text-sky-400/50">{sorted.length} titulares</span>
        </div>

        {/* Cabeçalho */}
        <div className="grid grid-cols-[1fr_70px_90px_90px_110px] gap-2 px-4 py-2 border-b border-sky-500/10 bg-sky-500/[0.02]">
          {['Titular', 'Tipo', 'Obras', '% Total', 'Valor Previsto'].map(h => (
            <p key={h} className="text-[10px] font-semibold text-sky-400/40 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        <div className="max-h-[420px] overflow-y-auto divide-y divide-sky-500/[0.08]">
          {sorted.map((t, i) => {
            const pct = total > 0 ? (t.valor_previsto / total * 100).toFixed(1) : '0'
            return (
              <div key={i} className="grid grid-cols-[1fr_70px_90px_90px_110px] gap-2 px-4 py-3 items-center hover:bg-sky-500/[0.04] transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-white/80 truncate">{t.titular_nome}</p>
                </div>
                <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-bold w-fit ${tipoCores[t.tipo]}`}>
                  {tipos[t.tipo]}
                </span>
                <p className="text-xs text-white/50">{t.obras_count} obras</p>
                <div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-0.5">
                    <div className="h-full bg-sky-400/60 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-[10px] text-white/30">{pct}%</p>
                </div>
                <p className="text-sm font-bold text-sky-300 tabular-nums">{fmtBRL(t.valor_previsto)}</p>
              </div>
            )
          })}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-sky-500/15 bg-sky-500/[0.04]">
          <span className="text-[10px] text-sky-400/60">Total previsto — {sorted.length} titular(es)</span>
          <span className="text-base font-bold text-sky-300">{fmtBRL(total)}</span>
        </div>
      </div>

      <p className="text-[10px] text-white/25 text-center">
        * Valores previstos. Recibos e demonstrativos são gerados apenas após o encerramento da distribuição.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DistribuicaoPreviaPage() {
  const [tab, setTab] = useState<Tab>('cc-obra')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distribuição Prévia"
        description="Visualize antecipadamente como os valores serão distribuídos. Útil para planejar antecipações e adiantamentos a titulares."
        actions={[
          <Link
            key="enc"
            href="/master/distribuicao/encerramento"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
          >
            <Lock className="w-4 h-4" /> Encerrar Distribuição
          </Link>
        ]}
      />

      {/* Banner do período corrente */}
      <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold font-mono text-white">{PERIODO_CORRENTE?.codigo ?? '—'}</span>
              <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">PRÉVIA ATIVA</span>
            </div>
            <p className="text-sm text-white/60">{PERIODO_CORRENTE?.label ?? 'Nenhum período aberto'}</p>
            <p className="text-[10px] text-white/30">{PERIODO_CORRENTE?.data_inicio ?? ''} → {PERIODO_CORRENTE?.data_fim ?? ''}</p>
            {PERIODO_CORRENTE?.observacao && (
              <p className="text-[10px] text-sky-300/60">{PERIODO_CORRENTE.observacao}</p>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Previsto',  value: fmtBRL(KPI_PREVIA.total_previsto),  color: 'text-sky-300' },
              { label: 'Obras',           value: KPI_PREVIA.obras_identificadas,      color: 'text-white' },
              { label: 'Titulares',       value: KPI_PREVIA.titulares,                color: 'text-white' },
              { label: 'Prev. Pagamento', value: KPI_PREVIA.data_prevista_pagamento,  color: 'text-emerald-300' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-white/10 bg-white/5 p-3 min-w-[110px]">
                <p className="text-[10px] text-white/30 mb-0.5">{k.label}</p>
                <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fontes atribuídas */}
        <div className="flex flex-wrap gap-2 mt-4">
          <p className="text-[10px] text-white/30 self-center">Fontes:</p>
          {KPI_PREVIA.fontes.map(f => (
            <span key={f} className="text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full px-2 py-0.5">{f}</span>
          ))}
          <span className="text-[10px] text-white/25 self-center">{KPI_PREVIA.statements.length} statements</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
        {([
          { id: 'cc-obra', label: 'CC Obra Virtual', icon: Music },
          { id: 'cc-titular', label: 'CC Titular Virtual', icon: Users },
        ] as { id: Tab; label: string; icon: typeof Music }[]).map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? 'bg-sky-500/20 border border-sky-500/30 text-sky-300'
                : 'text-white/40 hover:text-white/70'
            }`}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {tab === 'cc-obra'     && <CCObraPrevia />}
      {tab === 'cc-titular'  && <CCTitularPrevia />}

      {/* CTA encerramento */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm font-semibold text-amber-300">Pronto para efetivar?</p>
          <p className="text-xs text-amber-300/60 mt-0.5">
            Ao encerrar a distribuição, os valores são gravados nos CC Obra e CC Titular reais e os recibos são gerados para cada titular.
          </p>
        </div>
        <Link
          href="/master/distribuicao/encerramento"
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500/20 border border-amber-500/40 px-5 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0"
        >
          <Lock className="w-4 h-4" /> Encerrar e Processar
        </Link>
      </div>
    </div>
  )
}

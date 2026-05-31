'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  PieChart, Search, Filter, Plus, ChevronDown,
  CheckCircle2, Clock, Zap, DollarSign, Eye, ChevronRight,
} from 'lucide-react'
import {
  MOCK_DISTRIBUICOES,
  KPI_DISTRIBUICOES,
} from '@/lib/mock-distribuicao'
import {
  MOCK_DISTRIBUICAO_PREVIA,
  KPI_PREVIA,
} from '@/lib/mock-distribuicao-previa'
import {
  DISTRIBUICAO_STATUS_LABELS,
  DISTRIBUICAO_STATUS_COLORS,
  type DistribuicaoStatus,
} from '@/lib/types-distribuicao'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmt(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DistribuicaoStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DISTRIBUICAO_STATUS_COLORS[status]}`}>
      {DISTRIBUICAO_STATUS_LABELS[status]}
    </span>
  )
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, color, sub }: {
  label: string
  value: string | number
  icon: React.ReactNode
  color: string
  sub?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DistribuicoesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [periodoSearch, setPeriodoSearch] = useState('')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return MOCK_DISTRIBUICOES.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (periodoSearch && !d.periodo.toLowerCase().includes(periodoSearch.toLowerCase())) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !d.codigo.toLowerCase().includes(q) &&
          !d.id.toLowerCase().includes(q) &&
          !(d._conciliacao_periodo ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [statusFilter, periodoSearch, search])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
              <PieChart className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Distribuicoes</h1>
              <p className="text-sm text-slate-400">Gestao de distribuicoes de royalties e direitos autorais</p>
            </div>
          </div>
          <Link
            href="/master/distribuicao/nova"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 border border-violet-500/40 px-4 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nova Distribuicao
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Calculando"
            value={KPI_DISTRIBUICOES.calculando}
            icon={<Zap className="h-5 w-5 text-amber-300" />}
            color="bg-amber-500/20"
          />
          <KpiCard
            label="Aguardando Aprovacao"
            value={KPI_DISTRIBUICOES.aguardando_aprovacao}
            icon={<Clock className="h-5 w-5 text-sky-300" />}
            color="bg-sky-500/20"
          />
          <KpiCard
            label="Executadas no Mes"
            value={KPI_DISTRIBUICOES.executadas_mes}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            color="bg-emerald-500/20"
          />
          <KpiCard
            label="Total Distribuido"
            value={fmtBRL(KPI_DISTRIBUICOES.valor_total_distribuido)}
            icon={<DollarSign className="h-5 w-5 text-violet-300" />}
            color="bg-violet-500/20"
            sub="distribuicoes executadas"
          />
        </div>

        {/* ── Banner: Distribuição Prévia pendente ── */}
        <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 backdrop-blur-xl p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/20 border border-sky-500/30 shrink-0">
                <Eye className="h-5 w-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-base font-semibold text-sky-300">Distribuição Prévia — {KPI_PREVIA.periodo}</p>
                  <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-300">PRÉVIA</span>
                </div>
                <p className="text-xs text-sky-300/60 mb-3">
                  {KPI_PREVIA.obras_identificadas} obras identificadas · {KPI_PREVIA.titulares} titulares · Fontes: {KPI_PREVIA.fontes.join(', ')}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <p className="text-[10px] text-sky-400/50 uppercase">Total Previsto</p>
                    <p className="text-lg font-bold text-sky-300">{fmtBRL(KPI_PREVIA.total_previsto)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-sky-400/50 uppercase">Previsão de Pagamento</p>
                    <p className="text-sm font-semibold text-white/70">{KPI_PREVIA.data_prevista_pagamento}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-sky-400/50 uppercase">Statements</p>
                    <p className="text-xs font-mono text-white/50">{KPI_PREVIA.statements.length} arquivos</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Link
                href="/master/distribuicao/nova"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-500/20 border border-sky-500/40 px-4 py-2.5 text-sm font-semibold text-sky-300 hover:bg-sky-500/30 transition-colors"
              >
                <Zap className="h-4 w-4" /> Efetuar Distribuição
              </Link>
              <div className="flex gap-2">
                <Link href="/master/cc-obra" className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 transition-colors">
                  CC Obra <ChevronRight className="h-3 w-3" />
                </Link>
                <Link href="/portal/royalties-futuros" className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/10 transition-colors">
                  Portal <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all" className="bg-slate-900">Todos os status</option>
                {(Object.entries(DISTRIBUICAO_STATUS_LABELS) as [DistribuicaoStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">{v}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Periodo */}
            <input
              type="text"
              placeholder="Periodo (ex: 2025-Q1)"
              value={periodoSearch}
              onChange={(e) => setPeriodoSearch(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 w-48"
            />

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por codigo ou descricao..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <span className="text-sm text-slate-400 ml-auto">{filtered.length} resultado(s)</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Codigo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Periodo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Conciliacao</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Total</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Titulares</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Calculado em</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Executado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => { window.location.href = `/master/distribuicao/${d.id}` }}
                  >
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-violet-300">{d.codigo}</td>
                    <td className="px-4 py-3 text-white font-medium">{d.periodo}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px] truncate">
                      {d._conciliacao_periodo ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">{fmtBRL(d.valor_total)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{d.total_titulares}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmt(d.calculado_em)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmt(d.executado_em)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                      Nenhuma distribuicao encontrada com os filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

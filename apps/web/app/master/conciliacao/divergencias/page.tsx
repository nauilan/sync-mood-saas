'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle, Search, Filter, ChevronDown, Eye,
} from 'lucide-react'
import {
  MOCK_CONCILIACOES,
} from '@/lib/mock-conciliacao'
import {
  CONCILIACAO_DIVERGENCIA_TIPO_LABELS,
  type ConciliacaoDivergenciaTipo,
  type ConciliacaoDivergenciaStatus,
} from '@/lib/types-conciliacao'

// ── helpers ───────────────────────────────────────────────────────────────────

const DIV_STATUS_COLORS: Record<ConciliacaoDivergenciaStatus, string> = {
  aberta:     'bg-red-500/20 text-red-300 border-red-500/30',
  em_analise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolvida:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ignorada:   'bg-slate-500/20 text-slate-400 border-slate-500/30',
}
const DIV_STATUS_LABELS: Record<ConciliacaoDivergenciaStatus, string> = {
  aberta:     'Aberta',
  em_analise: 'Em Analise',
  resolvida:  'Resolvida',
  ignorada:   'Ignorada',
}

// ── Flatten divergencias ──────────────────────────────────────────────────────

interface FlatDiv {
  divId:                  string
  tipo:                   ConciliacaoDivergenciaTipo
  status:                 ConciliacaoDivergenciaStatus
  resolucao_observacao:   string | null | undefined
  conciliacao_id:         string
  conciliacao_periodo:    string
  conciliacao_fonte:      string
  obra_titulo:            string
  titular_nome:           string
}

function buildFlatDivs(): FlatDiv[] {
  const rows: FlatDiv[] = []
  for (const c of MOCK_CONCILIACOES) {
    for (const div of c._divergencias ?? []) {
      const item = (c._itens ?? []).find((i) => i.id === div.conciliacao_item_id)
      rows.push({
        divId:                div.id,
        tipo:                 div.tipo,
        status:               div.status,
        resolucao_observacao: div.resolucao_observacao,
        conciliacao_id:       c.id,
        conciliacao_periodo:  c.periodo,
        conciliacao_fonte:    c._fonte_label ?? '—',
        obra_titulo:          item?._obra_titulo ?? '—',
        titular_nome:         item?._titular_nome ?? 'Nao localizado',
      })
    }
  }
  return rows
}

const ALL_FLAT_DIVS = buildFlatDivs()

// ── Badges ────────────────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: ConciliacaoDivergenciaTipo }) {
  return (
    <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-300 whitespace-nowrap">
      {CONCILIACAO_DIVERGENCIA_TIPO_LABELS[tipo]}
    </span>
  )
}

function StatusBadge({ status }: { status: ConciliacaoDivergenciaStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIV_STATUS_COLORS[status]}`}>
      {DIV_STATUS_LABELS[status]}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DivergenciasGlobalPage() {
  const [tipoFilter, setTipoFilter]           = useState<string>('all')
  const [statusFilter, setStatusFilter]       = useState<string>('all')
  const [conciliacaoFilter, setConciliacaoFilter] = useState<string>('all')

  // Row-level status state (local mock mutation)
  const [localStatuses, setLocalStatuses] = useState<Record<string, ConciliacaoDivergenciaStatus>>({})

  function getStatus(row: FlatDiv): ConciliacaoDivergenciaStatus {
    return localStatuses[row.divId] ?? row.status
  }

  function setAction(divId: string, status: ConciliacaoDivergenciaStatus) {
    setLocalStatuses((prev) => ({ ...prev, [divId]: status }))
  }

  const filtered = useMemo(() => {
    return ALL_FLAT_DIVS.filter((row) => {
      const curStatus = localStatuses[row.divId] ?? row.status
      if (tipoFilter !== 'all' && row.tipo !== tipoFilter) return false
      if (statusFilter !== 'all' && curStatus !== statusFilter) return false
      if (conciliacaoFilter !== 'all' && row.conciliacao_id !== conciliacaoFilter) return false
      return true
    })
  }, [tipoFilter, statusFilter, conciliacaoFilter, localStatuses])

  const conciliacaoOptions = useMemo(() => {
    const seen = new Set<string>()
    return MOCK_CONCILIACOES.filter((c) => {
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
  }, [])

  // KPIs
  const kpis = useMemo(() => ({
    abertas:    ALL_FLAT_DIVS.filter((d) => (localStatuses[d.divId] ?? d.status) === 'aberta').length,
    em_analise: ALL_FLAT_DIVS.filter((d) => (localStatuses[d.divId] ?? d.status) === 'em_analise').length,
    resolvidas: ALL_FLAT_DIVS.filter((d) => (localStatuses[d.divId] ?? d.status) === 'resolvida').length,
    ignoradas:  ALL_FLAT_DIVS.filter((d) => (localStatuses[d.divId] ?? d.status) === 'ignorada').length,
  }), [localStatuses])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Divergencias — Conciliacoes</h1>
            <p className="text-sm text-slate-400">Fila global de divergencias de todas as conciliacoes</p>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Abertas',     value: kpis.abertas,    color: 'text-red-300',     bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Em Analise',  value: kpis.em_analise, color: 'text-amber-300',   bg: 'bg-amber-500/10 border-amber-500/20' },
            { label: 'Resolvidas',  value: kpis.resolvidas, color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Ignoradas',   value: kpis.ignoradas,  color: 'text-slate-400',   bg: 'bg-white/5 border-white/10' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-5 ${bg}`}>
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Tipo */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all" className="bg-slate-900">Todos os tipos</option>
                {(Object.entries(CONCILIACAO_DIVERGENCIA_TIPO_LABELS) as [ConciliacaoDivergenciaTipo, string][]).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">{v}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Status */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all" className="bg-slate-900">Todos os status</option>
                {(Object.entries(DIV_STATUS_LABELS) as [ConciliacaoDivergenciaStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">{v}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Conciliacao */}
            <div className="relative">
              <select
                value={conciliacaoFilter}
                onChange={(e) => setConciliacaoFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-3 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all" className="bg-slate-900">Todas as conciliacoes</option>
                {conciliacaoOptions.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900">{c.id} — {c.periodo}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            <span className="text-sm text-slate-400 ml-auto">{filtered.length} divergencia(s)</span>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Conciliacao</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Obra</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Titular</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Resolucao</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((row) => {
                  const curStatus = getStatus(row)
                  return (
                    <tr key={row.divId} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <TipoBadge tipo={row.tipo} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={curStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/master/conciliacao/${row.conciliacao_id}`} className="hover:text-violet-300 transition-colors">
                          <p className="font-mono text-xs text-violet-300">{row.conciliacao_id}</p>
                          <p className="text-xs text-slate-500">{row.conciliacao_periodo}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white">{row.obra_titulo}</td>
                      <td className="px-4 py-3 text-slate-300">{row.titular_nome}</td>
                      <td className="px-4 py-3 text-slate-400 text-xs max-w-[180px]">
                        {row.resolucao_observacao
                          ? <span className="text-emerald-300">{row.resolucao_observacao}</span>
                          : <span className="italic text-slate-600">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setAction(row.divId, 'resolvida')}
                            disabled={curStatus === 'resolvida'}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Resolver
                          </button>
                          <button
                            onClick={() => setAction(row.divId, 'em_analise')}
                            disabled={curStatus === 'em_analise'}
                            className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Em Analise
                          </button>
                          <button
                            onClick={() => setAction(row.divId, 'ignorada')}
                            disabled={curStatus === 'ignorada'}
                            className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-xs font-medium text-slate-400 hover:bg-slate-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Ignorar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      Nenhuma divergencia encontrada com os filtros aplicados.
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

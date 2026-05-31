'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity, Search, Filter, Eye, ChevronDown,
  AlertTriangle, CheckCircle2, Clock, AlertCircle,
} from 'lucide-react'
import {
  MOCK_CONCILIACOES,
  KPI_CONCILIACOES,
} from '@/lib/mock-conciliacao'
import {
  CONCILIACAO_STATUS_LABELS,
  CONCILIACAO_STATUS_COLORS,
  type ConciliacaoStatus,
} from '@/lib/types-conciliacao'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtBRL(value?: number) {
  if (value == null) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase()
}

// ── KPI card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function KpiCard({ label, value, icon, color }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConciliacaoStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CONCILIACAO_STATUS_COLORS[status]}`}>
      {CONCILIACAO_STATUS_LABELS[status]}
    </span>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConciliacoesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return MOCK_CONCILIACOES.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !c.recebimento_id.toLowerCase().includes(q) &&
          !c.periodo.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q)
        ) return false
      }
      if (dateFrom && c.iniciada_em && c.iniciada_em < dateFrom) return false
      if (dateTo && c.iniciada_em && c.iniciada_em > dateTo + 'T23:59:59Z') return false
      return true
    })
  }, [statusFilter, search, dateFrom, dateTo])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Activity className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Conciliacoes</h1>
            <p className="text-sm text-slate-400">Gestao e monitoramento de conciliacoes de recebimentos</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Pendentes"
            value={KPI_CONCILIACOES.pendentes}
            icon={<Clock className="h-5 w-5 text-slate-300" />}
            color="bg-slate-500/20"
          />
          <KpiCard
            label="Em Andamento"
            value={KPI_CONCILIACOES.em_andamento}
            icon={<Activity className="h-5 w-5 text-amber-300" />}
            color="bg-amber-500/20"
          />
          <KpiCard
            label="Concluidas"
            value={KPI_CONCILIACOES.concluidas}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            color="bg-emerald-500/20"
          />
          <KpiCard
            label="Com Divergencia"
            value={KPI_CONCILIACOES.com_divergencia}
            icon={<AlertCircle className="h-5 w-5 text-red-300" />}
            color="bg-red-500/20"
          />
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status select */}
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                <option value="all" className="bg-slate-900">Todos os status</option>
                {(Object.entries(CONCILIACAO_STATUS_LABELS) as [ConciliacaoStatus, string][]).map(([k, v]) => (
                  <option key={k} value={k} className="bg-slate-900">{v}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por recebimento, periodo ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark]"
              />
              <span className="text-slate-500 text-sm">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/5 py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark]"
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Recebimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Periodo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Fonte</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Itens</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Validados</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Divergentes</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Iniciada em</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Finalizada em</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-violet-300">{shortId(c.id)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-300">{c.recebimento_id}</td>
                    <td className="px-4 py-3 text-white font-medium">{c.periodo}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">{c._fonte_label ?? '—'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{c.total_itens}</td>
                    <td className="px-4 py-3 text-right text-emerald-300">{c.total_validados}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={c.total_divergentes > 0 ? 'text-red-300 font-semibold' : 'text-slate-400'}>
                        {c.total_divergentes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmt(c.iniciada_em)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{fmt(c.finalizada_em)}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/master/conciliacao/${c.id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-white/5 hover:bg-violet-500/20 hover:border-violet-500/40 transition-colors text-slate-400 hover:text-violet-300"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center text-slate-500">
                      Nenhuma conciliacao encontrada com os filtros aplicados.
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

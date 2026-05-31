'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileInput, Search, Plus, Activity, CheckCircle2, AlertTriangle,
  ChevronRight, FileText, X,
} from 'lucide-react'
import { TV_IMPORTACAO_GLOBO } from '@/lib/mock-tv'
import type { TvImportacao, TvFormatoArquivo } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(value)
}

// ── Extended mock list (multiple rows for a richer table) ──────────────────────

const FORMATO_COLORS: Record<TvFormatoArquivo, string> = {
  xlsx:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  xls:       'bg-teal-500/20 text-teal-300 border-teal-500/30',
  csv:       'bg-sky-500/20 text-sky-300 border-sky-500/30',
  pdf:       'bg-orange-500/20 text-orange-300 border-orange-500/30',
  cue_sheet: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

const IMPORTACOES_MOCK: (TvImportacao & { status: string })[] = [
  { ...TV_IMPORTACAO_GLOBO, status: 'concluido' },
  {
    id: 'tv-imp-002', codigo: 'TV-IMP-2025-004', emissora: 'SBT',
    formato_arquivo: 'csv', periodo_inicio: '2025-10-01', periodo_fim: '2025-12-31',
    total_linhas: 8, total_matched: 6, total_divergentes: 2,
    importado_em: '2026-01-15T14:30:00Z', editora_id: 'ed-tsm', status: 'concluido',
  },
  {
    id: 'tv-imp-003', codigo: 'TV-IMP-2025-003', emissora: 'Record',
    formato_arquivo: 'pdf', periodo_inicio: '2025-07-01', periodo_fim: '2025-09-30',
    total_linhas: 5, total_matched: 3, total_divergentes: 2,
    importado_em: '2025-10-10T09:15:00Z', editora_id: 'ed-tsm', status: 'concluido',
  },
  {
    id: 'tv-imp-004', codigo: 'TV-IMP-2025-002', emissora: 'Multishow',
    formato_arquivo: 'xlsx', periodo_inicio: '2025-04-01', periodo_fim: '2025-06-30',
    total_linhas: 12, total_matched: 10, total_divergentes: 2,
    importado_em: '2025-07-05T11:00:00Z', editora_id: 'ed-tsm', status: 'concluido',
  },
  {
    id: 'tv-imp-005', codigo: 'TV-IMP-2025-001', emissora: 'Globoplay',
    formato_arquivo: 'cue_sheet', periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
    total_linhas: 20, total_matched: 17, total_divergentes: 3,
    importado_em: '2025-04-08T08:45:00Z', editora_id: 'ed-tsm', status: 'concluido',
  },
]

const STATUS_COLORS: Record<string, string> = {
  concluido:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  processando: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  erro:        'bg-red-500/20 text-red-300 border-red-500/30',
  pendente:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const STATUS_LABELS: Record<string, string> = {
  concluido: 'Concluído', processando: 'Processando', erro: 'Erro', pendente: 'Pendente',
}

const EMISSORAS = ['Globo', 'SBT', 'Record', 'Multishow', 'Globoplay']

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ImportacoesPage() {
  const [search, setSearch] = useState('')
  const [filterEmissora, setFilterEmissora] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const filtered = useMemo(() => {
    return IMPORTACOES_MOCK.filter(imp => {
      if (
        search &&
        !imp.codigo.toLowerCase().includes(search.toLowerCase()) &&
        !imp.emissora.toLowerCase().includes(search.toLowerCase())
      ) return false
      if (filterEmissora && imp.emissora !== filterEmissora) return false
      if (filterPeriodo && !imp.periodo_inicio.startsWith(filterPeriodo) && !imp.periodo_fim.startsWith(filterPeriodo)) return false
      if (filterStatus && imp.status !== filterStatus) return false
      return true
    })
  }, [search, filterEmissora, filterPeriodo, filterStatus])

  // KPI totals
  const totalLinhas     = IMPORTACOES_MOCK.reduce((s, i) => s + i.total_linhas, 0)
  const totalMatched    = IMPORTACOES_MOCK.reduce((s, i) => s + i.total_matched, 0)
  const totalDivergentes = IMPORTACOES_MOCK.reduce((s, i) => s + i.total_divergentes, 0)
  const matchPct        = Math.round((totalMatched / totalLinhas) * 100)

  const selectCls = 'h-8 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white/60 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20">
            <FileInput className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Importações TV</h1>
            <p className="text-sm text-white/40">Histórico de importações de cue sheets e planilhas audiovisuais</p>
          </div>
        </div>
        <Link
          href="/master/tv/importacoes/nova"
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Importação
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-white/5">
            <FileText className="w-5 h-5 text-white/50" />
          </div>
          <div>
            <p className="text-xs text-white/40">Total Importado (linhas)</p>
            <p className="text-2xl font-bold text-white tabular-nums">{totalLinhas}</p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Taxa de Matching</p>
            <div className="flex items-end gap-2">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{matchPct}%</p>
              <p className="text-xs text-white/30 mb-0.5">{totalMatched} matched</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
          <div className="p-2 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Divergências (total)</p>
            <p className="text-2xl font-bold text-red-400 tabular-nums">{totalDivergentes}</p>
          </div>
        </div>
      </div>

      {/* ── Filtros + Tabela ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white/5 border border-white/10 rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Código ou emissora..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Emissora select */}
          <select
            value={filterEmissora}
            onChange={e => setFilterEmissora(e.target.value)}
            className={selectCls}
          >
            <option value="">Todas emissoras</option>
            {EMISSORAS.map(e => <option key={e} value={e}>{e}</option>)}
          </select>

          {/* Período */}
          <input
            type="month"
            value={filterPeriodo}
            onChange={e => setFilterPeriodo(e.target.value)}
            placeholder="Período"
            className={`${selectCls} w-36`}
          />

          {/* Status buttons */}
          <div className="flex items-center gap-1">
            {(['', 'concluido', 'processando', 'pendente'] as const).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? 'bg-violet-600 text-white'
                    : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
                }`}
              >
                {s === '' ? 'Todos' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          <span className="text-xs text-white/25 ml-auto">{filtered.length} registros</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Código', 'Emissora', 'Formato', 'Período', 'Linhas', 'Matched', 'Divergentes', 'Importado em', ''].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(imp => {
                const pct = Math.round((imp.total_matched / imp.total_linhas) * 100)
                return (
                  <tr key={imp.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-white/55">{imp.codigo}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-semibold text-white">{imp.emissora}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${FORMATO_COLORS[imp.formato_arquivo]}`}>
                        {imp.formato_arquivo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">
                        {formatDate(imp.periodo_inicio)}&nbsp;–&nbsp;{formatDate(imp.periodo_fim)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm tabular-nums text-white/70">{imp.total_linhas}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm tabular-nums text-emerald-400 font-semibold">{imp.total_matched}</span>
                        <span className="text-[10px] text-white/25">({pct}%)</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {imp.total_divergentes > 0 ? (
                        <span className="inline-flex items-center gap-1 text-sm tabular-nums font-semibold text-red-400">
                          <AlertTriangle className="w-3 h-3" /> {imp.total_divergentes}
                        </span>
                      ) : (
                        <span className="text-sm text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/40">{formatDateTime(imp.importado_em)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/master/tv/execucoes`}
                        className="flex items-center gap-0.5 text-xs text-white/25 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Activity className="w-3 h-3" />
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <FileInput className="w-8 h-8" />
            <p className="text-sm">Nenhuma importação encontrada</p>
            <Link
              href="/master/tv/importacoes/nova"
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-violet-600/20 border border-violet-500/30 text-xs text-violet-300 hover:bg-violet-600/30 transition-colors mt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Importação
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

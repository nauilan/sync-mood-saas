'use client'

import Link from 'next/link'
import {
  Tv, DollarSign, CheckCircle2, AlertTriangle, TrendingUp,
  FileInput, ChevronRight, Activity, Building2,
} from 'lucide-react'
import { KPI_TV, TV_TOP_EMISSORAS, TV_TOP_OBRAS, TV_IMPORTACAO_GLOBO } from '@/lib/mock-tv'

function formatBRL(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

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

function ImportacaoStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    concluido:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    processando: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    erro:        'bg-red-500/20 text-red-300 border-red-500/30',
    pendente:    'bg-slate-500/20 text-slate-300 border-slate-500/30',
  }
  const label: Record<string, string> = {
    concluido: 'Concluído', processando: 'Processando', erro: 'Erro', pendente: 'Pendente',
  }
  const resolvedStatus = status in map ? status : 'concluido'
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[resolvedStatus]}`}>
      {label[resolvedStatus] ?? 'Concluído'}
    </span>
  )
}

export default function TvPage() {
  const matchPct = Math.round((TV_IMPORTACAO_GLOBO.total_matched / TV_IMPORTACAO_GLOBO.total_linhas) * 100)

  const kpis = [
    {
      label: 'Execuções Identificadas',
      value: KPI_TV.total_identificadas.toString(),
      sub: 'auto_match + confirmados',
      icon: Activity,
      color: 'text-violet-400',
      border: 'border-violet-500/20',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Total Faturado',
      value: formatBRL(KPI_TV.total_faturado),
      sub: 'autorizações emitidas',
      icon: DollarSign,
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Recebido',
      value: formatBRL(KPI_TV.total_recebido),
      sub: 'recebimentos conciliados',
      icon: TrendingUp,
      color: 'text-sky-400',
      border: 'border-sky-500/20',
      bg: 'bg-sky-500/10',
    },
    {
      label: 'Divergências Abertas',
      value: KPI_TV.divergencias_abertas.toString(),
      sub: 'aguardando resolução',
      icon: AlertTriangle,
      color: 'text-red-400',
      border: 'border-red-500/20',
      bg: 'bg-red-500/10',
    },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/25">
            <Tv className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight tracking-tight">
              TV / Sincronização Audiovisual
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Auditoria&nbsp;|&nbsp;Matching&nbsp;|&nbsp;Cobrança
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/master/tv/importacoes/nova"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            <FileInput className="w-4 h-4" /> Nova Importação
          </Link>
          <Link
            href="/master/tv/execucoes"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/70 font-medium transition-colors"
          >
            <Activity className="w-4 h-4" /> Execuções
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className={`bg-white/5 border ${kpi.border} rounded-2xl p-6 flex flex-col gap-3 backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-white/40 uppercase tracking-widest">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold ${kpi.color} leading-none tabular-nums`}>
                {kpi.value}
              </p>
              <p className="text-xs text-white/30">{kpi.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Bento Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Emissoras */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-white">Top 5 Emissoras</h2>
            </div>
            <Link
              href="/master/tv/execucoes"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-0.5"
            >
              Ver tudo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {TV_TOP_EMISSORAS.map((item, idx) => {
              const maxVal = TV_TOP_EMISSORAS[0]?.valor ?? 1
              const pct = Math.round((item.valor / maxVal) * 100)
              return (
                <div key={item.emissora} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-bold text-white/20 w-4 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white">{item.emissora}</span>
                      <span className="text-xs text-white/40 tabular-nums">{item.execucoes} exec.</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-400 tabular-nums shrink-0 w-28 text-right">
                    {formatBRL(item.valor)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Obras Audiovisuais */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-fuchsia-400" />
              <h2 className="text-sm font-semibold text-white">Top Obras Audiovisuais</h2>
            </div>
            <Link
              href="/master/tv/execucoes"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-0.5"
            >
              Ver tudo <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {TV_TOP_OBRAS.map((item, idx) => {
              const maxVal = Math.max(...TV_TOP_OBRAS.map(o => o.valor))
              const pct = maxVal > 0 ? Math.round((item.valor / maxVal) * 100) : 0
              return (
                <div key={item.obra_titulo} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-xs font-bold text-white/20 w-4 shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-white truncate mr-2">{item.obra_titulo}</span>
                      <span className="text-xs text-white/40 tabular-nums shrink-0">{item.execucoes} exec.</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-fuchsia-500 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums shrink-0 w-28 text-right ${item.valor > 0 ? 'text-emerald-400' : 'text-white/25'}`}>
                    {item.valor > 0 ? formatBRL(item.valor) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Importações Recentes ────────────────────────────────────────────── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileInput className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white">Importações Recentes</h2>
          </div>
          <Link
            href="/master/tv/importacoes"
            className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-0.5"
          >
            Ver todas <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Código', 'Emissora', 'Período', 'Total Linhas', 'Matched', 'Divergentes', 'Importado em', 'Status'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[TV_IMPORTACAO_GLOBO].map(imp => (
                <tr key={imp.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-0">
                  <td className="px-4 py-3.5">
                    <span className="font-mono text-xs text-white/60">{imp.codigo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-white">{imp.emissora}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-white/50">
                      {formatDate(imp.periodo_inicio)} – {formatDate(imp.periodo_fim)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm tabular-nums text-white/70">{imp.total_linhas}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm tabular-nums text-emerald-400 font-semibold">{imp.total_matched}</span>
                      <span className="text-[10px] text-white/25">
                        ({Math.round((imp.total_matched / imp.total_linhas) * 100)}%)
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-sm tabular-nums font-semibold ${imp.total_divergentes > 0 ? 'text-red-400' : 'text-white/30'}`}>
                      {imp.total_divergentes}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-white/40">{formatDateTime(imp.importado_em)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <ImportacaoStatusBadge status="concluido" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Match progress summary */}
        <div className="px-5 py-4 border-t border-white/[0.06] flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <span className="text-xs text-white/40">Taxa de matching global</span>
            <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full"
                style={{ width: `${matchPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400 tabular-nums">{matchPct}%</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span><span className="text-emerald-400 font-semibold">{TV_IMPORTACAO_GLOBO.total_matched}</span> matched</span>
            <span><span className="text-red-400 font-semibold">{TV_IMPORTACAO_GLOBO.total_divergentes}</span> divergentes</span>
            <span><span className="text-white/60 font-semibold">{TV_IMPORTACAO_GLOBO.total_linhas}</span> total</span>
          </div>
        </div>
      </div>
    </div>
  )
}

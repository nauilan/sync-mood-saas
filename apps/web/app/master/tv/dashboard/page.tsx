'use client'

import { useMemo } from 'react'
import {
  BarChart3, DollarSign, TrendingUp, AlertTriangle,
  Tv, Activity,
} from 'lucide-react'
import {
  KPI_TV, TV_AUTORIZACOES, TV_RECEBIMENTOS, TV_EXECUCOES,
  TV_TOP_EMISSORAS, TV_TOP_OBRAS,
} from '@/lib/mock-tv'
import {
  TV_TIPO_USO_LABELS, TV_TIPO_USO_COLORS, TV_DIVERGENCIA_TIPO_LABELS,
} from '@/lib/types-tv'
import type { TvTipoUso, TvDivergenciaTipo } from '@/lib/types-tv'
import { TV_DIVERGENCIAS } from '@/lib/mock-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Pie chart slice colors (for tipo_uso segments)
const PIE_COLORS: string[] = [
  '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ec4899',
  '#6366f1', '#f97316', '#14b8a6', '#e879f9', '#22c55e', '#ef4444',
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DashboardTVPage() {
  // ── Computed KPIs ──
  const totalAutorizado = TV_AUTORIZACOES.reduce((s, a) => s + a.valor_calculado, 0)
  const totalFaturado   = TV_AUTORIZACOES.reduce((s, a) => s + (a.valor_negociado ?? a.valor_calculado), 0)
  const totalRecebido   = TV_RECEBIMENTOS.reduce((s, r) => s + r.valor_liquido, 0)

  // ── Tipo uso distribution ──
  const tipoUsoMap = useMemo(() => {
    const map: Record<string, number> = {}
    TV_EXECUCOES.forEach(e => {
      map[e.tipo_uso] = (map[e.tipo_uso] ?? 0) + 1
    })
    return map
  }, [])

  const tipoUsoTotal = Object.values(tipoUsoMap).reduce((s, v) => s + v, 0)
  const tipoUsoEntries = (Object.entries(tipoUsoMap) as [TvTipoUso, number][])
    .sort((a, b) => b[1] - a[1])

  // ── Divergencias breakdown ──
  const divByTipo = useMemo(() => {
    const map: Partial<Record<TvDivergenciaTipo, number>> = {}
    TV_DIVERGENCIAS.forEach(d => {
      map[d.tipo] = (map[d.tipo] ?? 0) + 1
    })
    return map
  }, [])

  // ── Top emissoras: max value for bar scaling ──
  const maxEmissoraVal  = Math.max(...TV_TOP_EMISSORAS.map(e => e.valor))
  const maxObraVal      = Math.max(...TV_TOP_OBRAS.map(o => o.valor))
  const maxEmissoraExec = Math.max(...TV_TOP_EMISSORAS.map(e => e.execucoes))
  const maxObraExec     = Math.max(...TV_TOP_OBRAS.map(o => o.execucoes))

  // ── KPI cards config ──
  const kpiCards = [
    {
      label:    'Execuções Identificadas',
      value:    KPI_TV.total_identificadas,
      sub:      'auto_match + confirmados',
      icon:     Activity,
      iconColor:'text-violet-400',
      bg:       'bg-violet-500/10 border-violet-500/20',
      fmt:      (v: number) => v.toString(),
    },
    {
      label:    'Total Autorizado',
      value:    totalAutorizado,
      sub:      'soma valor_calculado',
      icon:     DollarSign,
      iconColor:'text-emerald-400',
      bg:       'bg-emerald-500/10 border-emerald-500/20',
      fmt:      formatBRL,
    },
    {
      label:    'Total Faturado',
      value:    totalFaturado,
      sub:      'soma valor_negociado',
      icon:     TrendingUp,
      iconColor:'text-sky-400',
      bg:       'bg-sky-500/10 border-sky-500/20',
      fmt:      formatBRL,
    },
    {
      label:    'Total Recebido',
      value:    totalRecebido,
      sub:      'soma valor_liquido',
      icon:     DollarSign,
      iconColor:'text-amber-400',
      bg:       'bg-amber-500/10 border-amber-500/20',
      fmt:      formatBRL,
    },
    {
      label:    'Divergências Abertas',
      value:    KPI_TV.divergencias_abertas,
      sub:      'requerem ação',
      icon:     AlertTriangle,
      iconColor:'text-red-400',
      bg:       'bg-red-500/10 border-red-500/20',
      fmt:      (v: number) => v.toString(),
    },
    {
      label:    'Emissoras',
      value:    TV_TOP_EMISSORAS.length,
      sub:      'emissoras cadastradas',
      icon:     Tv,
      iconColor:'text-fuchsia-400',
      bg:       'bg-fuchsia-500/10 border-fuchsia-500/20',
      fmt:      (v: number) => v.toString(),
    },
  ]

  return (
    <div className="space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <BarChart3 className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard TV</h1>
          <p className="text-sm text-white/40">Análise consolidada do módulo audiovisual</p>
        </div>
      </div>

      {/* ── 6-card KPI grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`rounded-2xl border p-5 ${card.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40 font-medium">{card.label}</p>
                <div className="p-1.5 rounded-lg bg-white/5">
                  <Icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold tabular-nums leading-tight ${card.iconColor}`}>
                {card.fmt(card.value)}
              </p>
              <p className="text-[10px] text-white/25 mt-1">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Top Emissoras bar chart ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Top Emissoras</h2>
            <span className="text-[10px] text-white/30 uppercase tracking-wide">por valor</span>
          </div>
          <div className="space-y-3">
            {TV_TOP_EMISSORAS.map((item, i) => (
              <div key={item.emissora}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70 font-medium">{item.emissora}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{item.execucoes} exec.</span>
                    <span className="text-xs font-bold text-white tabular-nums">{formatBRL(item.valor)}</span>
                  </div>
                </div>
                {/* Bar */}
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${maxEmissoraVal > 0 ? (item.valor / maxEmissoraVal) * 100 : 0}%`,
                      background: `hsl(${270 - i * 30}, 70%, 60%)`,
                    }}
                  />
                </div>
                {/* Exec count mini bar */}
                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full bg-white/20"
                    style={{ width: `${maxEmissoraExec > 0 ? (item.execucoes / maxEmissoraExec) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top Obras bar chart ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Top Obras Audiovisuais</h2>
            <span className="text-[10px] text-white/30 uppercase tracking-wide">por valor</span>
          </div>
          <div className="space-y-3">
            {TV_TOP_OBRAS.map((item, i) => (
              <div key={item.obra_titulo}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/70 font-medium truncate max-w-[160px]">{item.obra_titulo}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/30">{item.execucoes} exec.</span>
                    <span className="text-xs font-bold text-white tabular-nums">
                      {item.valor > 0 ? formatBRL(item.valor) : '—'}
                    </span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${maxObraVal > 0 ? (item.valor / maxObraVal) * 100 : 0}%`,
                      background: `hsl(${160 + i * 25}, 65%, 55%)`,
                    }}
                  />
                </div>
                <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden mt-0.5">
                  <div
                    className="h-full rounded-full bg-white/20"
                    style={{ width: `${maxObraExec > 0 ? (item.execucoes / maxObraExec) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Tipo Uso pie + Divergencias breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Tipo Uso simulated pie ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white">Execuções por Tipo de Uso</h2>

          <div className="flex gap-6 items-center">
            {/* SVG donut */}
            <div className="shrink-0">
              <svg width="100" height="100" viewBox="0 0 36 36" className="rotate-[-90deg]">
                {(() => {
                  let offset = 0
                  return tipoUsoEntries.map(([tipo, count], idx) => {
                    const pct = (count / tipoUsoTotal) * 100
                    const dashArray = `${pct} ${100 - pct}`
                    const slice = (
                      <circle
                        key={tipo}
                        cx="18" cy="18" r="15.9"
                        fill="transparent"
                        stroke={PIE_COLORS[idx % PIE_COLORS.length]}
                        strokeWidth="3.5"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-(offset)}
                      />
                    )
                    offset += pct
                    return slice
                  })
                })()}
                {/* Center hole */}
                <circle cx="18" cy="18" r="12" fill="#0f0f1a" />
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {tipoUsoEntries.map(([tipo, count], idx) => {
                const pct = ((count / tipoUsoTotal) * 100).toFixed(1)
                return (
                  <div key={tipo} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="text-xs text-white/60 truncate flex-1">{TV_TIPO_USO_LABELS[tipo]}</span>
                    <span className="text-xs font-semibold text-white tabular-nums">{count}</span>
                    <span className="text-[10px] text-white/30 tabular-nums w-10 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tipoUsoEntries.map(([tipo]) => (
              <span key={tipo} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TV_TIPO_USO_COLORS[tipo]}`}>
                {TV_TIPO_USO_LABELS[tipo]}
              </span>
            ))}
          </div>
        </div>

        {/* ── Divergencias breakdown ── */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">Divergências por Tipo</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs font-semibold text-red-300">{TV_DIVERGENCIAS.length} total</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {(Object.entries(divByTipo) as [TvDivergenciaTipo, number][]).map(([tipo, count]) => {
              const pct = Math.round((count / TV_DIVERGENCIAS.length) * 100)
              return (
                <div key={tipo}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60">{TV_DIVERGENCIA_TIPO_LABELS[tipo]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white tabular-nums">{count}</span>
                      <span className="text-[10px] text-white/30 tabular-nums w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Status breakdown */}
          <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-3">
            {(
              [
                { label: 'Abertas',     status: 'aberta',     color: 'text-red-400' },
                { label: 'Em análise',  status: 'em_analise', color: 'text-amber-400' },
                { label: 'Resolvidas',  status: 'resolvida',  color: 'text-emerald-400' },
                { label: 'Ignoradas',   status: 'ignorada',   color: 'text-slate-400' },
              ] as const
            ).map(({ label, status, color }) => {
              const cnt = TV_DIVERGENCIAS.filter(d => d.status === status).length
              return (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-xs text-white/40">{label}</span>
                  <span className={`text-sm font-bold tabular-nums ${color}`}>{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

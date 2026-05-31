'use client'

import { TrendingUp, DollarSign, CheckCircle2, Activity } from 'lucide-react'
import {
  MOCK_RECOUPMENT_SALDOS,
  DIST_BACKOFFICE_Q1_EXECUTADA,
  DIST_BACKOFFICE_Q2_CALCULANDO,
} from '@/lib/mock-distribuicao'
import type { RecoupmentSaldo } from '@/lib/types-distribuicao'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtPct(v: number) {
  return `${v.toFixed(2)}%`
}

// ── KPI cards ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, color }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  color: string
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

// ── Recoupment history mock ───────────────────────────────────────────────────

interface RecoupHistory {
  distribuicao_codigo: string
  distribuicao_periodo: string
  valor_abatido: number
  data: string
}

function buildHistory(saldo: RecoupmentSaldo): RecoupHistory[] {
  const rows: RecoupHistory[] = []
  // Find items with recoupment for this contrato across mock distribuicoes
  for (const dist of [DIST_BACKOFFICE_Q1_EXECUTADA, DIST_BACKOFFICE_Q2_CALCULANDO]) {
    for (const item of dist._itens ?? []) {
      for (const rec of item._recoupment ?? []) {
        if (rec._contrato_numero === saldo.contrato_numero) {
          rows.push({
            distribuicao_codigo: dist.codigo,
            distribuicao_periodo: dist.periodo,
            valor_abatido: rec.valor_abatido,
            data: dist.calculado_em,
          })
        }
      }
    }
  }
  return rows
}

// ── Saldo card ────────────────────────────────────────────────────────────────

function SaldoCard({ saldo }: { saldo: RecoupmentSaldo }) {
  const pct = Math.min(100, saldo.percentual_recuperado)
  const history = buildHistory(saldo)

  // derive tipo from titular_id prefix
  const isPJ = saldo.titular_id?.startsWith('tit-pj')

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300">
              {saldo.titular_nome.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-white">{saldo.titular_nome}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                  isPJ
                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  {isPJ ? 'PJ' : 'PF'}
                </span>
                <span className="font-mono text-xs text-slate-500">{saldo.contrato_numero}</span>
              </div>
            </div>
          </div>
        </div>

        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${
          pct >= 100
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
            : pct >= 50
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            : 'bg-red-500/20 text-red-300 border-red-500/30'
        }`}>
          {fmtPct(saldo.percentual_recuperado)} recuperado
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Progresso de recuperacao</span>
          <span>{fmtPct(pct)}</span>
        </div>
        <div className="h-4 w-full rounded-full bg-slate-700 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: pct >= 100
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : pct >= 50
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
            }}
          />
        </div>
      </div>

      {/* 3 columns */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Valor Adiantado</p>
          <p className="text-lg font-bold text-white">{fmtBRL(saldo.valor_adiantado)}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <p className="text-xs text-slate-400 mb-1">Valor Recuperado</p>
          <p className="text-lg font-bold text-emerald-300">{fmtBRL(saldo.valor_recuperado)}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-xs text-slate-400 mb-1">Saldo Devedor</p>
          <p className="text-lg font-bold text-red-300">{fmtBRL(saldo.saldo_devedor)}</p>
        </div>
      </div>

      {/* Timeline history */}
      {history.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Historico de Abatimentos</p>
          <div className="space-y-0">
            {history.map((h, idx) => (
              <div key={h.distribuicao_codigo} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-violet-500 ring-2 ring-violet-500/30 mt-0.5 flex-shrink-0" />
                  {idx < history.length - 1 && (
                    <div className="w-0.5 flex-1 bg-white/10 my-1" />
                  )}
                </div>
                <div className="pb-3 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-violet-300">{h.distribuicao_codigo}</span>
                      <span className="text-xs text-slate-500 ml-2">{h.distribuicao_periodo}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-300">- {fmtBRL(h.valor_abatido)}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(h.data).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RecoupmentPage() {
  const totalAdiantado   = MOCK_RECOUPMENT_SALDOS.reduce((s, r) => s + r.valor_adiantado,  0)
  const totalRecuperado  = MOCK_RECOUPMENT_SALDOS.reduce((s, r) => s + r.valor_recuperado, 0)
  const totalDevedor     = MOCK_RECOUPMENT_SALDOS.reduce((s, r) => s + r.saldo_devedor,    0)
  const pctMedio = MOCK_RECOUPMENT_SALDOS.length > 0
    ? MOCK_RECOUPMENT_SALDOS.reduce((s, r) => s + r.percentual_recuperado, 0) / MOCK_RECOUPMENT_SALDOS.length
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <TrendingUp className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Recoupment</h1>
            <p className="text-sm text-slate-400">Saldo de adiantamentos por titular</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard
            label="Total Adiantado"
            value={fmtBRL(totalAdiantado)}
            icon={<DollarSign className="h-5 w-5 text-slate-300" />}
            color="bg-slate-500/20"
          />
          <KpiCard
            label="Total Recuperado"
            value={fmtBRL(totalRecuperado)}
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-300" />}
            color="bg-emerald-500/20"
          />
          <KpiCard
            label="Saldo Devedor Total"
            value={fmtBRL(totalDevedor)}
            icon={<Activity className="h-5 w-5 text-red-300" />}
            color="bg-red-500/20"
          />
          <KpiCard
            label="% Recuperado Medio"
            value={fmtPct(pctMedio)}
            sub={`${MOCK_RECOUPMENT_SALDOS.length} contrato(s)`}
            icon={<TrendingUp className="h-5 w-5 text-violet-300" />}
            color="bg-violet-500/20"
          />
        </div>

        {/* Saldo cards */}
        <div className="space-y-6">
          {MOCK_RECOUPMENT_SALDOS.map((saldo) => (
            <SaldoCard key={saldo.contrato_id} saldo={saldo} />
          ))}

          {MOCK_RECOUPMENT_SALDOS.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-16 text-center text-slate-500">
              Nenhum saldo de recoupment encontrado.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

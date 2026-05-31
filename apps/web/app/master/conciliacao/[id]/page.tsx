'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity, ChevronLeft, CheckCircle2, AlertCircle,
  AlertTriangle, FileText, Clock, Info, Check,
} from 'lucide-react'
import {
  MOCK_CONCILIACOES,
  CONC_TV_Q1,
} from '@/lib/mock-conciliacao'
import {
  CONCILIACAO_STATUS_LABELS,
  CONCILIACAO_STATUS_COLORS,
  CONCILIACAO_ITEM_STATUS_LABELS,
  CONCILIACAO_ITEM_STATUS_COLORS,
  CONCILIACAO_DIVERGENCIA_TIPO_LABELS,
  type ConciliacaoStatus,
  type ConciliacaoItemStatus,
  type ConciliacaoDivergenciaTipo,
  type ConciliacaoDivergenciaStatus,
} from '@/lib/types-conciliacao'

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConciliacaoStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${CONCILIACAO_STATUS_COLORS[status]}`}>
      {CONCILIACAO_STATUS_LABELS[status]}
    </span>
  )
}

function ItemStatusBadge({ status }: { status: ConciliacaoItemStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CONCILIACAO_ITEM_STATUS_COLORS[status]}`}>
      {CONCILIACAO_ITEM_STATUS_LABELS[status]}
    </span>
  )
}

function DivTipoBadge({ tipo }: { tipo: ConciliacaoDivergenciaTipo }) {
  return (
    <span className="inline-flex items-center rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-xs font-medium text-orange-300">
      {CONCILIACAO_DIVERGENCIA_TIPO_LABELS[tipo]}
    </span>
  )
}

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

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Resumo', 'Itens', 'Divergencias', 'Logs'] as const
type Tab = typeof TABS[number]

// ── Mock logs ─────────────────────────────────────────────────────────────────

const MOCK_LOGS = [
  { id: 1, ts: '2026-04-12T09:00:00Z', user: 'Sistema', action: 'Conciliacao iniciada automaticamente apos importacao do recebimento.' },
  { id: 2, ts: '2026-04-12T09:15:00Z', user: 'Sistema', action: 'Itens mapeados: 4 obras processadas.' },
  { id: 3, ts: '2026-04-12T09:17:00Z', user: 'Sistema', action: 'Divergencia detectada: ci-006-4 — Direito nao cedido para Marcelo Costa (TV aberta).' },
  { id: 4, ts: '2026-04-12T10:05:00Z', user: 'Admin Edi Music', action: 'Divergencia cdiv-006-1 marcada como "aberta" para revisao manual.' },
  { id: 5, ts: '2026-04-12T11:30:00Z', user: 'Sistema', action: '3 de 4 itens validados. Conciliacao aguardando resolucao de divergencia.' },
]

// ── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ConciliacaoDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? ''

  const conc = MOCK_CONCILIACOES.find((c) => c.id === id) ?? CONC_TV_Q1

  const [activeTab, setActiveTab] = useState<Tab>('Resumo')

  const valorTotal = conc._recebimento_valor ?? 0
  const pct = conc.total_itens > 0
    ? Math.round((conc.total_validados / conc.total_itens) * 100)
    : 0

  const canApprove = conc.total_divergentes === 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Back */}
        <Link href="/master/conciliacao" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-violet-300 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Conciliacoes
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <Activity className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Conciliacao <span className="font-mono text-violet-300">{conc.id}</span></h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <StatusBadge status={conc.status} />
                  <span>{conc._fonte_label ?? '—'}</span>
                  <span>·</span>
                  <span>{conc.periodo}</span>
                  <span>·</span>
                  <span className="text-white font-medium">{fmtBRL(valorTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-violet-500/30 text-violet-200 border border-violet-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
              {tab === 'Divergencias' && conc.total_divergentes > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500/30 px-1.5 py-0.5 text-xs text-red-300">
                  {conc.total_divergentes}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Resumo */}
        {activeTab === 'Resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <SummaryCard label="Total de Itens" value={conc.total_itens} color="text-white" />
              <SummaryCard label="Validados" value={conc.total_validados} color="text-emerald-300" />
              <SummaryCard
                label="Divergentes"
                value={conc.total_divergentes}
                color={conc.total_divergentes > 0 ? 'text-red-300' : 'text-slate-400'}
              />
              <SummaryCard label="% Validado" value={`${pct}%`} sub="do total de itens" color="text-violet-300" />
            </div>

            {/* Progress bar */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">Progresso da conciliacao</span>
                <span className="text-sm text-violet-300">{pct}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-700">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Details grid */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {[
                { label: 'ID da Conciliacao', value: conc.id },
                { label: 'Recebimento ID', value: conc.recebimento_id },
                { label: 'Periodo', value: conc.periodo },
                { label: 'Fonte', value: conc._fonte_label ?? '—' },
                { label: 'Iniciada em', value: fmt(conc.iniciada_em) },
                { label: 'Finalizada em', value: fmt(conc.finalizada_em) },
                { label: 'Valor do Recebimento', value: fmtBRL(valorTotal) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="text-sm text-white break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Itens */}
        {activeTab === 'Itens' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Itens da Conciliacao</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Obra</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Titular</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Bruto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">% Aplicado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Valor Calculado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(conc._itens ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{item._obra_titulo ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{item._titular_nome ?? <span className="text-red-400 italic">Nao localizado</span>}</td>
                      <td className="px-4 py-3 text-right text-slate-300">{fmtBRL(item.valor_bruto)}</td>
                      <td className="px-4 py-3 text-right text-violet-300">{item.percentual_aplicado}%</td>
                      <td className="px-4 py-3 text-right text-white font-semibold">{fmtBRL(item.valor_calculado)}</td>
                      <td className="px-4 py-3">
                        <ItemStatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Divergencias */}
        {activeTab === 'Divergencias' && (
          <div className="space-y-4">
            {(conc._divergencias ?? []).length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-emerald-300 font-medium">Nenhuma divergencia encontrada</p>
                <p className="text-sm text-slate-400 mt-1">Todos os itens foram validados com sucesso.</p>
              </div>
            ) : (
              (conc._divergencias ?? []).map((div) => {
                // Find associated item
                const item = (conc._itens ?? []).find((i) => i.id === div.conciliacao_item_id)
                return (
                  <div key={div.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                      <DivTipoBadge tipo={div.tipo} />
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${DIV_STATUS_COLORS[div.status]}`}>
                        {DIV_STATUS_LABELS[div.status]}
                      </span>
                      <span className="font-mono text-xs text-slate-500">{div.id}</span>
                    </div>
                    {item && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Obra</p>
                          <p className="text-white">{item._obra_titulo ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Titular</p>
                          <p className="text-white">{item._titular_nome ?? <span className="text-red-400 italic">Nao localizado</span>}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Valor Calculado</p>
                          <p className="text-white">{fmtBRL(item.valor_calculado)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Status do Item</p>
                          <ItemStatusBadge status={item.status} />
                        </div>
                      </div>
                    )}
                    {div.resolucao_observacao && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 flex gap-2">
                        <Info className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-200">{div.resolucao_observacao}</p>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Tab: Logs */}
        {activeTab === 'Logs' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
            <h2 className="font-semibold text-white mb-4">Historico de Eventos</h2>
            <div className="space-y-0">
              {MOCK_LOGS.map((log, idx) => (
                <div key={log.id} className="flex gap-4">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-violet-500 ring-2 ring-violet-500/30 mt-0.5 flex-shrink-0" />
                    {idx < MOCK_LOGS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-white/10 my-1" />
                    )}
                  </div>
                  <div className="pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-violet-300 font-medium">{log.user}</span>
                      <span className="text-xs text-slate-500">{fmt(log.ts)}</span>
                    </div>
                    <p className="text-sm text-slate-300">{log.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approve button */}
        <div className="flex justify-end">
          {canApprove ? (
            <button className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-6 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors">
              <Check className="h-4 w-4" />
              Aprovar Conciliacao
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-6 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed"
              >
                <Check className="h-4 w-4" />
                Aprovar Conciliacao
              </button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-10">
                <div className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-2 text-xs text-red-300 whitespace-nowrap">
                  Resolva todas as divergencias antes de aprovar
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

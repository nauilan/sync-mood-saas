'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  PieChart, ChevronLeft, ChevronDown, ChevronUp,
  Check, X, CheckCircle2, XCircle, Clock,
  DollarSign, Users, Activity, TrendingUp,
} from 'lucide-react'
import {
  MOCK_DISTRIBUICOES,
  DIST_BACKOFFICE_Q1_EXECUTADA,
} from '@/lib/mock-distribuicao'
import {
  DISTRIBUICAO_STATUS_LABELS,
  DISTRIBUICAO_STATUS_COLORS,
  DISTRIBUICAO_TIPO_DESTINO_LABELS,
  DISTRIBUICAO_TIPO_DESTINO_COLORS,
  RETENCAO_TIPO_LABELS,
  type DistribuicaoStatus,
  type DistribuicaoItemTipoDestino,
  type DistribuicaoRetencaoTipo,
} from '@/lib/types-distribuicao'

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmt(date?: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

// ── Badges ────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: DistribuicaoStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DISTRIBUICAO_STATUS_COLORS[status]}`}>
      {DISTRIBUICAO_STATUS_LABELS[status]}
    </span>
  )
}

function TipoBadge({ tipo }: { tipo: DistribuicaoItemTipoDestino }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${DISTRIBUICAO_TIPO_DESTINO_COLORS[tipo]}`}>
      {DISTRIBUICAO_TIPO_DESTINO_LABELS[tipo]}
    </span>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ['Resumo', 'Itens', 'Retencoes', 'Recoupment', 'Aprovacao', 'Logs'] as const
type Tab = typeof TABS[number]

// ── Mock logs ─────────────────────────────────────────────────────────────────

const MOCK_LOGS = [
  { id: 1, ts: '2025-04-22T11:00:00Z', user: 'Sistema', msg: 'Calculo iniciado apos conclusao da conciliacao conc-001.' },
  { id: 2, ts: '2025-04-22T11:02:00Z', user: 'Sistema', msg: '5 itens calculados. Total: R$ 3.820,14.' },
  { id: 3, ts: '2025-04-22T11:03:00Z', user: 'Sistema', msg: 'IRPF aplicado em Giovani Alves: R$ 216,36 (15%).' },
  { id: 4, ts: '2025-04-22T11:04:00Z', user: 'Sistema', msg: 'Recoupment aplicado em Nauilan Barbosa: R$ 974,47 (contrato TSM-2025-001). Saldo anterior: R$ 15.000,00.' },
  { id: 5, ts: '2025-04-24T10:00:00Z', user: 'Edi Music Admin', msg: 'Distribuicao aprovada. Enviada para execucao.' },
  { id: 6, ts: '2025-04-25T15:00:00Z', user: 'Sistema', msg: 'Pagamentos executados. Status atualizado para "executada".' },
]

// ── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, icon }: {
  label: string; value: string | number; color: string; icon?: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )
}

// ── Tab Itens: Hierarquia expandable ─────────────────────────────────────────

function TabItens({ dist }: { dist: typeof DIST_BACKOFFICE_Q1_EXECUTADA }) {
  const [expandedObras, setExpandedObras] = useState<Set<string>>(new Set())
  const [expandedLinks, setExpandedLinks] = useState<Set<string>>(new Set())

  function toggleObra(id: string) {
    setExpandedObras((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleLink(id: string) {
    setExpandedLinks((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const items = dist._itens ?? []

  // Group obra → link → titulares
  const obraMap = new Map<string, { titulo: string; codigo: string; links: Map<string, typeof items> }>()
  for (const item of items) {
    const obraId = item.obra_id ?? 'sem-obra'
    if (!obraMap.has(obraId)) obraMap.set(obraId, { titulo: item._obra_titulo ?? '—', codigo: item._obra_codigo ?? '—', links: new Map() })
    const obra = obraMap.get(obraId)!
    const linkId = item.link_id ?? 'sem-link'
    if (!obra.links.has(linkId)) obra.links.set(linkId, [])
    obra.links.get(linkId)!.push(item)
  }

  return (
    <div className="space-y-3">
      {Array.from(obraMap.entries()).map(([obraId, obra]) => {
        const obraExpanded = expandedObras.has(obraId)
        const obraTotal = Array.from(obra.links.values()).flat().reduce((s, i) => s + i.valor_liquido, 0)
        return (
          <div key={obraId} className="rounded-xl border border-white/10 bg-white/5">
            <button
              onClick={() => toggleObra(obraId)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 rounded-xl transition-colors"
            >
              <div>
                <p className="font-semibold text-white">{obra.titulo}</p>
                <p className="text-xs text-slate-500">{obra.codigo} · {obra.links.size} link(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-emerald-300">{fmtBRL(obraTotal)}</span>
                {obraExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {obraExpanded && (
              <div className="border-t border-white/10 divide-y divide-white/5">
                {Array.from(obra.links.entries()).map(([linkId, titulares]) => {
                  const linkExpanded = expandedLinks.has(linkId)
                  const linkTotal = titulares.reduce((s, i) => s + i.valor_liquido, 0)
                  const desc = titulares[0]?._link_descricao ?? linkId
                  return (
                    <div key={linkId}>
                      <button
                        onClick={() => toggleLink(linkId)}
                        className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-violet-500/50" />
                          <span className="text-sm text-slate-300">{desc}</span>
                          <span className="text-xs text-slate-500">({titulares.length} titular(es))</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-emerald-300">{fmtBRL(linkTotal)}</span>
                          {linkExpanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
                        </div>
                      </button>

                      {linkExpanded && (
                        <div className="px-8 pb-3 space-y-2">
                          {titulares.map((item) => {
                            const isPJ = item._titular_tipo_pessoa === 'PJ'
                            return (
                              <div key={item.id} className="rounded-lg border border-white/5 bg-white/5 p-3 flex flex-wrap items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500/20 text-xs font-bold text-violet-300 flex-shrink-0">
                                  {initials(item._titular_nome ?? '?')}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-white font-medium">{item._titular_nome}</p>
                                  <p className="text-xs text-slate-500">{item.percentual_aplicado}% · {item._obra_titulo}</p>
                                </div>
                                <TipoBadge tipo={item.tipo_destino} />
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                                  isPJ
                                    ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                }`}>
                                  {isPJ ? 'PJ' : 'PF'}
                                </span>
                                <div className="text-right">
                                  <p className="text-xs text-slate-500">Bruto: {fmtBRL(item.valor_bruto)}</p>
                                  <p className="text-sm font-bold text-emerald-300">Liq: {fmtBRL(item.valor_liquido)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DistribuicaoDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? ''

  const dist = MOCK_DISTRIBUICOES.find((d) => d.id === id) ?? DIST_BACKOFFICE_Q1_EXECUTADA

  const [activeTab, setActiveTab] = useState<Tab>('Resumo')
  const [approvalResult, setApprovalResult] = useState<'aprovado' | 'rejeitado' | null>(null)

  const items = dist._itens ?? []
  const allRetencoes = items.flatMap((i) => (i._retencoes ?? []).map((r) => ({ ...r, _titular_nome: i._titular_nome })))
  const allRecoupment = items.flatMap((i) => (i._recoupment ?? []).map((r) => ({ ...r, _titular_nome: i._titular_nome })))

  const totalBruto  = items.reduce((s, i) => s + i.valor_bruto, 0)
  const totalLiquido = items.reduce((s, i) => s + i.valor_liquido, 0)
  const totalRetencoes = allRetencoes.reduce((s, r) => s + r.valor, 0)
  const totalRecoupment = allRecoupment.reduce((s, r) => s + r.valor_abatido, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950/20 to-slate-950 p-6">
      <div className="mx-auto max-w-6xl space-y-6">

        {/* Back */}
        <Link href="/master/distribuicao" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-violet-300 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Voltar para Distribuicoes
        </Link>

        {/* Header */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
                <PieChart className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono">{dist.codigo}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                  <StatusBadge status={dist.status} />
                  <span>{dist.periodo}</span>
                  <span>·</span>
                  <span className="text-white font-semibold">{fmtBRL(dist.valor_total)}</span>
                  <span>·</span>
                  <span>{dist.total_titulares} titular(es)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
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
            </button>
          ))}
        </div>

        {/* ── Tab: Resumo ── */}
        {activeTab === 'Resumo' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <SummaryCard label="Total Bruto"   value={fmtBRL(totalBruto)}   color="text-white"       icon={<DollarSign className="h-4 w-4 text-slate-400" />} />
              <SummaryCard label="Retencoes"     value={fmtBRL(totalRetencoes)} color="text-red-300"  icon={<X className="h-4 w-4 text-red-400" />} />
              <SummaryCard label="Recoupment"    value={fmtBRL(totalRecoupment)} color="text-violet-300" icon={<TrendingUp className="h-4 w-4 text-violet-400" />} />
              <SummaryCard label="Total Liquido" value={fmtBRL(totalLiquido)} color="text-emerald-300" icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 grid grid-cols-2 gap-4 lg:grid-cols-3">
              {[
                { label: 'ID',             value: dist.id },
                { label: 'Codigo',         value: dist.codigo },
                { label: 'Periodo',        value: dist.periodo },
                { label: 'Conciliacao',    value: dist._conciliacao_periodo ?? (dist.conciliacao_id ?? '—') },
                { label: 'Calculado em',   value: fmt(dist.calculado_em) },
                { label: 'Aprovado em',    value: fmt(dist.aprovado_em) },
                { label: 'Executado em',   value: fmt(dist.executado_em) },
                { label: 'Aprovado por',   value: dist.aprovado_por ?? '—' },
                { label: 'Total Titulares', value: `${dist.total_titulares} titular(es)` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="text-sm text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Itens ── */}
        {activeTab === 'Itens' && <TabItens dist={dist} />}

        {/* ── Tab: Retencoes ── */}
        {activeTab === 'Retencoes' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Retencoes Aplicadas</h2>
            </div>
            {allRetencoes.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhuma retencao aplicada nesta distribuicao.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Titular</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Tipo</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Percentual</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {allRetencoes.map((ret) => (
                      <tr key={ret.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-white">{(ret as typeof ret & { _titular_nome?: string })._titular_nome ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-300">
                            {RETENCAO_TIPO_LABELS[ret.tipo]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">{ret.percentual}%</td>
                        <td className="px-4 py-3 text-right font-semibold text-red-300">- {fmtBRL(ret.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Recoupment ── */}
        {activeTab === 'Recoupment' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-semibold text-white">Recoupment Aplicado</h2>
            </div>
            {allRecoupment.length === 0 ? (
              <div className="p-8 text-center text-slate-500">Nenhum recoupment aplicado nesta distribuicao.</div>
            ) : (
              <div className="p-4 space-y-4">
                {allRecoupment.map((rec) => {
                  const anterior = rec._saldo_anterior ?? 0
                  const abatido  = rec.valor_abatido
                  const posterior = rec._saldo_posterior ?? 0
                  const pct = anterior > 0 ? Math.round((abatido / anterior) * 100) : 0
                  return (
                    <div key={rec.id} className="rounded-xl border border-violet-500/20 bg-violet-500/10 p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-white">{(rec as typeof rec & { _titular_nome?: string })._titular_nome ?? '—'}</p>
                          <p className="text-xs text-slate-400">Contrato: <span className="font-mono text-violet-300">{rec._contrato_numero}</span></p>
                        </div>
                        <span className="text-sm font-bold text-violet-300">- {fmtBRL(abatido)}</span>
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                          <span>Abatido desta distribuicao</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-700">
                          <div
                            className="h-2 rounded-full bg-violet-500 transition-all"
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Saldo Anterior</p>
                          <p className="font-semibold text-white">{fmtBRL(anterior)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Valor Abatido</p>
                          <p className="font-semibold text-red-300">- {fmtBRL(abatido)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Saldo Posterior</p>
                          <p className="font-semibold text-emerald-300">{fmtBRL(posterior)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Aprovacao ── */}
        {activeTab === 'Aprovacao' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <h2 className="font-semibold text-white mb-4">Aprovacao da Distribuicao</h2>

            {dist.status === 'aprovacao' && !approvalResult && (
              <div className="space-y-4">
                <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-4">
                  <p className="text-sm text-sky-300">
                    Esta distribuicao esta aguardando aprovacao. Revise os itens e clique em Aprovar ou Rejeitar.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setApprovalResult('aprovado')}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-6 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Aprovar Distribuicao
                  </button>
                  <button
                    onClick={() => setApprovalResult('rejeitado')}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-500/20 border border-red-500/40 px-6 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/30 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Rejeitar Distribuicao
                  </button>
                </div>
              </div>
            )}

            {dist.status === 'aprovacao' && approvalResult === 'aprovado' && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-300">Distribuicao aprovada com sucesso!</p>
                  <p className="text-sm text-slate-400 mt-1">Aprovado por: Admin em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            {dist.status === 'aprovacao' && approvalResult === 'rejeitado' && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 flex items-center gap-4">
                <XCircle className="h-10 w-10 text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-300">Distribuicao rejeitada.</p>
                  <p className="text-sm text-slate-400 mt-1">Rejeitada por: Admin em {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            {dist.status === 'executada' && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-6 flex items-center gap-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-300">Distribuicao executada</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Aprovado por: <span className="text-white">Edi Music</span> em {fmt(dist.aprovado_em)}
                  </p>
                </div>
              </div>
            )}

            {dist.status !== 'aprovacao' && dist.status !== 'executada' && !approvalResult && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center text-slate-500">
                Esta distribuicao nao esta aguardando aprovacao (status: {DISTRIBUICAO_STATUS_LABELS[dist.status]}).
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Logs ── */}
        {activeTab === 'Logs' && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
            <h2 className="font-semibold text-white mb-4">Historico de Eventos</h2>
            <div className="space-y-0">
              {MOCK_LOGS.map((log, idx) => (
                <div key={log.id} className="flex gap-4">
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
                    <p className="text-sm text-slate-300">{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

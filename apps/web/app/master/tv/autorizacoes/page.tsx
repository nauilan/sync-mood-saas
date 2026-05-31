'use client'

import { useState, useMemo } from 'react'
import {
  Shield, FileText, Eye, X, CheckCircle2, DollarSign, Users,
  Download,
} from 'lucide-react'
import { TV_AUTORIZACOES } from '@/lib/mock-tv'
import {
  TV_AUTORIZACAO_STATUS_LABELS,
  TV_AUTORIZACAO_STATUS_COLORS,
} from '@/lib/types-tv'
import type { TvAutorizacaoStatus } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

const ALL_TABS: Array<{ label: string; value: TvAutorizacaoStatus | 'todas' }> = [
  { label: 'Todas',     value: 'todas'     },
  { label: 'Calculada', value: 'calculada' },
  { label: 'Faturada',  value: 'faturada'  },
  { label: 'Paga',      value: 'paga'      },
  { label: 'Cancelada', value: 'cancelada' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AutorizacoesPage() {
  const [activeTab, setActiveTab] = useState<TvAutorizacaoStatus | 'todas'>('todas')
  const [toast, setToast]         = useState<string | null>(null)
  const [clausulaModal, setClausulaModal] = useState<{ codigo: string; text: string } | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function gerarPDF(codigo: string) {
    showToast(`PDF gerado: ${codigo}.pdf`)
  }

  // ── KPIs ──
  const totalAutorizacoes = TV_AUTORIZACOES.length
  const valorCalculadoTotal = TV_AUTORIZACOES.reduce((s, a) => s + a.valor_calculado, 0)
  const valorNegociadoTotal = TV_AUTORIZACOES.reduce((s, a) => s + (a.valor_negociado ?? 0), 0)
  const pagasCount          = TV_AUTORIZACOES.filter(a => a.status === 'paga').length

  // ── Filtering ──
  const filtered = useMemo(() =>
    activeTab === 'todas'
      ? TV_AUTORIZACOES
      : TV_AUTORIZACOES.filter(a => a.status === activeTab),
    [activeTab]
  )

  const kpis = [
    { label: 'Total autorizações',   value: String(totalAutorizacoes),        icon: Shield,    color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Valor calculado',      value: formatBRL(valorCalculadoTotal),   icon: DollarSign,color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Valor negociado',      value: formatBRL(valorNegociadoTotal),   icon: DollarSign,color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20' },
    { label: 'Pagas',                value: String(pagasCount),               icon: Users,     color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  ]

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <Shield className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Autorizações TV</h1>
          <p className="text-sm text-white/40">Gestão de autorizações audiovisuais com cláusulas contratuais</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon
          return (
            <div key={kpi.label} className={`rounded-2xl border p-4 ${kpi.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-white/40">{kpi.label}</p>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className={`text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          )
        })}
      </div>

      {/* ── Status tabs ── */}
      <div className="flex flex-wrap gap-1 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        {ALL_TABS.map(tab => {
          const count = tab.value === 'todas'
            ? TV_AUTORIZACOES.length
            : TV_AUTORIZACOES.filter(a => a.status === tab.value).length
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.value
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-white/5 text-white/30'
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {['Código', 'Obra', 'Emissora', '% Controlado', 'Valor Calc.', 'Valor Negoc.', 'Status', 'Vigência', 'Ações'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(auth => (
                <tr key={auth.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* Código */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono text-violet-300">{auth.codigo}</span>
                  </td>

                  {/* Obra */}
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-white truncate max-w-[160px]">{auth._obra_titulo}</p>
                      {/* Cláusula preview */}
                      <p className="text-[10px] text-amber-400/70 truncate max-w-[200px] mt-0.5">
                        {auth.clausula_percentual_controlado_text.slice(0, 80)}…
                      </p>
                    </div>
                  </td>

                  {/* Emissora (from execucao — mock from codigo) */}
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-semibold text-white/60">Globo</span>
                  </td>

                  {/* % Controlado */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${auth.percentual_controlado}%` }}
                        />
                      </div>
                      <span className="text-xs text-violet-300 font-semibold tabular-nums">{auth.percentual_controlado}%</span>
                    </div>
                  </td>

                  {/* Valor calc */}
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-bold text-white tabular-nums">{formatBRL(auth.valor_calculado)}</span>
                  </td>

                  {/* Valor negociado */}
                  <td className="px-4 py-3.5">
                    {auth.valor_negociado != null
                      ? <span className="text-sm font-bold text-emerald-400 tabular-nums">{formatBRL(auth.valor_negociado)}</span>
                      : <span className="text-xs text-white/20">—</span>
                    }
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${TV_AUTORIZACAO_STATUS_COLORS[auth.status]}`}>
                      {TV_AUTORIZACAO_STATUS_LABELS[auth.status]}
                    </span>
                  </td>

                  {/* Vigência */}
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-white/50 tabular-nums">{formatDate(auth.prazo_inicio)}</span>
                      <span className="text-[10px] text-white/30 tabular-nums">{formatDate(auth.prazo_fim)}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1">
                      <button
                        onClick={() => gerarPDF(auth.codigo)}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 hover:text-emerald-300 hover:border-emerald-500/30 transition-colors"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => setClausulaModal({ codigo: auth.codigo, text: auth.clausula_percentual_controlado_text })}
                        className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-[10px] text-white/50 hover:text-amber-300 hover:border-amber-500/30 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Cláusula
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <Shield className="w-8 h-8" />
            <p className="text-sm">Nenhuma autorização nessa categoria</p>
          </div>
        )}

        {/* Table footer */}
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-xs text-white/30">
            <span><span className="text-white/60 font-semibold">{filtered.length}</span> autorizações</span>
            <span>·</span>
            <span>Total calculado: <span className="text-white/60 font-semibold tabular-nums">
              {formatBRL(filtered.reduce((s, a) => s + a.valor_calculado, 0))}
            </span></span>
            <span>·</span>
            <span>Total negociado: <span className="text-emerald-400 font-semibold tabular-nums">
              {formatBRL(filtered.reduce((s, a) => s + (a.valor_negociado ?? 0), 0))}
            </span></span>
          </div>
        )}
      </div>

      {/* ── Clausula Modal ── */}
      {clausulaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Cláusula Contratual</h2>
                  <p className="text-[10px] text-white/30 font-mono">{clausulaModal.codigo}</p>
                </div>
              </div>
              <button onClick={() => setClausulaModal(null)} className="text-white/30 hover:text-white/70 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-6">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <p className="text-sm text-white/70 leading-relaxed">{clausulaModal.text}</p>
              </div>
            </div>
            <div className="px-6 pb-5">
              <button
                onClick={() => setClausulaModal(null)}
                className="w-full h-10 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

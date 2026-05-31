'use client'

import { useState, useMemo } from 'react'
import { DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react'
import { TV_AUTORIZACOES } from '@/lib/mock-tv'
import {
  TV_AUTORIZACAO_STATUS_LABELS,
  TV_AUTORIZACAO_STATUS_COLORS,
} from '@/lib/types-tv'
import type { TvAutorizacao, TvAutorizacaoStatus } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ── Column config ─────────────────────────────────────────────────────────────

type KanbanColumn = {
  key: TvAutorizacaoStatus
  label: string
  accent: string
  headerBg: string
  cardBorder: string
  nextLabel?: string
  nextStatus?: TvAutorizacaoStatus
}

const COLUMNS: KanbanColumn[] = [
  {
    key:        'calculada',
    label:      'Calculadas',
    accent:     'text-amber-400',
    headerBg:   'bg-amber-500/10 border-amber-500/20',
    cardBorder: 'border-amber-500/15',
    nextLabel:  'Mover para Faturada',
    nextStatus: 'faturada',
  },
  {
    key:        'faturada',
    label:      'Faturadas',
    accent:     'text-sky-400',
    headerBg:   'bg-sky-500/10 border-sky-500/20',
    cardBorder: 'border-sky-500/15',
    nextLabel:  'Mover para Paga',
    nextStatus: 'paga',
  },
  {
    key:        'paga',
    label:      'Pagas',
    accent:     'text-emerald-400',
    headerBg:   'bg-emerald-500/10 border-emerald-500/20',
    cardBorder: 'border-emerald-500/15',
  },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function CobrancaPage() {
  // Local state to track mocked status overrides
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TvAutorizacaoStatus>>({})
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function moveCard(id: string, to: TvAutorizacaoStatus) {
    setStatusOverrides(prev => ({ ...prev, [id]: to }))
    showToast(`Autorização movida para "${TV_AUTORIZACAO_STATUS_LABELS[to]}"`)
  }

  // Merge original data with overrides
  const enriched: TvAutorizacao[] = useMemo(
    () => TV_AUTORIZACOES.map(a => ({
      ...a,
      status: (statusOverrides[a.id] as TvAutorizacaoStatus) ?? a.status,
    })),
    [statusOverrides]
  )

  function columnCards(status: TvAutorizacaoStatus) {
    return enriched.filter(a => a.status === status)
  }

  function columnTotal(status: TvAutorizacaoStatus) {
    return columnCards(status).reduce((s, a) => s + a.valor_calculado, 0)
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <DollarSign className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Cobrança TV</h1>
          <p className="text-sm text-white/40">Pipeline de Cobrança Audiovisual</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {toast}
        </div>
      )}

      {/* ── Kanban board ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(col => {
          const cards = columnCards(col.key)
          const total = columnTotal(col.key)

          return (
            <div key={col.key} className="flex flex-col gap-3">
              {/* Column header */}
              <div className={`rounded-xl border p-3.5 ${col.headerBg}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${col.accent}`}>{col.label}</span>
                  <span className={`text-xs tabular-nums font-semibold px-2 py-0.5 rounded-full bg-white/10 ${col.accent}`}>
                    {cards.length}
                  </span>
                </div>
                <p className={`text-xs tabular-nums font-semibold ${col.accent}`}>
                  {formatBRL(total)}
                </p>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5 min-h-[120px]">
                {cards.length === 0 && (
                  <div className="flex items-center justify-center h-20 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08]">
                    <p className="text-xs text-white/20">Sem autorizações</p>
                  </div>
                )}

                {cards.map(auth => (
                  <KanbanCard
                    key={auth.id}
                    auth={auth}
                    column={col}
                    onMove={col.nextStatus ? () => moveCard(auth.id, col.nextStatus!) : undefined}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Kanban Card ───────────────────────────────────────────────────────────────

interface KanbanCardProps {
  auth: TvAutorizacao
  column: KanbanColumn
  onMove?: () => void
}

function KanbanCard({ auth, column, onMove }: KanbanCardProps) {
  return (
    <div className={`bg-white/5 border rounded-xl p-4 space-y-3 hover:bg-white/[0.07] transition-colors ${column.cardBorder}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-mono text-violet-300">{auth.codigo}</p>
          <p className="text-sm font-bold text-white mt-0.5 leading-tight">{auth._obra_titulo}</p>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${TV_AUTORIZACAO_STATUS_COLORS[auth.status]}`}>
          {TV_AUTORIZACAO_STATUS_LABELS[auth.status]}
        </span>
      </div>

      {/* Emissora chip */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/30">Emissora</span>
        <span className="text-xs font-semibold text-white/60">Globo</span>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Calculado</p>
          <p className="text-xs font-bold text-white tabular-nums">{formatBRL(auth.valor_calculado)}</p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 mb-0.5">Negociado</p>
          <p className={`text-xs font-bold tabular-nums ${auth.valor_negociado != null ? 'text-emerald-400' : 'text-white/25'}`}>
            {auth.valor_negociado != null ? formatBRL(auth.valor_negociado) : '—'}
          </p>
        </div>
      </div>

      {/* Percentual bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-white/30">% Controlado</span>
          <span className="text-[10px] font-semibold text-violet-300 tabular-nums">{auth.percentual_controlado}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
            style={{ width: `${auth.percentual_controlado}%` }}
          />
        </div>
      </div>

      {/* Move button */}
      {onMove && (
        <button
          onClick={onMove}
          className={`w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
            column.key === 'calculada'
              ? 'bg-sky-600/15 border-sky-500/25 text-sky-300 hover:bg-sky-600/25'
              : 'bg-emerald-600/15 border-emerald-500/25 text-emerald-300 hover:bg-emerald-600/25'
          }`}
        >
          {column.nextLabel} <ArrowRight className="w-3 h-3" />
        </button>
      )}

      {/* Paga state label */}
      {column.key === 'paga' && (
        <div className="flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-400 font-semibold">Pagamento confirmado</span>
        </div>
      )}
    </div>
  )
}

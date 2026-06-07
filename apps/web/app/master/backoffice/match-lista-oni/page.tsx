'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Target, FileDown, Plus, ChevronRight, CheckCircle2,
  Clock, RefreshCw, Eye, Download, Send, TrendingUp,
} from 'lucide-react'
import {
  MOCK_ONI_LISTS,
  KPI_ONI,
  getIdentificacaoByLista,
} from '@/lib/mock-oni'
import {
  ONI_LIST_STATUS_LABELS,
  ONI_LIST_STATUS_COLORS,
} from '@/lib/types-oni'

type StatusOni =
  | 'importada'
  | 'possivel_match'
  | 'em_analise'
  | 'confirmada'
  | 'enviada_backoffice'
  | 'aceita_backoffice'

const STATUS_ONI_LABELS: Record<StatusOni, string> = {
  importada:          'Importada',
  possivel_match:     'Possivel Match',
  em_analise:         'Em Analise',
  confirmada:         'Confirmada',
  enviada_backoffice: 'Enviada BO',
  aceita_backoffice:  'Aceita BO',
}

const STATUS_ONI_COLORS: Record<StatusOni, string> = {
  importada:          'text-white/50   bg-white/[0.05]   border-white/10',
  possivel_match:     'text-sky-400    bg-sky-500/10     border-sky-500/30',
  em_analise:         'text-amber-400  bg-amber-500/10   border-amber-500/30',
  confirmada:         'text-violet-400 bg-violet-500/10  border-violet-500/30',
  enviada_backoffice: 'text-orange-400 bg-orange-500/10  border-orange-500/30',
  aceita_backoffice:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
}

// Distribui status_oni para os mocks existentes
function getStatusOni(listaId: string): StatusOni {
  const map: Record<string, StatusOni> = {
    '1': 'aceita_backoffice',
    '2': 'enviada_backoffice',
    '3': 'confirmada',
    '4': 'em_analise',
    '5': 'possivel_match',
  }
  return map[listaId] ?? 'importada'
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d)
}

function formatDataLista(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

export default function MatchListaONIPage() {
  const stats = useMemo(() => {
    return { totalRoyalties: 'R$ 42.000+' }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="ONI — Obras Nao Identificadas"
        description="Cruzamento entre as listas semanais do BackOffice e o catalogo. Cada ONI resolvida pode liberar royalties retidos."
      />

      {/* Action bar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-white/40">
          Envie a identificacao CSV ao BackOffice em ate 48h para liberar os royalties retidos.
        </p>
        <Link
          href="/master/backoffice/match-lista-oni/import"
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Importar Nova Lista ONI
        </Link>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Listas Processadas',
            value: KPI_ONI.listas_processadas,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Matches Confirmados',
            value: KPI_ONI.matches_confirmados,
            icon: Target,
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
          },
          {
            label: 'Royalties Est. Liberados',
            value: stats.totalRoyalties,
            icon: TrendingUp,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Listas Pendentes',
            value: KPI_ONI.listas_pendentes,
            icon: Clock,
            color: 'text-sky-400',
            bg: 'bg-sky-500/10',
          },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <div className={`${kpi.bg} rounded-lg p-2`}>
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <p className="text-[11px] text-white/35 leading-tight">{kpi.label}</p>
            </div>
            <p className={`text-2xl font-bold ${kpi.color} leading-none`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Status ONI pipeline */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Fluxo de Status ONI
        </p>
        <div className="flex items-center gap-1 flex-wrap">
          {(Object.keys(STATUS_ONI_LABELS) as StatusOni[]).map((s, idx, arr) => (
            <div key={s} className="flex items-center gap-1">
              <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full border ${STATUS_ONI_COLORS[s]}`}>
                {STATUS_ONI_LABELS[s]}
              </span>
              {idx < arr.length - 1 && (
                <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Listas table */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Listas ONI Processadas
        </p>

        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_110px_90px_100px_100px_160px_160px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
            {['Arquivo', 'Data Lista', 'Total ONIs', 'Matches', 'Confirmados', 'Status Lista', 'Status ONI'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {MOCK_ONI_LISTS.length === 0 && (
            <div className="px-4 py-10 text-center text-white/30 text-sm">
              Nenhuma lista importada ainda.
            </div>
          )}

          {MOCK_ONI_LISTS.map((lista, idx) => {
            const statusOni = getStatusOni(lista.id)
            return (
              <div
                key={lista.id}
                className={`grid grid-cols-[1fr_110px_90px_100px_100px_160px_160px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${
                  idx < MOCK_ONI_LISTS.length - 1 ? 'border-b border-white/[0.03]' : ''
                }`}
              >
                {/* Arquivo */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{lista.filename}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    Processado: {formatDate(lista.processed_at)}
                  </p>
                </div>

                {/* Data Lista */}
                <p className="text-sm text-white/60 font-mono">
                  {formatDataLista(lista.data_lista)}
                </p>

                {/* Total ONIs */}
                <p className="text-sm text-white/60">
                  {lista.total_onis.toLocaleString('pt-BR')}
                </p>

                {/* Matches */}
                <p className="text-sm text-violet-400 font-semibold">
                  {lista.matches_count}
                </p>

                {/* Confirmados */}
                <p className="text-sm text-emerald-400 font-semibold">
                  {lista.aprovados_count}
                </p>

                {/* Status Lista */}
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ONI_LIST_STATUS_COLORS[lista.status]}`}>
                  {ONI_LIST_STATUS_LABELS[lista.status]}
                </span>

                {/* Status ONI — 6 estados */}
                <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_ONI_COLORS[statusOni]}`}>
                  {STATUS_ONI_LABELS[statusOni]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Actions below table */}
        <div className="mt-3 space-y-2">
          {MOCK_ONI_LISTS.map(lista => {
            const ident = getIdentificacaoByLista(lista.id)
            const statusOni = getStatusOni(lista.id)
            return (
              <div
                key={lista.id + '-actions'}
                className="flex items-center gap-2 justify-end"
              >
                <span className="text-[11px] text-white/25 mr-auto truncate">{lista.filename}</span>
                <Link
                  href={`/master/backoffice/match-lista-oni/${lista.id}/revisar`}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                >
                  <Eye className="w-3 h-3" /> Ver detalhes
                </Link>
                <Link
                  href={`/master/backoffice/match-lista-oni/${lista.id}/exportar`}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-lg border text-[11px] transition-colors ${
                    statusOni === 'confirmada' || statusOni === 'enviada_backoffice' || statusOni === 'aceita_backoffice'
                      ? 'bg-violet-600/20 border-violet-500/30 text-violet-300 hover:bg-violet-600/30'
                      : 'bg-white/[0.04] border-white/[0.06] text-white/40 cursor-not-allowed opacity-50'
                  }`}
                >
                  <Download className="w-3 h-3" /> Exportar CSV
                </Link>
                {statusOni === 'confirmada' && (
                  <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-orange-600/20 border border-orange-500/30 text-[11px] text-orange-300 hover:bg-orange-600/30 transition-colors">
                    <Send className="w-3 h-3" /> Enviar BO
                  </button>
                )}
                <button className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors">
                  <RefreshCw className="w-3 h-3" /> Reprocessar
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Help box */}
      <div className="bg-sky-500/[0.06] border border-sky-500/20 rounded-xl p-4">
        <p className="text-[11px] font-semibold text-sky-400 mb-1">Como funciona</p>
        <ol className="text-[11px] text-white/40 space-y-0.5 list-decimal list-inside">
          <li>Importe a lista XLSX semanal disponibilizada pelo BackOffice.</li>
          <li>O sistema cruza automaticamente com o catalogo por titulo, autor, interprete e ISRC.</li>
          <li>Revise os matches por nivel de confianca (Alta / Media / Baixa) e aprove ou rejeite.</li>
          <li>Status avanca: importada → possivel_match → em_analise → confirmada.</li>
          <li>Exporte o CSV de identificacao (ONI_CODE + SUBMITTER_SONGCODE) e envie ao BackOffice.</li>
          <li>Status final: enviada_backoffice → aceita_backoffice. Royalties liberados em ate 48h.</li>
        </ol>
      </div>
    </div>
  )
}

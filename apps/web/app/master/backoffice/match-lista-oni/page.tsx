'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Target, FileDown, Plus, ChevronRight, CheckCircle2,
  Clock, RefreshCw, Eye, Download,
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
    const totalRoyalties = '$42,000+'
    return { totalRoyalties }
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Match Lista ONI"
        description="Identificacao de Obras Nao Identificadas — cruzamento entre as listas semanais do BackOffice e o catalogo da editora para liberacao de royalties retidos."
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

      {/* KPI Cards */}
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
            icon: FileDown,
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

      {/* Listas table */}
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-3">
          Listas ONI Processadas
        </p>

        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_110px_90px_100px_100px_130px] gap-2 px-4 py-2.5 border-b border-white/[0.05]">
            {['Arquivo', 'Data Lista', 'Total ONIs', 'Matches', 'Confirmados', 'Status'].map(h => (
              <p key={h} className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {MOCK_ONI_LISTS.length === 0 && (
            <div className="px-4 py-10 text-center text-white/30 text-sm">
              Nenhuma lista importada ainda.
            </div>
          )}

          {MOCK_ONI_LISTS.map((lista, idx) => {
            const ident = getIdentificacaoByLista(lista.id)
            return (
              <div
                key={lista.id}
                className={`grid grid-cols-[1fr_110px_90px_100px_100px_130px] gap-2 px-4 py-3 items-center hover:bg-white/[0.02] transition-colors ${
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

                {/* Status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ONI_LIST_STATUS_COLORS[lista.status]}`}
                  >
                    {ONI_LIST_STATUS_LABELS[lista.status]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions below table */}
        <div className="mt-3 space-y-2">
          {MOCK_ONI_LISTS.map(lista => {
            const ident = getIdentificacaoByLista(lista.id)
            return (
              <div
                key={lista.id + '-actions'}
                className="flex items-center gap-2 justify-end"
              >
                <span className="text-[11px] text-white/25 mr-auto">{lista.filename}</span>
                <Link
                  href={`/master/backoffice/match-lista-oni/${lista.id}/revisar`}
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                >
                  <Eye className="w-3 h-3" /> Ver detalhes
                </Link>
                {lista.status === 'exportado' && ident ? (
                  <Link
                    href={`/master/backoffice/match-lista-oni/${lista.id}/exportar`}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-violet-600/20 border border-violet-500/30 text-[11px] text-violet-300 hover:bg-violet-600/30 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Exportar CSV
                  </Link>
                ) : (
                  <Link
                    href={`/master/backoffice/match-lista-oni/${lista.id}/exportar`}
                    className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-[11px] text-emerald-300 hover:bg-emerald-600/30 transition-colors"
                  >
                    <Download className="w-3 h-3" /> Exportar CSV
                  </Link>
                )}
                <button
                  className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-white/60 hover:text-white/80 hover:bg-white/[0.08] transition-colors"
                >
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
          <li>O sistema cruza automaticamente com o catalogo da editora por titulo, autor, interprete e ISRC.</li>
          <li>Revise os matches por nivel de confianca (Alta / Media / Baixa) e aprove ou rejeite.</li>
          <li>Exporte o CSV de identificacao (ONI_CODE + SUBMITTER_SONGCODE).</li>
          <li>Envie o CSV ao BackOffice via FTP → INBOX FILES → Process File → tipo ONI IDENTIFICATIONS (CSV).</li>
          <li>O dinheiro retido e liberado em ate 48 horas uteis.</li>
        </ol>
      </div>
    </div>
  )
}

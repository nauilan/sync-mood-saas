'use client'

import { useState, useMemo, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  CheckCircle2, XCircle, Search, Filter, ChevronDown, ChevronUp,
  Download, AlertCircle, Eye,
} from 'lucide-react'
import {
  getMatchesByLista,
  getListaById,
} from '@/lib/mock-oni'
import {
  ONI_CONFIDENCE_LABELS,
  ONI_CONFIDENCE_COLORS,
  ONI_MATCH_STATUS_LABELS,
  ONI_MATCH_STATUS_COLORS,
  ONI_CRITERIO_LABELS,
} from '@/lib/types-oni'
import type { ONIMatch, ONIMatchConfidence, ONIMatchStatus } from '@/lib/types-oni'

type TabKey = 'alta' | 'media' | 'baixa' | 'sem_match' | 'aprovados' | 'rejeitados'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'alta', label: 'Alta confianca' },
  { key: 'media', label: 'Media' },
  { key: 'baixa', label: 'Baixa' },
  { key: 'sem_match', label: 'Sem match' },
  { key: 'aprovados', label: 'Aprovados' },
  { key: 'rejeitados', label: 'Rejeitados' },
]

function filterByTab(matches: ONIMatch[], tab: TabKey): ONIMatch[] {
  switch (tab) {
    case 'alta':       return matches.filter(m => m.confidence === 'alta' && m.status === 'pendente')
    case 'media':      return matches.filter(m => m.confidence === 'media' && m.status === 'pendente')
    case 'baixa':      return matches.filter(m => m.confidence === 'baixa' && m.status === 'pendente')
    case 'sem_match':  return matches.filter(m => m.obra_id === null && m.status !== 'aprovado' && m.status !== 'rejeitado')
    case 'aprovados':  return matches.filter(m => m.status === 'aprovado')
    case 'rejeitados': return matches.filter(m => m.status === 'rejeitado')
  }
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100)
  const color =
    pct >= 85 ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' :
    pct >= 65 ? 'text-amber-400 bg-amber-500/15 border-amber-500/30' :
                'text-rose-400 bg-rose-500/15 border-rose-500/30'
  return (
    <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}%
    </span>
  )
}

function MatchRow({ match, onApprove, onReject }: {
  match: ONIMatch
  onApprove: (id: string) => void
  onReject: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        {/* ONI_CODE */}
        <td className="px-4 py-3">
          <p className="font-mono text-[11px] text-white/50">{match.oni_code}</p>
        </td>

        {/* Titulos */}
        <td className="px-4 py-3 max-w-[180px]">
          <p className="text-xs text-white/70 truncate" title={match.oni_title}>{match.oni_title}</p>
          {match.obra_titulo && (
            <p className="text-[10px] text-violet-400 mt-0.5 truncate">= {match.obra_titulo}</p>
          )}
        </td>

        {/* Performer / Interpretes */}
        <td className="px-4 py-3 max-w-[130px]">
          <p className="text-xs text-white/55 truncate">{match.oni_performer}</p>
          {match.obra_interpretes && (
            <p className="text-[10px] text-violet-400 mt-0.5 truncate">= {match.obra_interpretes}</p>
          )}
        </td>

        {/* Writers / Autores */}
        <td className="px-4 py-3 max-w-[150px]">
          <p className="text-xs text-white/55 truncate">{match.oni_writers.replace(/\|/g, ', ')}</p>
          {match.obra_autores && (
            <p className="text-[10px] text-violet-400 mt-0.5 truncate">= {match.obra_autores}</p>
          )}
        </td>

        {/* ISRC */}
        <td className="px-4 py-3">
          <p className="font-mono text-[10px] text-white/35">{match.oni_isrc ?? '—'}</p>
        </td>

        {/* Score */}
        <td className="px-4 py-3">
          {match.obra_id ? <ScoreBadge score={match.score} /> : <span className="text-[10px] text-white/25">—</span>}
        </td>

        {/* Criterios */}
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {match.criterios_matched.map(c => (
              <span
                key={c}
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-white/40"
              >
                {ONI_CRITERIO_LABELS[c]}
              </span>
            ))}
            {match.criterios_matched.length === 0 && (
              <span className="text-[10px] text-white/20">—</span>
            )}
          </div>
        </td>

        {/* Royalty Spotify */}
        <td className="px-4 py-3 max-w-[130px]">
          <p className="text-[10px] text-emerald-400 truncate">{match.oni_royalty_spotify}</p>
        </td>

        {/* Acoes */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5">
            {match.status === 'pendente' || match.status === 'manual_review' ? (
              <>
                <button
                  onClick={() => onApprove(match.id)}
                  className="h-6 w-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 flex items-center justify-center transition-colors"
                  title="Aprovar"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onReject(match.id)}
                  className="h-6 w-6 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center transition-colors"
                  title="Rejeitar"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
                <button
                  className="h-6 px-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[10px] text-white/40 hover:text-white/60 transition-colors"
                  title="Busca manual"
                >
                  <Search className="w-3 h-3" />
                </button>
              </>
            ) : (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ONI_MATCH_STATUS_COLORS[match.status]}`}
              >
                {ONI_MATCH_STATUS_LABELS[match.status]}
              </span>
            )}
          </div>
        </td>

        {/* Expand */}
        <td className="px-2 py-3 text-white/20">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-white/[0.015]">
          <td colSpan={10} className="px-6 py-3">
            <div className="grid grid-cols-3 gap-4 text-[11px]">
              <div>
                <p className="text-white/25 font-semibold mb-1">ONI XLSX</p>
                <p><span className="text-white/35">Code:</span> <span className="font-mono text-white/60">{match.oni_code}</span></p>
                <p><span className="text-white/35">Title:</span> <span className="text-white/60">{match.oni_title}</span></p>
                <p><span className="text-white/35">Performer:</span> <span className="text-white/60">{match.oni_performer}</span></p>
                <p><span className="text-white/35">Writers:</span> <span className="text-white/60">{match.oni_writers}</span></p>
                <p><span className="text-white/35">First date:</span> <span className="text-white/60">{match.oni_first_date}</span></p>
                <p><span className="text-white/35">Claimed:</span> <span className="text-white/60">{match.oni_claimed ?? 'N'}</span></p>
              </div>
              <div>
                <p className="text-white/25 font-semibold mb-1">CATALOGO</p>
                {match.obra_id ? (
                  <>
                    <p><span className="text-white/35">Codigo:</span> <span className="font-mono text-violet-400">{match.obra_codigo}</span></p>
                    <p><span className="text-white/35">Titulo:</span> <span className="text-white/60">{match.obra_titulo}</span></p>
                    <p><span className="text-white/35">Interpretes:</span> <span className="text-white/60">{match.obra_interpretes ?? '—'}</span></p>
                    <p><span className="text-white/35">Autores:</span> <span className="text-white/60">{match.obra_autores ?? '—'}</span></p>
                    <p><span className="text-white/35">ISRC:</span> <span className="font-mono text-white/60">{match.obra_isrc ?? '—'}</span></p>
                  </>
                ) : (
                  <p className="text-white/25 italic">Sem match no catalogo</p>
                )}
              </div>
              <div>
                <p className="text-white/25 font-semibold mb-1">ROYALTIES</p>
                <p><span className="text-white/35">Spotify:</span> <span className="text-emerald-400">{match.oni_royalty_spotify}</span></p>
                <p><span className="text-white/35">YouTube:</span> <span className="text-sky-400">{match.oni_royalty_youtube}</span></p>
                <p><span className="text-white/35">Others:</span> <span className="text-amber-400">{match.oni_royalty_others}</span></p>
                <p className="mt-2">
                  <span className="text-white/35">Score: </span>
                  <span className="font-bold text-white/70">{(match.score * 100).toFixed(1)}%</span>
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {match.criterios_matched.map(c => (
                    <span
                      key={c}
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400"
                    >
                      {ONI_CRITERIO_LABELS[c]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function RevisarContent() {
  const params = useParams()
  const listaId = params.id as string

  const lista = getListaById(listaId)
  const allMatches = useMemo(() => getMatchesByLista(listaId), [listaId])

  const [tab, setTab] = useState<TabKey>('alta')
  const [statuses, setStatuses] = useState<Record<string, ONIMatchStatus>>({})

  const resolvedMatches = useMemo(() =>
    allMatches.map(m => ({ ...m, status: statuses[m.id] ?? m.status })),
    [allMatches, statuses]
  )

  const tabMatches = useMemo(() => filterByTab(resolvedMatches, tab), [resolvedMatches, tab])

  const tabCounts = useMemo(() => {
    const r: Record<TabKey, number> = {
      alta: 0, media: 0, baixa: 0, sem_match: 0, aprovados: 0, rejeitados: 0,
    }
    for (const tab of Object.keys(r) as TabKey[]) {
      r[tab] = filterByTab(resolvedMatches, tab).length
    }
    return r
  }, [resolvedMatches])

  const aprovados = useMemo(() => resolvedMatches.filter(m => m.status === 'aprovado'), [resolvedMatches])

  function approve(id: string) {
    setStatuses(s => ({ ...s, [id]: 'aprovado' }))
  }
  function reject(id: string) {
    setStatuses(s => ({ ...s, [id]: 'rejeitado' }))
  }
  function approveAll() {
    const ids = tabMatches.map(m => m.id)
    setStatuses(s => {
      const next = { ...s }
      ids.forEach(id => { next[id] = 'aprovado' })
      return next
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Revisar Matches — ${lista?.filename ?? listaId}`}
        description={`${allMatches.length} matches processados. Aprove ou rejeite cada match antes de exportar o CSV.`}
      />

      {/* Bulk action bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-white/40">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{aprovados.length} aprovados de {allMatches.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={approveAll}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-[12px] text-emerald-300 hover:bg-emerald-600/30 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Aprovar todas ({tabCounts[tab]})
          </button>
          {aprovados.length > 0 && (
            <Link
              href={`/master/backoffice/match-lista-oni/${listaId}/exportar`}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-[12px] text-white font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV ({aprovados.length})
            </Link>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-white/[0.06] pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 h-9 px-4 text-[12px] font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'text-violet-400 border-violet-500'
                : 'text-white/35 border-transparent hover:text-white/60'
            }`}
          >
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              tab === t.key ? 'bg-violet-500/25 text-violet-300' : 'bg-white/[0.05] text-white/30'
            }`}>
              {tabCounts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-auto">
        {tabMatches.length === 0 ? (
          <div className="py-12 text-center text-white/25 text-sm">
            Nenhum match nesta categoria.
          </div>
        ) : (
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['ONI_CODE', 'Titulo', 'Performer', 'Writers', 'ISRC', 'Score', 'Criterios', 'Royalty Spotify', 'Acoes', ''].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold text-white/25 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tabMatches.map(m => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onApprove={approve}
                  onReject={reject}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default function RevisarPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-sm p-6">Carregando...</div>}>
      <RevisarContent />
    </Suspense>
  )
}

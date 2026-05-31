'use client'

import { useState, useMemo } from 'react'
import {
  Search, X, CheckCircle2, AlertTriangle, Activity,
  Filter, Check,
} from 'lucide-react'
import { TV_EXECUCOES, TV_MATCHINGS } from '@/lib/mock-tv'
import {
  TV_TIPO_USO_LABELS, TV_TIPO_USO_COLORS,
  TV_MATCHING_STATUS_LABELS, TV_MATCHING_STATUS_COLORS,
} from '@/lib/types-tv'
import type { TvTipoUso, TvMatchingStatus } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function formatDuracao(seg: number) {
  if (seg < 60) return `${seg}s`
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

// ── Build joined data ──────────────────────────────────────────────────────────

const EXECUCOES_WITH_MATCHING = TV_EXECUCOES.map(exec => ({
  ...exec,
  _matching: TV_MATCHINGS.find(m => m.execucao_id === exec.id) ?? null,
}))

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ExecucoesPage() {
  const [search, setSearch]               = useState('')
  const [filterTipoUso, setFilterTipoUso] = useState<TvTipoUso | ''>('')
  const [filterEmissora, setFilterEmissora] = useState('')
  const [filterPrograma, setFilterPrograma] = useState('')
  const [filterStatus, setFilterStatus]   = useState<TvMatchingStatus | ''>('')
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [bulkToast, setBulkToast]         = useState<string | null>(null)

  const filtered = useMemo(() => {
    return EXECUCOES_WITH_MATCHING.filter(exec => {
      if (
        search &&
        !exec.titulo_importado.toLowerCase().includes(search.toLowerCase()) &&
        !(exec.autor_importado ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(exec.interprete_importado ?? '').toLowerCase().includes(search.toLowerCase())
      ) return false
      if (filterTipoUso && exec.tipo_uso !== filterTipoUso) return false
      if (filterEmissora && !exec.emissora.toLowerCase().includes(filterEmissora.toLowerCase())) return false
      if (filterPrograma && !exec.programa.toLowerCase().includes(filterPrograma.toLowerCase())) return false
      if (filterStatus && exec._matching?.status !== filterStatus) return false
      return true
    })
  }, [search, filterTipoUso, filterEmissora, filterPrograma, filterStatus])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(e => e.id)))
    }
  }

  function bulkAction(action: 'confirmar' | 'divergencia') {
    const msg = action === 'confirmar'
      ? `${selected.size} match(es) confirmado(s) com sucesso`
      : `${selected.size} execução(ões) marcada(s) como divergência`
    setBulkToast(msg)
    setSelected(new Set())
    setTimeout(() => setBulkToast(null), 3000)
  }

  function clearFilters() {
    setSearch('')
    setFilterTipoUso('')
    setFilterEmissora('')
    setFilterPrograma('')
    setFilterStatus('')
  }

  const hasFilters = search || filterTipoUso || filterEmissora || filterPrograma || filterStatus

  const selectCls = 'h-8 bg-white/5 border border-white/10 rounded-lg px-2.5 text-xs text-white/60 focus:outline-none cursor-pointer'
  const inputFilterCls = 'h-8 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-violet-500/50 transition-colors'

  // Stats
  const autoMatchCount = EXECUCOES_WITH_MATCHING.filter(e => e._matching?.status === 'auto_match').length
  const sugeridoCount  = EXECUCOES_WITH_MATCHING.filter(e => e._matching?.status === 'sugerido').length
  const divCount       = EXECUCOES_WITH_MATCHING.filter(e => e._matching?.status === 'divergente' || e._matching?.status === 'sem_match').length

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <Activity className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Execuções TV</h1>
            <p className="text-sm text-white/40">
              {TV_EXECUCOES.length} execuções importadas — matching audiovisual
            </p>
          </div>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 mr-1">{selected.size} selecionado(s)</span>
            <button
              onClick={() => bulkAction('confirmar')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-xs text-emerald-300 font-semibold hover:bg-emerald-600/30 transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Confirmar matches sugeridos
            </button>
            <button
              onClick={() => bulkAction('divergencia')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-600/20 border border-red-500/30 text-xs text-red-300 font-semibold hover:bg-red-600/30 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Marcar como divergência
            </button>
          </div>
        )}
      </div>

      {/* ── Status summary chips ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-300">{autoMatchCount} Auto Match</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-amber-300">{sugeridoCount} Sugerido</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-semibold text-red-300">{divCount} Divergente / Sem Match</span>
        </div>
      </div>

      {/* ── Bulk toast ── */}
      {bulkToast && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">{bulkToast}</p>
        </div>
      )}

      {/* ── Filters ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-white/5 border border-white/10 rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Buscar título, autor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Tipo uso */}
          <select
            value={filterTipoUso}
            onChange={e => setFilterTipoUso(e.target.value as TvTipoUso | '')}
            className={selectCls}
          >
            <option value="">Todos tipos de uso</option>
            {(Object.keys(TV_TIPO_USO_LABELS) as TvTipoUso[]).map(k => (
              <option key={k} value={k}>{TV_TIPO_USO_LABELS[k]}</option>
            ))}
          </select>

          {/* Emissora */}
          <input
            type="text"
            placeholder="Emissora..."
            value={filterEmissora}
            onChange={e => setFilterEmissora(e.target.value)}
            className={`${inputFilterCls} w-28`}
          />

          {/* Programa */}
          <input
            type="text"
            placeholder="Programa..."
            value={filterPrograma}
            onChange={e => setFilterPrograma(e.target.value)}
            className={`${inputFilterCls} w-36`}
          />

          {/* Status matching */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TvMatchingStatus | '')}
            className={selectCls}
          >
            <option value="">Todos status</option>
            {(Object.keys(TV_MATCHING_STATUS_LABELS) as TvMatchingStatus[]).map(k => (
              <option key={k} value={k}>{TV_MATCHING_STATUS_LABELS[k]}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs text-white/40 hover:text-white/70 bg-white/5 border border-white/[0.06] hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3" /> Limpar
            </button>
          )}

          <span className="text-xs text-white/25 ml-auto">{filtered.length} registros</span>
        </div>

        {/* ── Table ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                {/* Checkbox all */}
                <th className="px-4 py-3 w-10">
                  <button
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      selected.size === filtered.length && filtered.length > 0
                        ? 'bg-violet-600 border-violet-500'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {selected.size === filtered.length && filtered.length > 0 && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                  </button>
                </th>
                {['Título Importado', 'Autor', 'Programa', 'Emissora', 'Data Exibição', 'Duração', 'Tipo Uso', 'Status Match'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map(exec => {
                const matching = exec._matching
                const isSelected = selected.has(exec.id)
                return (
                  <tr
                    key={exec.id}
                    className={`hover:bg-white/[0.02] transition-colors group cursor-pointer ${isSelected ? 'bg-violet-500/5' : ''}`}
                    onClick={() => toggleSelect(exec.id)}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-violet-600 border-violet-500' : 'border-white/20 group-hover:border-white/40'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </td>

                    {/* Título */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-white leading-tight max-w-[200px] truncate">
                          {exec.titulo_importado}
                        </span>
                        {exec.interprete_importado && (
                          <span className="text-xs text-white/35 truncate max-w-[200px]">
                            {exec.interprete_importado}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Autor */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50 max-w-[160px] truncate block">
                        {exec.autor_importado ?? <span className="text-white/20">—</span>}
                      </span>
                    </td>

                    {/* Programa */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-white/70 max-w-[160px] truncate">{exec.programa}</span>
                        {exec.capitulo && (
                          <span className="text-[10px] text-white/25">{exec.capitulo}</span>
                        )}
                      </div>
                    </td>

                    {/* Emissora */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold text-white/60">{exec.emissora}</span>
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-white/55 tabular-nums">{formatDate(exec.data_exibicao)}</span>
                        {exec.hora_exibicao && (
                          <span className="text-[10px] text-white/25 tabular-nums font-mono">{exec.hora_exibicao.slice(0, 5)}</span>
                        )}
                      </div>
                    </td>

                    {/* Duração */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs tabular-nums text-white/50 font-mono">{formatDuracao(exec.duracao_seg)}</span>
                    </td>

                    {/* Tipo Uso badge */}
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${TV_TIPO_USO_COLORS[exec.tipo_uso]}`}>
                        {TV_TIPO_USO_LABELS[exec.tipo_uso]}
                      </span>
                    </td>

                    {/* Status match badge */}
                    <td className="px-4 py-3.5">
                      {matching ? (
                        <div className="flex flex-col gap-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit ${TV_MATCHING_STATUS_COLORS[matching.status]}`}>
                            {TV_MATCHING_STATUS_LABELS[matching.status]}
                          </span>
                          {matching.score > 0 && (
                            <span className="text-[10px] text-white/25 tabular-nums">{matching.score.toFixed(0)}%</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <Activity className="w-8 h-8" />
            <p className="text-sm">Nenhuma execução encontrada</p>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-violet-400 hover:text-violet-300 transition-colors mt-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Footer summary */}
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-xs text-white/30">
            <span><span className="text-white/60 font-semibold">{filtered.length}</span> execuções exibidas</span>
            <span>•</span>
            <span>
              <span className="text-emerald-400 font-semibold">
                {filtered.filter(e => e._matching?.status === 'auto_match' || e._matching?.status === 'confirmado').length}
              </span> confirmadas
            </span>
            <span>
              <span className="text-amber-400 font-semibold">
                {filtered.filter(e => e._matching?.status === 'sugerido').length}
              </span> para revisão
            </span>
            <span>
              <span className="text-red-400 font-semibold">
                {filtered.filter(e => e._matching?.status === 'sem_match' || e._matching?.status === 'divergente').length}
              </span> sem match / divergente
            </span>
            {selected.size > 0 && (
              <>
                <span>•</span>
                <span className="text-violet-400 font-semibold">{selected.size} selecionados</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

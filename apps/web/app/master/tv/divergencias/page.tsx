'use client'

import { useState, useMemo } from 'react'
import {
  AlertTriangle, Search, X, CheckCircle2, XCircle, AlertCircle,
  FilePlus, Check,
} from 'lucide-react'
import { TV_DIVERGENCIAS, TV_EXECUCOES, TV_MATCHINGS } from '@/lib/mock-tv'
import {
  TV_DIVERGENCIA_TIPO_LABELS,
} from '@/lib/types-tv'
import type { TvDivergenciaTipo, TvDivergenciaStatus } from '@/lib/types-tv'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MOCK_SUGESTOES = [
  { id: 'obra-001', titulo: 'Amo Noite e Dia',     autores: 'Nauilan Barbosa; Giovani Alves' },
  { id: 'obra-002', titulo: 'Saudade do Interior',  autores: 'Marcelo Costa' },
  { id: 'obra-003', titulo: 'Coracao Partido',       autores: 'Joao Pedro Moraes' },
]

const STATUS_LABELS: Record<TvDivergenciaStatus, string> = {
  aberta:     'Aberta',
  em_analise: 'Em Análise',
  resolvida:  'Resolvida',
  ignorada:   'Ignorada',
}

const STATUS_COLORS: Record<TvDivergenciaStatus, string> = {
  aberta:     'bg-red-500/20 text-red-300 border-red-500/30',
  em_analise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolvida:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ignorada:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

const TIPO_COLORS: Record<TvDivergenciaTipo, string> = {
  obra_nao_encontrada:         'bg-red-500/20 text-red-300 border-red-500/30',
  similaridade_baixa:          'bg-amber-500/20 text-amber-300 border-amber-500/30',
  multiplas_obras:             'bg-orange-500/20 text-orange-300 border-orange-500/30',
  autor_divergente:            'bg-purple-500/20 text-purple-300 border-purple-500/30',
  titulo_diferente:            'bg-sky-500/20 text-sky-300 border-sky-500/30',
  editora_ausente:             'bg-pink-500/20 text-pink-300 border-pink-500/30',
  percentual_nao_identificado: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  obra_sem_contrato:           'bg-rose-500/20 text-rose-300 border-rose-500/30',
  obra_sem_controle_valido:    'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  tipo_uso_indefinido:         'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

// ── Build joined data ──────────────────────────────────────────────────────────

const DIVERGENCIAS_ENRICHED = TV_DIVERGENCIAS.map(div => {
  const execucao = TV_EXECUCOES.find(e => e.id === div.execucao_id) ?? null
  const matching = TV_MATCHINGS.find(m => m.execucao_id === div.execucao_id) ?? null
  return { ...div, _execucao: execucao, _matching: matching }
})

// ── Page ───────────────────────────────────────────────────────────────────────

export default function DivergenciasPage() {
  const [search, setSearch]         = useState('')
  const [filterTipo, setFilterTipo] = useState<TvDivergenciaTipo | ''>('')
  const [filterStatus, setFilterStatus] = useState<TvDivergenciaStatus | ''>('')
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'warn' | 'info' } | null>(null)
  const [localStatuses, setLocalStatuses] = useState<Record<string, TvDivergenciaStatus>>({})

  function getStatus(div: (typeof DIVERGENCIAS_ENRICHED)[number]): TvDivergenciaStatus {
    return localStatuses[div.id] ?? div.status
  }

  function showToast(msg: string, type: 'success' | 'warn' | 'info' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function resolverComObra(divId: string, obraTitulo: string) {
    setLocalStatuses(prev => ({ ...prev, [divId]: 'resolvida' }))
    showToast(`Divergência resolvida com obra "${obraTitulo}"`, 'success')
  }

  function ignorar(divId: string) {
    setLocalStatuses(prev => ({ ...prev, [divId]: 'ignorada' }))
    showToast('Divergência ignorada', 'warn')
  }

  function criarPreCadastro(titulo: string) {
    showToast(`Pré-cadastro criado para "${titulo}"`, 'info')
  }

  const filtered = useMemo(() => {
    return DIVERGENCIAS_ENRICHED.filter(div => {
      const status = getStatus(div)
      if (filterStatus && status !== filterStatus) return false
      if (filterTipo && div.tipo !== filterTipo) return false
      if (search) {
        const q = search.toLowerCase()
        const titulo = div._execucao?.titulo_importado ?? ''
        const descr  = div.descricao ?? ''
        if (!titulo.toLowerCase().includes(q) && !descr.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [search, filterTipo, filterStatus, localStatuses])

  const openCount = DIVERGENCIAS_ENRICHED.filter(d =>
    (localStatuses[d.id] ?? d.status) === 'aberta' ||
    (localStatuses[d.id] ?? d.status) === 'em_analise'
  ).length

  const selectCls = 'h-9 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white/60 focus:outline-none cursor-pointer focus:border-violet-500/50 transition-colors'

  return (
    <div className="space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Divergências TV</h1>
            <p className="text-sm text-white/40">
              <span className="text-amber-400 font-semibold">{openCount}</span> divergência{openCount !== 1 ? 's' : ''} em aberto · {TV_DIVERGENCIAS.length} total
            </p>
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm ${
          toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' :
          toast.type === 'warn'    ? 'bg-slate-500/10 border-slate-500/25 text-slate-300' :
                                     'bg-violet-500/10 border-violet-500/25 text-violet-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
           toast.type === 'warn'    ? <XCircle className="w-4 h-4 shrink-0" /> :
                                      <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm bg-white/5 border border-white/10 rounded-xl px-3 h-9">
          <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
          <input
            type="text"
            placeholder="Buscar título, descrição..."
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

        {/* Tipo */}
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as TvDivergenciaTipo | '')} className={selectCls}>
          <option value="">Todos os tipos</option>
          {(Object.keys(TV_DIVERGENCIA_TIPO_LABELS) as TvDivergenciaTipo[]).map(k => (
            <option key={k} value={k}>{TV_DIVERGENCIA_TIPO_LABELS[k]}</option>
          ))}
        </select>

        {/* Status */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TvDivergenciaStatus | '')} className={selectCls}>
          <option value="">Todos os status</option>
          {(Object.keys(STATUS_LABELS) as TvDivergenciaStatus[]).map(k => (
            <option key={k} value={k}>{STATUS_LABELS[k]}</option>
          ))}
        </select>

        {(search || filterTipo || filterStatus) && (
          <button
            onClick={() => { setSearch(''); setFilterTipo(''); setFilterStatus('') }}
            className="flex items-center gap-1 h-9 px-3 rounded-xl text-xs text-white/40 hover:text-white/70 bg-white/5 border border-white/[0.06] hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3" /> Limpar
          </button>
        )}

        <span className="text-xs text-white/25 ml-auto tabular-nums">{filtered.length} registros</span>
      </div>

      {/* ── Cards ── */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-white/30">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm">Nenhuma divergência encontrada</p>
          </div>
        )}

        {filtered.map(div => {
          const status  = getStatus(div)
          const exec    = div._execucao
          const match   = div._matching
          const resolved = status === 'resolvida' || status === 'ignorada'

          return (
            <div
              key={div.id}
              className={`bg-white/5 border rounded-2xl p-5 space-y-4 transition-opacity ${
                resolved ? 'border-white/[0.06] opacity-60' : 'border-white/10'
              }`}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Tipo badge */}
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${TIPO_COLORS[div.tipo]}`}>
                    {TV_DIVERGENCIA_TIPO_LABELS[div.tipo]}
                  </span>
                  {/* Status badge */}
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[status]}`}>
                    {STATUS_LABELS[status]}
                  </span>
                  {/* ID */}
                  <span className="text-[10px] text-white/20 font-mono">{div.id}</span>
                </div>

                {/* Score chip */}
                {match && match.score > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="text-[10px] text-white/40">Score</span>
                    <span className={`text-xs font-bold tabular-nums ${
                      match.score >= 90 ? 'text-emerald-400' :
                      match.score >= 70 ? 'text-amber-400' : 'text-red-400'
                    }`}>{match.score.toFixed(0)}%</span>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {div.descricao && (
                <p className="text-sm text-white/55 leading-relaxed">{div.descricao}</p>
              )}

              {/* Execucao info */}
              {exec && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div>
                    <p className="text-[10px] text-white/30 mb-0.5">Título importado</p>
                    <p className="text-xs font-semibold text-white truncate">{exec.titulo_importado}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 mb-0.5">Autor</p>
                    <p className="text-xs text-white/60 truncate">{exec.autor_importado ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 mb-0.5">Programa</p>
                    <p className="text-xs text-white/60 truncate">{exec.programa}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 mb-0.5">Data exibição</p>
                    <p className="text-xs text-white/60 tabular-nums">{formatDate(exec.data_exibicao)}</p>
                  </div>
                </div>
              )}

              {/* Suggested obras */}
              {!resolved && (
                <div>
                  <p className="text-[10px] text-white/30 mb-2 uppercase tracking-wide">Obras sugeridas</p>
                  <div className="flex flex-wrap gap-2">
                    {MOCK_SUGESTOES.map(obra => (
                      <button
                        key={obra.id}
                        onClick={() => resolverComObra(div.id, obra.titulo)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors group"
                      >
                        <Check className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="text-left">
                          <p className="text-xs font-semibold text-emerald-300">{obra.titulo}</p>
                          <p className="text-[10px] text-white/30">{obra.autores}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!resolved && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => resolverComObra(div.id, MOCK_SUGESTOES[0].titulo)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-xs font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolver com Obra
                  </button>
                  <button
                    onClick={() => ignorar(div.id)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-600/20 border border-slate-500/30 text-xs font-semibold text-slate-300 hover:bg-slate-600/30 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Ignorar
                  </button>
                  <button
                    onClick={() => criarPreCadastro(exec?.titulo_importado ?? div.id)}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-violet-600/20 border border-violet-500/30 text-xs font-semibold text-violet-300 hover:bg-violet-600/30 transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" /> Criar Pré-Cadastro
                  </button>
                </div>
              )}

              {/* Resolved feedback */}
              {resolved && (
                <div className="flex items-center gap-2">
                  {status === 'resolvida' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-xs text-white/40">
                    {status === 'resolvida' ? 'Divergência resolvida' : 'Divergência ignorada'}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

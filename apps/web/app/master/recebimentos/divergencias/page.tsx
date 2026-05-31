'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  AlertCircle, CheckCircle2, Clock, Search, XCircle,
} from 'lucide-react'
import { MOCK_RECEBIMENTOS } from '@/lib/mock-recebimentos'
import {
  DIVERGENCIA_TIPO_LABELS, FONTE_LABELS,
} from '@/lib/types-recebimentos'
import type { TipoDivergencia, StatusDivergencia, FonteRecebimento } from '@/lib/types-recebimentos'

const STATUS_DIV_COLORS: Record<StatusDivergencia, string> = {
  aberta:     'bg-red-500/20 text-red-300 border-red-500/30',
  em_analise: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  resolvida:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ignorada:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
}
const STATUS_DIV_LABELS: Record<StatusDivergencia, string> = {
  aberta:     'Aberta',
  em_analise: 'Em Análise',
  resolvida:  'Resolvida',
  ignorada:   'Ignorada',
}

interface FlatDivergencia {
  id: string
  recebimento_id: string
  recebimento_codigo: string
  recebimento_fonte: FonteRecebimento
  tipo: TipoDivergencia
  descricao?: string | null
  status: StatusDivergencia
  resolucao_observacao?: string | null
}

const BASE_DIVERGENCIAS: FlatDivergencia[] = MOCK_RECEBIMENTOS.flatMap(r =>
  (r._divergencias ?? []).map(d => ({
    ...d,
    recebimento_codigo: r.codigo,
    recebimento_fonte: r.fonte,
  } as FlatDivergencia))
)

export default function DivergenciasPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<TipoDivergencia | ''>('')
  const [filterStatus, setFilterStatus] = useState<StatusDivergencia | ''>('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [statuses, setStatuses] = useState<Record<string, StatusDivergencia>>(() => {
    const init: Record<string, StatusDivergencia> = {}
    BASE_DIVERGENCIAS.forEach(d => { init[d.id] = d.status })
    return init
  })

  const allDivergencias = useMemo(() => {
    return BASE_DIVERGENCIAS.filter(d => {
      const currentStatus = statuses[d.id] ?? d.status
      if (search &&
          !DIVERGENCIA_TIPO_LABELS[d.tipo].toLowerCase().includes(search.toLowerCase()) &&
          !(d.descricao ?? '').toLowerCase().includes(search.toLowerCase()) &&
          !d.recebimento_codigo.toLowerCase().includes(search.toLowerCase())) return false
      if (filterTipo && d.tipo !== filterTipo) return false
      if (filterStatus && currentStatus !== filterStatus) return false
      return true
    })
  }, [search, filterTipo, filterStatus, statuses])

  const kpis = useMemo(() => {
    const all = BASE_DIVERGENCIAS
    return {
      total:      all.length,
      abertas:    all.filter(d => statuses[d.id] === 'aberta').length,
      em_analise: all.filter(d => statuses[d.id] === 'em_analise').length,
      resolvidas: all.filter(d => statuses[d.id] === 'resolvida').length,
      ignoradas:  all.filter(d => statuses[d.id] === 'ignorada').length,
    }
  }, [statuses])

  function resolveOne(id: string) {
    setStatuses(prev => ({ ...prev, [id]: 'resolvida' }))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function ignoreOne(id: string) {
    setStatuses(prev => ({ ...prev, [id]: 'ignorada' }))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }
  function resolveSelected() {
    setStatuses(prev => {
      const n = { ...prev }
      selected.forEach(id => { n[id] = 'resolvida' })
      return n
    })
    setSelected(new Set())
  }
  function ignoreSelected() {
    setStatuses(prev => {
      const n = { ...prev }
      selected.forEach(id => { n[id] = 'ignorada' })
      return n
    })
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleAll() {
    if (selected.size === allDivergencias.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allDivergencias.map(d => d.id)))
    }
  }

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  const allTipos = Array.from(new Set(BASE_DIVERGENCIAS.map(d => d.tipo))) as TipoDivergencia[]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fila de Divergências"
        description="Revisão manual de todas as divergências em aberto nos recebimentos importados"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',       value: kpis.total,      color: 'text-white/80',    icon: AlertCircle },
          { label: 'Abertas',     value: kpis.abertas,    color: 'text-red-400',     icon: XCircle },
          { label: 'Em Análise',  value: kpis.em_analise, color: 'text-amber-400',   icon: Clock },
          { label: 'Resolvidas',  value: kpis.resolvidas, color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Ignoradas',   value: kpis.ignoradas,  color: 'text-slate-400',   icon: XCircle },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <p className="text-[10px] text-white/35">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold ${stat.color} leading-tight`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filtros + Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Tipo, descrição ou código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as TipoDivergencia | '')} className={selectCls}>
            <option value="">Todos tipos</option>
            {allTipos.map(t => (
              <option key={t} value={t}>{DIVERGENCIA_TIPO_LABELS[t]}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusDivergencia | '')} className={selectCls}>
            <option value="">Todos status</option>
            {(['aberta', 'em_analise', 'resolvida', 'ignorada'] as StatusDivergencia[]).map(s => (
              <option key={s} value={s}>{STATUS_DIV_LABELS[s]}</option>
            ))}
          </select>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-white/40">{selected.size} selecionadas</span>
              <button
                onClick={resolveSelected}
                className="flex items-center gap-1 h-7 px-3 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" /> Resolver Selecionadas
              </button>
              <button
                onClick={ignoreSelected}
                className="flex items-center gap-1 h-7 px-3 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/30 text-xs font-semibold hover:bg-slate-500/20 transition-colors"
              >
                <XCircle className="w-3 h-3" /> Ignorar Selecionadas
              </button>
            </div>
          )}
          {selected.size === 0 && (
            <span className="text-xs text-white/30 ml-auto">{allDivergencias.length} registros</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selected.size === allDivergencias.length && allDivergencias.length > 0}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border border-white/20 bg-white/5 cursor-pointer accent-violet-600"
                  />
                </th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-44">Tipo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Recebimento</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Descrição</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Status</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-40">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {allDivergencias.map(d => {
                const currentStatus = statuses[d.id] ?? d.status
                const isDone = currentStatus === 'resolvida' || currentStatus === 'ignorada'
                return (
                  <tr key={d.id} className={`hover:bg-white/[0.02] transition-colors ${selected.has(d.id) ? 'bg-violet-600/[0.04]' : ''}`}>
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(d.id)}
                        onChange={() => toggleSelect(d.id)}
                        className="w-3.5 h-3.5 rounded border border-white/20 bg-white/5 cursor-pointer accent-violet-600"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {DIVERGENCIA_TIPO_LABELS[d.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/master/recebimentos/${d.recebimento_id}`}
                        className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        <span className="font-mono">{d.recebimento_codigo}</span>
                      </Link>
                      <span className="text-[10px] text-white/30">{FONTE_LABELS[d.recebimento_fonte]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-white/55 max-w-xs">{d.descricao ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_DIV_COLORS[currentStatus]}`}>
                        {STATUS_DIV_LABELS[currentStatus]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => resolveOne(d.id)}
                          disabled={isDone}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Resolver
                        </button>
                        <button
                          onClick={() => ignoreOne(d.id)}
                          disabled={isDone}
                          className="text-xs px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-300 border border-slate-500/30 hover:bg-slate-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Ignorar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {allDivergencias.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/30" />
            <p className="text-sm">Nenhuma divergência encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

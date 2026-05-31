'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Download, Upload, FileText, DollarSign, Globe, AlertCircle,
  CheckCircle2, Clock, Search, Eye, ChevronRight, Info,
} from 'lucide-react'
import { MOCK_RECEBIMENTOS, KPI_RECEBIMENTOS } from '@/lib/mock-recebimentos'
import {
  FONTE_LABELS, FONTE_COLORS,
  CATEGORIA_LABELS, CATEGORIA_COLORS,
  STATUS_RECEBIMENTO_LABELS, STATUS_RECEBIMENTO_COLORS,
} from '@/lib/types-recebimentos'
import type { FonteRecebimento, CategoriaRecebimento, StatusRecebimento } from '@/lib/types-recebimentos'

function formatBRL(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}

function formatPeriodo(inicio: string, fim: string) {
  const fmt = (d: string) => new Date(d).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  return `${fmt(inicio)} – ${fmt(fim)}`
}

export default function RecebimentosPage() {
  const [search, setSearch] = useState('')
  const [filterFonte, setFilterFonte] = useState<FonteRecebimento | ''>('')
  const [filterCategoria, setFilterCategoria] = useState<CategoriaRecebimento | ''>('')
  const [filterStatus, setFilterStatus] = useState<StatusRecebimento | ''>('')

  const recebimentos = useMemo(() => {
    return MOCK_RECEBIMENTOS.filter(r => {
      if (search && !r.codigo.toLowerCase().includes(search.toLowerCase()) &&
          !FONTE_LABELS[r.fonte].toLowerCase().includes(search.toLowerCase())) return false
      if (filterFonte && r.fonte !== filterFonte) return false
      if (filterCategoria && r.categoria !== filterCategoria) return false
      if (filterStatus && r.status !== filterStatus) return false
      return true
    })
  }, [search, filterFonte, filterCategoria, filterStatus])

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  const kpis = [
    { label: 'Total Importado',      value: KPI_RECEBIMENTOS.total,                       color: 'text-white/80',    icon: FileText },
    { label: 'Valor Total BRL',      value: formatBRL(KPI_RECEBIMENTOS.valor_total_brl),  color: 'text-emerald-300', icon: DollarSign },
    { label: 'Operacional',          value: KPI_RECEBIMENTOS.operacional,                  color: 'text-violet-400',  icon: Globe },
    { label: 'Informativo',          value: KPI_RECEBIMENTOS.informativo,                  color: 'text-slate-400',   icon: Info },
    { label: 'Divergências Abertas', value: KPI_RECEBIMENTOS.divergencias_abertas,         color: 'text-red-400',     icon: AlertCircle },
    { label: 'Conciliados',          value: KPI_RECEBIMENTOS.conciliados,                  color: 'text-emerald-400', icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recebimentos"
        description="Gestão de recebimentos de royalties — ECAD, DSPs, Sync, Internacional e Acordos Diretos"
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/master/recebimentos/divergencias"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-sm text-red-300 font-semibold transition-colors"
            >
              <AlertCircle className="w-4 h-4" /> Divergências
            </Link>
            <Link
              href="/master/recebimentos/importar"
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" /> Importar
            </Link>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map(stat => (
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
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Código ou fonte..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterFonte} onChange={e => setFilterFonte(e.target.value as FonteRecebimento | '')} className={selectCls}>
            <option value="">Todas as fontes</option>
            {(Object.keys(FONTE_LABELS) as FonteRecebimento[]).map(f => (
              <option key={f} value={f}>{FONTE_LABELS[f]}</option>
            ))}
          </select>
          <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value as CategoriaRecebimento | '')} className={selectCls}>
            <option value="">Todas categorias</option>
            {(Object.keys(CATEGORIA_LABELS) as CategoriaRecebimento[]).map(c => (
              <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusRecebimento | '')} className={selectCls}>
            <option value="">Todos status</option>
            {(Object.keys(STATUS_RECEBIMENTO_LABELS) as StatusRecebimento[]).map(s => (
              <option key={s} value={s}>{STATUS_RECEBIMENTO_LABELS[s]}</option>
            ))}
          </select>
          <span className="text-xs text-white/30 ml-auto">{recebimentos.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Código</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-44">Fonte</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Categoria</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Período</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-36">Valor BRL</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Status</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3 w-28">Divergências</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {recebimentos.map(r => {
                const divCount = r._divergencias?.filter(d => d.status === 'aberta' || d.status === 'em_analise').length ?? 0
                return (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-white/60">{r.codigo}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${FONTE_COLORS[r.fonte]}`}>
                        {FONTE_LABELS[r.fonte]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${CATEGORIA_COLORS[r.categoria]}`}>
                        {CATEGORIA_LABELS[r.categoria]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-white/50">{formatPeriodo(r.periodo_inicio, r.periodo_fim)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-emerald-400">
                        {formatBRL(r.valor_brl)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_RECEBIMENTO_COLORS[r.status]}`}>
                        {STATUS_RECEBIMENTO_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {divCount > 0 ? (
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                          {divCount}
                        </span>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/master/recebimentos/${r.id}`}
                        className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                      >
                        <Eye className="w-3 h-3" /> <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {recebimentos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <Download className="w-8 h-8" />
            <p className="text-sm">Nenhum recebimento encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}

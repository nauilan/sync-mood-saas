'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus, Search, Shield, CheckCircle2, DollarSign, FileText,
  Clock, Star, ChevronRight, Lock
} from 'lucide-react'
import { MOCK_AUTORIZACOES, KPI_AUTORIZACOES } from '@/lib/mock-autorizacoes'
import {
  TIPO_AUTORIZACAO_LABELS, TIPO_AUTORIZACAO_COLORS,
  STATUS_AUTORIZACAO_LABELS, STATUS_AUTORIZACAO_COLORS,
  MODELO_NEGOCIO_LABELS, MODELO_NEGOCIO_COLORS,
  exclusividadeEmAlerta,
} from '@/lib/types-autorizacoes'
import type { TipoAutorizacao, StatusAutorizacao, ModeloNegocio } from '@/lib/types-autorizacoes'

function formatBRL(value?: number | null) {
  if (!value && value !== 0) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value)
}

export default function AutorizacoesPage() {
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<TipoAutorizacao | ''>('')
  const [filterStatus, setFilterStatus] = useState<StatusAutorizacao | ''>('')
  const [filterNegocio, setFilterNegocio] = useState<ModeloNegocio | ''>('')

  const autorizacoes = useMemo(() => {
    return MOCK_AUTORIZACOES.filter(a => {
      if (search && !a.numero_autorizacao.toLowerCase().includes(search.toLowerCase()) &&
          !a.licenciado_nome?.toLowerCase().includes(search.toLowerCase()) &&
          !a._obras?.some(o => o.obra_titulo.toLowerCase().includes(search.toLowerCase()))) return false
      if (filterTipo && a.tipo !== filterTipo) return false
      if (filterStatus && a.status !== filterStatus) return false
      if (filterNegocio && a.modelo_negocio !== filterNegocio) return false
      return true
    })
  }, [search, filterTipo, filterStatus, filterNegocio])

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Autorizacoes"
        description="Gestao de autorizacoes de uso de obras musicais — fonograma, sincronizacao, publicidade e mais"
        actions={
          <Link
            href="/master/autorizacoes/nova"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Autorizacao
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',          value: KPI_AUTORIZACOES.total,         color: 'text-white/80',   icon: Shield },
          { label: 'Emitidas',       value: KPI_AUTORIZACOES.emitidas,      color: 'text-violet-400', icon: FileText },
          { label: 'Faturadas',      value: KPI_AUTORIZACOES.faturadas,     color: 'text-amber-400',  icon: DollarSign },
          { label: 'Pagas',          value: KPI_AUTORIZACOES.pagas,         color: 'text-emerald-400',icon: CheckCircle2 },
          { label: 'Negociacao',     value: KPI_AUTORIZACOES.em_negociacao, color: 'text-sky-400',    icon: Clock },
          { label: 'Valor Total',    value: formatBRL(KPI_AUTORIZACOES.valor_total), color: 'text-emerald-300', icon: Star },
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
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Numero, licenciado ou obra..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as TipoAutorizacao | '')} className={selectCls}>
            <option value="">Todos tipos</option>
            {(['fonograma','sincronizacao','publicidade','tv','edicao_grafica','incidental','versao'] as TipoAutorizacao[]).map(t => (
              <option key={t} value={t}>{TIPO_AUTORIZACAO_LABELS[t]}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusAutorizacao | '')} className={selectCls}>
            <option value="">Todos status</option>
            {(['rascunho','em_analise','em_negociacao','aprovado','emitido','assinado','faturado','pago','cancelado'] as StatusAutorizacao[]).map(s => (
              <option key={s} value={s}>{STATUS_AUTORIZACAO_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterNegocio} onChange={e => setFilterNegocio(e.target.value as ModeloNegocio | '')} className={selectCls}>
            <option value="">Todos negocios</option>
            {(['pago_editora','pago_autor','sem_onus'] as ModeloNegocio[]).map(n => (
              <option key={n} value={n}>{MODELO_NEGOCIO_LABELS[n]}</option>
            ))}
          </select>
          <span className="text-xs text-white/30 ml-auto">{autorizacoes.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Numero</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Tipo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Obra(s)</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Licenciado</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-20">Territorio</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-28">Valor</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Status</th>
                <th className="text-center text-xs font-semibold text-white/30 px-4 py-3 w-24">Exclusivo</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {autorizacoes.map(a => {
                const obrasTitulos = a._obras?.map(o => o.obra_titulo).join(', ') ?? '—'
                return (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono text-white/60">{a.numero_autorizacao}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_AUTORIZACAO_COLORS[a.tipo]}`}>
                        {TIPO_AUTORIZACAO_LABELS[a.tipo]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white/70 font-medium">{obrasTitulos}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white/50">{a.licenciado_nome ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-white/40">{a.territorio}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-emerald-400">
                        {formatBRL(a.valor_total)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_AUTORIZACAO_COLORS[a.status]}`}>
                        {STATUS_AUTORIZACAO_LABELS[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {a.exclusividade ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-amber-400">
                          <Lock className="w-3 h-3" />
                          {a.exclusividade_periodo_meses}m
                        </span>
                      ) : (
                        <span className="text-xs text-white/25">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/master/autorizacoes/${a.id}`}
                        className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                      >
                        Ver <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {autorizacoes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <Shield className="w-8 h-8" />
            <p className="text-sm">Nenhuma autorizacao encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

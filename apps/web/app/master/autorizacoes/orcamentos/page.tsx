'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus, Search, FileEdit, CheckCircle2, DollarSign, FileText,
  Clock, TrendingUp, ChevronRight, ArrowRight, ExternalLink,
  AlertCircle,
} from 'lucide-react'
import { MOCK_ORCAMENTOS, KPI_ORCAMENTOS } from '@/lib/mock-orcamentos'
import {
  STATUS_ORCAMENTO_LABELS, STATUS_ORCAMENTO_COLORS,
} from '@/lib/types-orcamentos'
import type { StatusOrcamento } from '@/lib/types-orcamentos'
import { TIPO_AUTORIZACAO_LABELS, TIPO_AUTORIZACAO_COLORS } from '@/lib/types-autorizacoes'
import type { TipoAutorizacao } from '@/lib/types-autorizacoes'

function formatBRL(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0,
  }).format(value)
}

function diasRestantes(validade: string): number {
  const hoje = new Date()
  const v = new Date(validade + 'T00:00:00')
  return Math.ceil((v.getTime() - hoje.getTime()) / 86400000)
}

export default function OrcamentosPage() {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusOrcamento | ''>('')
  const [filterTipo, setFilterTipo]   = useState<TipoAutorizacao | ''>('')

  const orcamentos = useMemo(() => {
    return MOCK_ORCAMENTOS.filter(o => {
      if (search &&
          !o.numero_orcamento.toLowerCase().includes(search.toLowerCase()) &&
          !o.licenciado_nome?.toLowerCase().includes(search.toLowerCase()) &&
          !o._obras?.some(ob => ob.obra_titulo.toLowerCase().includes(search.toLowerCase())))
        return false
      if (filterStatus && o.status !== filterStatus) return false
      if (filterTipo && o.tipo !== filterTipo) return false
      return true
    })
  }, [search, filterStatus, filterTipo])

  const sel = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orcamentos"
        description="Proposta comercial de autorizacao — envie ao cliente, negocie e converta em autorizacao"
        actions={
          <Link
            href="/master/autorizacoes/orcamentos/novo"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Orcamento
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: KPI_ORCAMENTOS.total,         color: 'text-white/80',    icon: FileEdit },
          { label: 'Enviados',    value: KPI_ORCAMENTOS.enviados,      color: 'text-sky-400',     icon: FileText },
          { label: 'Aprovados',   value: KPI_ORCAMENTOS.aprovados,     color: 'text-emerald-400', icon: CheckCircle2 },
          { label: 'Convertidos', value: KPI_ORCAMENTOS.convertidos,   color: 'text-violet-400',  icon: ArrowRight },
          { label: 'Recusados',   value: KPI_ORCAMENTOS.recusados,     color: 'text-rose-400',    icon: AlertCircle },
          { label: 'Pipeline',    value: formatBRL(KPI_ORCAMENTOS.valor_pipeline), color: 'text-amber-300', icon: TrendingUp },
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

      {/* Alerta de orcamentos proximos do vencimento */}
      {(() => {
        const proximos = MOCK_ORCAMENTOS.filter(o =>
          ['enviado','em_negociacao'].includes(o.status) &&
          diasRestantes(o.data_validade) <= 7 &&
          diasRestantes(o.data_validade) >= 0
        )
        if (proximos.length === 0) return null
        return (
          <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-400">
                {proximos.length} orcamento{proximos.length > 1 ? 's' : ''} vencendo em breve
              </p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                {proximos.map(o => `${o.numero_orcamento} (${diasRestantes(o.data_validade)}d)`).join(' · ')}
              </p>
            </div>
          </div>
        )
      })()}

      {/* Tabela */}
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
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusOrcamento | '')} className={sel}>
            <option value="">Todos status</option>
            {(Object.keys(STATUS_ORCAMENTO_LABELS) as StatusOrcamento[]).map(s => (
              <option key={s} value={s}>{STATUS_ORCAMENTO_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as TipoAutorizacao | '')} className={sel}>
            <option value="">Todos tipos</option>
            {(['fonograma','sincronizacao','publicidade','tv','edicao_grafica','incidental','versao'] as TipoAutorizacao[]).map(t => (
              <option key={t} value={t}>{TIPO_AUTORIZACAO_LABELS[t]}</option>
            ))}
          </select>
          <span className="text-xs text-white/30 ml-auto">{orcamentos.length} registros</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Numero</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Tipo</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Obra(s)</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Cliente</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-28">Sugerido</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-28">Negociado</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-24">Validade</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Status</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {orcamentos.map(o => {
                const obras = o._obras?.map(ob => ob.obra_titulo).join(', ') ?? '—'
                const dias = diasRestantes(o.data_validade)
                const vencendo = ['enviado','em_negociacao'].includes(o.status) && dias <= 7 && dias >= 0
                return (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-mono text-white/60">{o.numero_orcamento}</span>
                        {o.numero_autorizacao && (
                          <span className="text-[10px] text-violet-400 font-mono">{o.numero_autorizacao}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_AUTORIZACAO_COLORS[o.tipo as TipoAutorizacao] ?? 'bg-white/10 text-white/50'}`}>
                        {TIPO_AUTORIZACAO_LABELS[o.tipo as TipoAutorizacao] ?? o.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white/70 font-medium">{obras}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-white/50">{o.licenciado_nome ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-semibold tabular-nums text-white/60">
                        {formatBRL(o.valor_sugerido)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${o.valor_negociado ? 'text-emerald-400' : 'text-white/25'}`}>
                        {formatBRL(o.valor_negociado)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-xs tabular-nums ${vencendo ? 'text-amber-400 font-semibold' : 'text-white/40'}`}>
                          {new Date(o.data_validade + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                        {vencendo && (
                          <span className="text-[10px] text-amber-400">{dias}d restantes</span>
                        )}
                        {dias < 0 && ['enviado','em_negociacao'].includes(o.status) && (
                          <span className="text-[10px] text-rose-400">Vencido</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_ORCAMENTO_COLORS[o.status]}`}>
                        {STATUS_ORCAMENTO_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/master/autorizacoes/orcamentos/${o.id}`}
                          className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                        >
                          Ver <ChevronRight className="w-3 h-3" />
                        </Link>
                        {o.status === 'aprovado' && (
                          <Link
                            href={`/master/autorizacoes/nova?orcamento=${o.id}`}
                            className="flex items-center gap-1 text-xs text-emerald-400/70 hover:text-emerald-400 transition-colors"
                          >
                            Converter <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {orcamentos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <FileEdit className="w-8 h-8" />
            <p className="text-sm">Nenhum orcamento encontrado</p>
          </div>
        )}
      </div>

      {/* Info metodologia */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Metodologia de Precificacao — Producao Audiovisual</h3>
        </div>
        <p className="text-xs text-white/40 leading-relaxed">
          Para orcamentos de <strong className="text-white/60">Sincronizacao Audiovisual</strong>, o sistema calcula automaticamente
          um valor sugerido com base nos parametros do uso. O valor final e sempre negociavel.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { titulo: 'Tipo de Sincronizacao', desc: 'Abertura: R$8.000 · Tema: R$5.000 · Fundo: R$2.000 · Performance: R$4.000 · Encerramento: R$3.500', cor: 'text-violet-400' },
            { titulo: 'Fator Meio', desc: 'Publicidade (2.5×) · Filme (2.0×) · Novela (1.8×) · Serie (1.5×) · TV (1.2×) · Documentario (0.8×)', cor: 'text-sky-400' },
            { titulo: 'Fator Territorio', desc: 'Mundial (3.0×) · EUA/Europa (2.0×) · Am. Latina (1.5×) · Portugal (1.2×) · Brasil (1.0×)', cor: 'text-amber-400' },
            { titulo: 'Ajustes Adicionais', desc: 'Prazo proporcional (dias/365) · % controle editora · +50% exclusividade · +R$2.000 festivais', cor: 'text-emerald-400' },
          ].map(item => (
            <div key={item.titulo} className="bg-white/[0.03] rounded-lg p-3 space-y-1.5">
              <p className={`text-xs font-semibold ${item.cor}`}>{item.titulo}</p>
              <p className="text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-white/30 italic">
          Formula: Valor = Base × Fator Meio × Fator Territorio × (Dias/365) × (% Controle/100) + Exclusividade + Festivais
        </p>
      </div>
    </div>
  )
}

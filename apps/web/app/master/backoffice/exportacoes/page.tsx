'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/ui/page-header'
import {
  Plus, Search, Package, Upload, RefreshCw, AlertCircle,
  CheckCircle2, Eye, FileText
} from 'lucide-react'
import { MOCK_EXPORTACOES, KPI_EXPORTACOES } from '@/lib/mock-exportacao'
import {
  DESTINO_EXPORTACAO_LABELS,
  DESTINO_EXPORTACAO_COLORS,
  STATUS_EXPORTACAO_LABELS,
  STATUS_EXPORTACAO_COLORS,
  FORMATO_EXPORTACAO_LABELS,
} from '@/lib/types-exportacao'
import type { DestinoExportacao, StatusExportacao, FormatoExportacao } from '@/lib/types-exportacao'

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso))
}

function formatPeriod(inicio: string, fim: string) {
  const d = (s: string) => new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(s))
  return `${d(inicio)} – ${d(fim)}`
}

function ExportacoesContent() {
  const searchParams = useSearchParams()
  const initialDestino = (searchParams.get('destino') ?? '') as DestinoExportacao | ''

  const [search, setSearch]               = useState('')
  const [filterDestino, setFilterDestino] = useState<DestinoExportacao | ''>(initialDestino)
  const [filterStatus, setFilterStatus]   = useState<StatusExportacao | ''>('')
  const [filterFormato, setFilterFormato] = useState<FormatoExportacao | ''>('')

  const exportacoes = useMemo(() => {
    return MOCK_EXPORTACOES.filter(e => {
      if (search) {
        const q = search.toLowerCase()
        if (
          !e.codigo.toLowerCase().includes(q) &&
          !DESTINO_EXPORTACAO_LABELS[e.destino].toLowerCase().includes(q)
        ) return false
      }
      if (filterDestino && e.destino !== filterDestino) return false
      if (filterStatus  && e.status  !== filterStatus)  return false
      if (filterFormato && e.formato  !== filterFormato) return false
      return true
    })
  }, [search, filterDestino, filterStatus, filterFormato])

  const selectCls = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exportações BackOffice"
        description="Gerencie todas as exportações de obras musicais para sociedades, distribuidores e parceiros."
        actions={
          <Link
            href="/master/backoffice/exportacoes/nova"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Exportação
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total',        value: KPI_EXPORTACOES.total,       icon: Package,      color: 'text-white/80'    },
          { label: 'Enviadas',     value: KPI_EXPORTACOES.enviadas,     icon: Upload,       color: 'text-sky-400'     },
          { label: 'Com Retorno',  value: KPI_EXPORTACOES.com_retorno,  icon: RefreshCw,    color: 'text-emerald-400' },
          { label: 'Processadas',  value: KPI_EXPORTACOES.processadas,  icon: CheckCircle2, color: 'text-violet-400'  },
          { label: 'Erros',        value: KPI_EXPORTACOES.erros,        icon: AlertCircle,  color: 'text-red-400'     },
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

      {/* Filter + Table */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Código ou destino…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>

          <select
            value={filterDestino}
            onChange={e => setFilterDestino(e.target.value as DestinoExportacao | '')}
            className={selectCls}
          >
            <option value="">Todos destinos</option>
            {(['socinpro', 'backoffice_music_services', 'parceiro_internacional'] as DestinoExportacao[]).map(d => (
              <option key={d} value={d}>{DESTINO_EXPORTACAO_LABELS[d]}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as StatusExportacao | '')}
            className={selectCls}
          >
            <option value="">Todos status</option>
            {(['preparando', 'gerando', 'enviado', 'processado', 'com_retorno', 'erro'] as StatusExportacao[]).map(s => (
              <option key={s} value={s}>{STATUS_EXPORTACAO_LABELS[s]}</option>
            ))}
          </select>

          <select
            value={filterFormato}
            onChange={e => setFilterFormato(e.target.value as FormatoExportacao | '')}
            className={selectCls}
          >
            <option value="">Todos formatos</option>
            {(['cwr_v22', 'cwr_v30', 'xml', 'csv', 'xlsx'] as FormatoExportacao[]).map(f => (
              <option key={f} value={f}>{FORMATO_EXPORTACAO_LABELS[f]}</option>
            ))}
          </select>

          <span className="text-xs text-white/30 ml-auto">{exportacoes.length} registros</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3 w-36">Código</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-44">Destino</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-28">Formato</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Período</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-24">Obras</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-28">Titulares</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Status</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-28">Data</th>
                <th className="px-5 py-3 w-14" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {exportacoes.map(e => (
                <tr key={e.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-white/60">{e.codigo}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${DESTINO_EXPORTACAO_COLORS[e.destino]}`}>
                      {DESTINO_EXPORTACAO_LABELS[e.destino]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-white/50 font-mono">{FORMATO_EXPORTACAO_LABELS[e.formato]}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm text-white/60">{formatPeriod(e.periodo_inicio, e.periodo_fim)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm tabular-nums text-white/70">{e.total_obras}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm tabular-nums text-white/70">{e.total_titulares}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_EXPORTACAO_COLORS[e.status]}`}>
                      {STATUS_EXPORTACAO_LABELS[e.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-white/40">{formatDate(e.criado_em)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/master/backoffice/exportacoes/${e.id}`}
                      className="flex items-center gap-1 text-xs text-white/30 hover:text-violet-400 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {exportacoes.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-12 text-white/30">
            <FileText className="w-8 h-8" />
            <p className="text-sm">Nenhuma exportação encontrada</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExportacoesPage() {
  return (
    <Suspense fallback={<div className="text-white/30 p-8">Carregando…</div>}>
      <ExportacoesContent />
    </Suspense>
  )
}

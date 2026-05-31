'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  FileText, DollarSign, Globe, AlertCircle, CheckCircle2,
  Clock, ChevronRight, Info, XCircle, RefreshCw,
} from 'lucide-react'
import { MOCK_RECEBIMENTOS } from '@/lib/mock-recebimentos'
import {
  FONTE_LABELS, FONTE_COLORS,
  CATEGORIA_LABELS, CATEGORIA_COLORS,
  STATUS_RECEBIMENTO_LABELS, STATUS_RECEBIMENTO_COLORS,
  DIVERGENCIA_TIPO_LABELS,
} from '@/lib/types-recebimentos'
import type {
  StatusDivergencia, RecebimentoDivergencia,
} from '@/lib/types-recebimentos'

function formatBRL(value?: number | null) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(value)
}

function formatDate(str?: string | null) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

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

type TabId = 'resumo' | 'itens' | 'conciliacao' | 'divergencias' | 'logs'

export default function RecebimentoDetailPage() {
  const params = useParams()
  const id = params?.id as string

  const rec = MOCK_RECEBIMENTOS.find(r => r.id === id)

  const [activeTab, setActiveTab] = useState<TabId>('resumo')
  const [divStatuses, setDivStatuses] = useState<Record<string, StatusDivergencia>>(() => {
    const init: Record<string, StatusDivergencia> = {}
    rec?._divergencias?.forEach(d => { init[d.id] = d.status })
    return init
  })

  if (!rec) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-white/30">
        <AlertCircle className="w-10 h-10" />
        <p className="text-sm">Recebimento não encontrado.</p>
        <Link href="/master/recebimentos" className="text-xs text-violet-400 hover:underline">← Voltar</Link>
      </div>
    )
  }

  function resolveDivergencia(divId: string) {
    setDivStatuses(prev => ({ ...prev, [divId]: 'resolvida' }))
  }
  function ignoreDivergencia(divId: string) {
    setDivStatuses(prev => ({ ...prev, [divId]: 'ignorada' }))
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'itens', label: 'Itens Importados' },
    { id: 'conciliacao', label: 'Conciliação' },
    { id: 'divergencias', label: `Divergências${rec._divergencias && rec._divergencias.length > 0 ? ` (${rec._divergencias.length})` : ''}` },
    { id: 'logs', label: 'Logs' },
  ]

  const divCount = rec._divergencias?.filter(d => ['aberta', 'em_analise'].includes(divStatuses[d.id] ?? d.status)).length ?? 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-white/30">
        <Link href="/master/recebimentos" className="hover:text-white/60 transition-colors">Recebimentos</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white/50">{rec.codigo}</span>
      </div>

      {/* Categoria Banner */}
      {rec.categoria === 'informativo' ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/10 border border-sky-500/30">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-sm text-sky-300">
            Recebimento <span className="font-semibold">INFORMATIVO</span>. ECAD já paga titulares diretamente. Apenas BI/auditoria, sem distribuição interna.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/30">
          <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-sm text-violet-300">
            Recebimento <span className="font-semibold">OPERACIONAL</span>. Será distribuído aos titulares após conciliação.
          </p>
        </div>
      )}

      <PageHeader
        title={rec.codigo}
        description={`Importado em ${formatDate(rec.data_importacao)} · Período: ${formatDate(rec.periodo_inicio)} a ${formatDate(rec.periodo_fim)}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${FONTE_COLORS[rec.fonte]}`}>
              {FONTE_LABELS[rec.fonte]}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORIA_COLORS[rec.categoria]}`}>
              {CATEGORIA_LABELS[rec.categoria]}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_RECEBIMENTO_COLORS[rec.status]}`}>
              {STATUS_RECEBIMENTO_LABELS[rec.status]}
            </span>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-violet-600 text-white'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumo ─────────────────────────────────────────────────────── */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { label: 'Fonte',        value: FONTE_LABELS[rec.fonte] },
              { label: 'Categoria',    value: CATEGORIA_LABELS[rec.categoria] },
              { label: 'Período',      value: `${formatDate(rec.periodo_inicio)} – ${formatDate(rec.periodo_fim)}` },
              { label: 'Moeda',        value: rec.moeda },
              { label: 'Valor Bruto',  value: `${rec.moeda} ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(rec.valor_bruto)}` },
              { label: 'Valor Líquido',value: `${rec.moeda} ${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(rec.valor_liquido)}` },
              { label: 'Cotação',      value: rec.cotacao ? `R$ ${rec.cotacao.toFixed(4)}` : '—' },
              { label: 'Valor BRL',    value: formatBRL(rec.valor_brl) },
            ].map(item => (
              <div key={item.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
                <p className="text-[10px] text-white/30 mb-1">{item.label}</p>
                <p className="text-sm font-semibold text-white/80">{item.value}</p>
              </div>
            ))}
          </div>

          {rec.observacoes && (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4">
              <p className="text-[10px] text-white/30 mb-1">Observações</p>
              <p className="text-sm text-white/60 leading-relaxed">{rec.observacoes}</p>
            </div>
          )}

          <div className="flex justify-end">
            {rec.status === 'conciliado' ? (
              <button className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
                <DollarSign className="w-4 h-4" /> Distribuir
              </button>
            ) : (
              <div className="relative group">
                <button disabled className="flex items-center gap-1.5 h-9 px-5 rounded-lg bg-white/5 text-sm text-white/30 font-semibold cursor-not-allowed border border-white/[0.06]">
                  <DollarSign className="w-4 h-4" /> Distribuir
                </button>
                <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block z-10 px-2.5 py-1.5 bg-[#1a2540] border border-white/[0.06] rounded-lg text-xs text-white/60 whitespace-nowrap shadow-xl">
                  Apenas disponível após conciliação
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Itens Importados ─────────────────────────────────────────── */}
      {activeTab === 'itens' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          {rec.fonte === 'ecad_socinpro' && rec._ecad && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Sociedade', 'Período', 'Título Importado', 'Autores', 'Valor', 'Categoria', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._ecad.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-white/60">{item.sociedade}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.periodo}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{item.titulo_importado ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/45">{item.autores_importados ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{formatBRL(item.valor)}</td>
                      <td className="px-4 py-3 text-xs text-white/45">{item.categoria_execucao ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rec.fonte === 'backoffice_music_services' && rec._backoffice && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Plataforma', 'ISRC', 'ISWC', 'Execuções', 'V. Bruto', 'V. Líquido', 'Moeda', 'Território', '% Ctrl', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._backoffice.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm text-white/70">{item.plataforma}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.isrc ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.iswc ?? '—'}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-white/50">{item.quantidade_execucoes.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-white/60">{item.valor_bruto.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-emerald-400">{item.valor_liquido.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/40">{item.moeda}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{item.territorio ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.percentual_controlado != null ? `${item.percentual_controlado}%` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rec.fonte === 'sync' && rec._sync && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Tipo Sync', 'Licenciado', 'Obra ID', 'V. Bruto', 'V. Líquido', 'Moeda', 'Território', 'Data', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._sync.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-white/60">{item.tipo_sync}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{item.licenciado ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.obra_id}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-white/60">{item.valor_bruto.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-emerald-400">{item.valor_liquido.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/40">{item.moeda}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{item.territorio}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.data_recebimento ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rec.fonte === 'internacional' && rec._internacionais && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Origem', 'Subeditora', 'Território', 'Moeda Orig.', 'V. Original', 'Cotação', 'V. Convertido', 'Data Câmbio', '% Ctrl', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._internacionais.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs text-white/60">{item.origem}</td>
                      <td className="px-4 py-3 text-sm text-white/70">{item.subeditora ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{item.territorio ?? '—'}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/40">{item.moeda_original}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-white/60">{item.valor_original.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-white/50">{item.cotacao?.toFixed(4) ?? '—'}</td>
                      <td className="px-4 py-3 text-xs tabular-nums text-emerald-400">{formatBRL(item.valor_convertido)}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{item.data_cambio ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.percentual_controlado != null ? `${item.percentual_controlado}%` : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rec.fonte === 'acordo_direto' && rec._acordos && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Parceiro', 'Tipo Receita', 'Valor', 'Moeda', 'Território', 'Data Recebimento', 'Status'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._acordos.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-sm text-white/70">{item.parceiro}</td>
                      <td className="px-4 py-3 text-xs text-white/60">{item.tipo_receita ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{item.valor.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs font-mono text-white/40">{item.moeda}</td>
                      <td className="px-4 py-3 text-xs text-white/40">{item.territorio ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.data_recebimento ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Conciliação ──────────────────────────────────────────────── */}
      {activeTab === 'conciliacao' && (
        <div className="space-y-4">
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white/70">Status da Conciliação</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Status Geral', value: STATUS_RECEBIMENTO_LABELS[rec.status], color: STATUS_RECEBIMENTO_COLORS[rec.status] },
                { label: 'Divergências', value: divCount > 0 ? `${divCount} abertas` : 'Nenhuma', color: divCount > 0 ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
                { label: 'Valor BRL', value: formatBRL(rec.valor_brl), color: 'text-emerald-300' },
                { label: 'Moeda', value: `${rec.moeda}${rec.cotacao ? ` @ ${rec.cotacao}` : ''}`, color: 'text-white/60' },
              ].map(item => (
                <div key={item.label} className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3">
                  <p className="text-[10px] text-white/30 mb-1">{item.label}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.color}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06]">
              <h3 className="text-xs font-semibold text-white/50">Itens Conciliados</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Identificador', 'Status', '% Controlado', 'Valor Atribuído'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec.fonte === 'ecad_socinpro' && rec._ecad?.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.obra_id ?? item.titulo_importado ?? '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{item.status}</span></td>
                      <td className="px-4 py-3 text-xs text-white/40">—</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{formatBRL(item.valor)}</td>
                    </tr>
                  ))}
                  {rec.fonte === 'backoffice_music_services' && rec._backoffice?.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.isrc ?? '—'}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{item.status}</span></td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.percentual_controlado != null ? `${item.percentual_controlado}%` : '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{item.moeda} {item.valor_liquido.toFixed(2)}</td>
                    </tr>
                  ))}
                  {rec.fonte === 'sync' && rec._sync?.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.obra_id}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{item.status}</span></td>
                      <td className="px-4 py-3 text-xs text-white/40">—</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{formatBRL(item.valor_liquido)}</td>
                    </tr>
                  ))}
                  {rec.fonte === 'internacional' && rec._internacionais?.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.obra_id ?? item.origem}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{item.status}</span></td>
                      <td className="px-4 py-3 text-xs text-white/50">{item.percentual_controlado != null ? `${item.percentual_controlado}%` : '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{formatBRL(item.valor_convertido)}</td>
                    </tr>
                  ))}
                  {rec.fonte === 'acordo_direto' && rec._acordos?.map(item => (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-xs font-mono text-white/50">{item.obra_id ?? item.parceiro}</td>
                      <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${item.status === 'conciliado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : item.status === 'divergente' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>{item.status}</span></td>
                      <td className="px-4 py-3 text-xs text-white/40">—</td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-emerald-400">{formatBRL(item.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Divergências ────────────────────────────────────────────── */}
      {activeTab === 'divergencias' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          {(!rec._divergencias || rec._divergencias.length === 0) ? (
            <div className="flex flex-col items-center gap-2 py-16 text-white/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400/40" />
              <p className="text-sm">Nenhuma divergência registrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Tipo', 'Descrição', 'Status', 'Resolução', 'Ações'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-white/30 px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {rec._divergencias.map((div: RecebimentoDivergencia) => {
                    const currentStatus = divStatuses[div.id] ?? div.status
                    return (
                      <tr key={div.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {DIVERGENCIA_TIPO_LABELS[div.tipo]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/60 max-w-xs">{div.descricao ?? '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_DIV_COLORS[currentStatus]}`}>
                            {STATUS_DIV_LABELS[currentStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">{div.resolucao_observacao ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resolveDivergencia(div.id)}
                              disabled={currentStatus === 'resolvida' || currentStatus === 'ignorada'}
                              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              Resolver
                            </button>
                            <button
                              onClick={() => ignoreDivergencia(div.id)}
                              disabled={currentStatus === 'resolvida' || currentStatus === 'ignorada'}
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
          )}
        </div>
      )}

      {/* ── Tab: Logs ────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-2">
          {(!rec._logs || rec._logs.length === 0) ? (
            <div className="flex flex-col items-center gap-2 py-16 text-white/30">
              <Clock className="w-8 h-8" />
              <p className="text-sm">Nenhum log registrado</p>
            </div>
          ) : (
            rec._logs.map((log, i) => (
              <div key={log.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                  {i < (rec._logs?.length ?? 0) - 1 && <div className="w-px flex-1 bg-white/[0.06] mt-1" />}
                </div>
                <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 mb-2 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                    <span className="text-xs font-semibold text-violet-400">{log.evento}</span>
                    <span className="text-[10px] text-white/30 font-mono">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                  </div>
                  <p className="text-sm text-white/60">{log.mensagem ?? '—'}</p>
                  {log.usuario && <p className="text-xs text-white/25 mt-1">{log.usuario}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

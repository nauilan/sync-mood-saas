'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  ArrowLeft, Download, FileText, Package, CheckCircle2,
  XCircle, AlertCircle, Clock, RefreshCw, ChevronRight
} from 'lucide-react'
import { MOCK_EXPORTACOES } from '@/lib/mock-exportacao'
import {
  DESTINO_EXPORTACAO_LABELS,
  DESTINO_EXPORTACAO_COLORS,
  STATUS_EXPORTACAO_LABELS,
  STATUS_EXPORTACAO_COLORS,
  FORMATO_EXPORTACAO_LABELS,
} from '@/lib/types-exportacao'
import type { StatusObraExportacao } from '@/lib/types-exportacao'

type Tab = 'resumo' | 'obras' | 'logs' | 'retorno'

function formatDate(iso?: string | null, withTime = false) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(iso))
}

const OBRA_STATUS_COLORS: Record<StatusObraExportacao, string> = {
  incluida:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
  aceita:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejeitada:  'bg-red-500/20 text-red-300 border-red-500/30',
  divergente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

const OBRA_STATUS_LABELS: Record<StatusObraExportacao, string> = {
  incluida:   'Incluída',
  aceita:     'Aceita',
  rejeitada:  'Rejeitada',
  divergente: 'Divergente',
}

const LOG_EVENTO_COLORS: Record<string, string> = {
  criado:     'bg-slate-500/20 text-slate-300 border-slate-500/30',
  gerando:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
  gerado:     'bg-violet-500/20 text-violet-300 border-violet-500/30',
  enviado:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  processado: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  retorno:    'bg-teal-500/20 text-teal-300 border-teal-500/30',
  erro:       'bg-red-500/20 text-red-300 border-red-500/30',
}

export default function ExportacaoDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('resumo')

  const exportacao = useMemo(() => {
    return MOCK_EXPORTACOES.find(e => e.id === id) ?? null
  }, [id])

  const sortedLogs = useMemo(() => {
    if (!exportacao?._logs) return []
    return [...exportacao._logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }, [exportacao])

  if (!exportacao) {
    return (
      <div className="space-y-6">
        <PageHeader title="Exportação não encontrada" />
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl flex flex-col items-center gap-3 py-16 text-white/30">
          <FileText className="w-10 h-10" />
          <p className="text-sm">Nenhuma exportação com ID <span className="font-mono">{id}</span></p>
          <Link
            href="/master/backoffice/exportacoes"
            className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 mt-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para a lista
          </Link>
        </div>
      </div>
    )
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'resumo', label: 'Resumo' },
    { key: 'obras',  label: 'Obras Incluídas' },
    { key: 'logs',   label: 'Logs' },
    { key: 'retorno', label: 'Retorno' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={exportacao.codigo}
        description="Detalhes da exportação de obras musicais"
        actions={
          <Link
            href="/master/backoffice/exportacoes"
            className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        }
      />

      {/* Header info bar */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-lg font-bold font-mono text-white">{exportacao.codigo}</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${DESTINO_EXPORTACAO_COLORS[exportacao.destino]}`}>
            {DESTINO_EXPORTACAO_LABELS[exportacao.destino]}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_EXPORTACAO_COLORS[exportacao.status]}`}>
            {STATUS_EXPORTACAO_LABELS[exportacao.status]}
          </span>
          <div className="flex items-center gap-4 ml-auto text-[11px] text-white/35 flex-wrap">
            <span>Criado: <span className="text-white/55">{formatDate(exportacao.criado_em, true)}</span></span>
            <span>Enviado: <span className="text-white/55">{formatDate(exportacao.enviado_em, true)}</span></span>
            <span>Processado: <span className="text-white/55">{formatDate(exportacao.processado_em, true)}</span></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0d1526] border border-white/[0.06] rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`h-8 px-4 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === t.key
                ? 'bg-violet-600 text-white'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Resumo ── */}
      {activeTab === 'resumo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Destino',        value: DESTINO_EXPORTACAO_LABELS[exportacao.destino],  color: 'text-violet-300' },
              { label: 'Formato',        value: FORMATO_EXPORTACAO_LABELS[exportacao.formato],  color: 'text-sky-300'    },
              { label: 'Período Início', value: formatDate(exportacao.periodo_inicio),            color: 'text-white/70'   },
              { label: 'Período Fim',    value: formatDate(exportacao.periodo_fim),               color: 'text-white/70'   },
              { label: 'Total Obras',    value: String(exportacao.total_obras),                   color: 'text-emerald-300'},
              { label: 'Total Titulares',value: String(exportacao.total_titulares),               color: 'text-amber-300'  },
            ].map(card => (
              <div key={card.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-3 flex flex-col gap-1">
                <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold">{card.label}</p>
                <p className={`text-sm font-semibold ${card.color} leading-snug break-words`}>{card.value}</p>
              </div>
            ))}
          </div>

          {/* Status card */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="bg-white/[0.04] rounded-lg p-2">
                <FileText className="w-5 h-5 text-white/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/80">Arquivo Gerado</p>
                <p className="text-xs text-white/35 mt-0.5 font-mono">
                  {exportacao.arquivo_url ?? 'Arquivo ainda não gerado'}
                </p>
              </div>
            </div>
            <a
              href={exportacao.arquivo_url ?? '#'}
              download
              onClick={e => { if (!exportacao.arquivo_url) e.preventDefault() }}
              className={`flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-colors ${
                exportacao.arquivo_url
                  ? 'bg-violet-600 hover:bg-violet-500 text-white'
                  : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/[0.06]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              {exportacao.arquivo_url ? 'Baixar Arquivo' : 'Indisponível'}
            </a>
          </div>

          {exportacao.hash && (
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-semibold mb-1">Hash SHA-256</p>
              <p className="text-xs font-mono text-white/40 break-all">{exportacao.hash}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Obras Incluídas ── */}
      {activeTab === 'obras' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <p className="text-xs text-white/40">{exportacao._obras?.length ?? 0} obras nesta exportação</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left text-xs font-semibold text-white/30 px-5 py-3">Título</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-36">Código</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Status</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3">Cód. Externo</th>
                  <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 pr-5">ISWC Retornado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {(exportacao._obras ?? []).map(obra => (
                  <tr key={obra.obra_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white/80 font-medium">{obra.obra_titulo ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-white/50">{obra.obra_codigo ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${OBRA_STATUS_COLORS[obra.status_obra]}`}>
                        {OBRA_STATUS_LABELS[obra.status_obra]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-white/45">
                        {obra.codigo_externo_retornado ?? <span className="text-white/25 italic not-italic">—</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 pr-5">
                      <span className="text-xs font-mono text-white/45">
                        {obra.iswc_retornado ?? <span className="text-white/25 italic not-italic">—</span>}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(!exportacao._obras || exportacao._obras.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-12 text-white/30">
              <Package className="w-8 h-8" />
              <p className="text-sm">Nenhuma obra registrada</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Logs ── */}
      {activeTab === 'logs' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
          {sortedLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-white/30">
              <Clock className="w-8 h-8" />
              <p className="text-sm">Nenhum log registrado</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[14px] top-4 bottom-4 w-px bg-white/[0.06]" />

              {sortedLogs.map((log, idx) => {
                const eventColor = LOG_EVENTO_COLORS[log.evento] ?? 'bg-white/10 text-white/50 border-white/20'
                return (
                  <div key={log.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {/* Dot */}
                    <div className="relative z-10 shrink-0 w-7 h-7 rounded-full bg-[#0d1526] border border-white/[0.10] flex items-center justify-center mt-0.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-violet-500/60" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${eventColor}`}>
                          {log.evento}
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          {formatDate(log.timestamp, true)}
                        </span>
                      </div>
                      {log.mensagem && (
                        <p className="text-xs text-white/55 mt-1.5 leading-relaxed">{log.mensagem}</p>
                      )}
                      {log.dados_json && (
                        <div className="mt-1.5 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-2">
                          <pre className="text-[10px] font-mono text-white/35 whitespace-pre-wrap">
                            {JSON.stringify(log.dados_json, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Retorno ── */}
      {activeTab === 'retorno' && (
        <div className="space-y-4">
          {exportacao._retorno ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0d1526] border border-emerald-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400 tabular-nums">{exportacao._retorno.total_aceitas}</p>
                  <p className="text-xs text-white/35 mt-1">Aceitas</p>
                </div>
                <div className="bg-[#0d1526] border border-red-500/20 rounded-xl p-4 text-center">
                  <XCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400 tabular-nums">{exportacao._retorno.total_rejeitadas}</p>
                  <p className="text-xs text-white/35 mt-1">Rejeitadas</p>
                </div>
                <div className="bg-[#0d1526] border border-amber-500/20 rounded-xl p-4 text-center">
                  <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-400 tabular-nums">{exportacao._retorno.total_divergencias}</p>
                  <p className="text-xs text-white/35 mt-1">Divergências</p>
                </div>
              </div>

              {/* Download retorno */}
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="bg-white/[0.04] rounded-lg p-2">
                    <RefreshCw className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/80">Arquivo de Retorno</p>
                    <p className="text-xs text-white/35 mt-0.5">
                      Processado em: {formatDate(exportacao._retorno.processado_em, true)}
                    </p>
                    <p className="text-xs font-mono text-white/30 mt-0.5">
                      {exportacao._retorno.arquivo_retorno_url ?? 'URL indisponível'}
                    </p>
                  </div>
                </div>
                <a
                  href={exportacao._retorno.arquivo_retorno_url ?? '#'}
                  download
                  onClick={e => { if (!exportacao._retorno?.arquivo_retorno_url) e.preventDefault() }}
                  className={`flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-semibold transition-colors ${
                    exportacao._retorno.arquivo_retorno_url
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : 'bg-white/[0.04] text-white/25 cursor-not-allowed border border-white/[0.06]'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Retorno
                </a>
              </div>
            </>
          ) : (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl flex flex-col items-center gap-3 py-16 text-white/30">
              <RefreshCw className="w-10 h-10" />
              <p className="text-sm">Nenhum retorno processado ainda</p>
              <p className="text-xs text-white/20">O retorno será disponível após o processamento pela entidade destino.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

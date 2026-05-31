'use client'

import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronLeft, FileText, Mail, MessageCircle, Globe, CheckCircle,
  Eye, XCircle, Clock, AlertTriangle, Send,
} from 'lucide-react'
import { MOCK_PRESTACOES } from '@/lib/mock-prestacao'
import {
  PRESTACAO_STATUS_LABELS, PRESTACAO_STATUS_COLORS,
  STATUS_ENVIO_LABELS, STATUS_ENVIO_COLORS,
  CANAL_ENVIO_LABELS, STATUS_CONTESTACAO_LABELS, STATUS_CONTESTACAO_COLORS,
  type StatusEnvio,
} from '@/lib/types-prestacao'

const ENVIO_STATUS_ICONS: Record<StatusEnvio, React.ReactNode> = {
  enfileirado: <Clock className="w-3.5 h-3.5 text-white/40" />,
  enviado: <Send className="w-3.5 h-3.5 text-sky-400" />,
  entregue: <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />,
  visualizado: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
  erro: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
}

type Tab = 'resumo' | 'itens' | 'envios' | 'contestacoes'

function PrestacaoDetalheContent() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('resumo')
  const prestacao = MOCK_PRESTACOES.find(p => p.id === id)

  if (!prestacao) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <FileText className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Prestação não encontrada.</p>
        <Link href="/master/prestacao-contas" className="text-violet-400 text-xs hover:underline">Voltar</Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'itens', label: `Itens (${prestacao.itens.length})` },
    { id: 'envios', label: `Envios (${prestacao.envios.length})` },
    { id: 'contestacoes', label: `Contestações (${prestacao.contestacoes.length})` },
  ]

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/master/prestacao-contas" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </Link>
        <PageHeader title={prestacao.codigo} description={`${prestacao.titular_nome} · ${prestacao.titular_tipo}`} className="mb-0 flex-1" />
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${PRESTACAO_STATUS_COLORS[prestacao.status]}`}>
          {PRESTACAO_STATUS_LABELS[prestacao.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-2xl p-4">
          <p className="text-[10px] text-white/40 mb-1">Valor Bruto</p>
          <p className="text-xl font-bold text-white/70 tabular-nums">{fmtBRL(prestacao.valor_bruto)}</p>
        </div>
        <div className="bg-[#0d1526] border border-rose-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-rose-400/70 mb-1">Retenções</p>
          <p className="text-xl font-bold text-rose-400 tabular-nums">-{fmtBRL(prestacao.retencoes_total)}</p>
        </div>
        <div className="bg-[#0d1526] border border-amber-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400/70 mb-1">Recoupment</p>
          <p className="text-xl font-bold text-amber-400 tabular-nums">-{fmtBRL(prestacao.recoupment_aplicado)}</p>
        </div>
        <div className="bg-[#0d1526] border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-emerald-400/70 mb-1">Valor Líquido</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{fmtBRL(prestacao.valor_liquido)}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={['h-9 px-4 text-xs font-medium rounded-t-lg transition-colors border-b-2', tab === t.id ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-white/40 hover:text-white/70'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-[10px] text-white/30">Titular</p><p className="text-white/70">{prestacao.titular_nome}</p></div>
            <div><p className="text-[10px] text-white/30">Período</p><p className="text-white/70">{fmtDate(prestacao.periodo_inicio)} – {fmtDate(prestacao.periodo_fim)}</p></div>
            <div><p className="text-[10px] text-white/30">Canal de Envio</p><p className="text-white/70">{prestacao.canal_envio ? CANAL_ENVIO_LABELS[prestacao.canal_envio] : '—'}</p></div>
            <div><p className="text-[10px] text-white/30">Data Envio</p><p className="text-white/70">{prestacao.data_envio ? fmtDate(prestacao.data_envio) : '—'}</p></div>
            <div><p className="text-[10px] text-white/30">Data Aprovação</p><p className="text-white/70">{prestacao.data_aprovacao ? fmtDate(prestacao.data_aprovacao) : '—'}</p></div>
            <div><p className="text-[10px] text-white/30">PDF</p>
              {prestacao.pdf_url
                ? <a href={prestacao.pdf_url} className="text-violet-400 text-xs hover:underline">Baixar PDF</a>
                : <span className="text-white/30">—</span>
              }
            </div>
          </div>
        </div>
      )}

      {tab === 'itens' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Obra</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Recebimento</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor Bruto</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-violet-500/60 uppercase tracking-wider">%</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Valor Líq.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {prestacao.itens.map(item => (
                <tr key={item.id} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3">
                    <p className="text-sm text-white/70">{item.obra_titulo}</p>
                    <p className="text-[10px] font-mono text-white/30">{item.obra_codigo}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-white/50">{item.recebimento_descricao ?? item.recebimento_id ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-white/60 tabular-nums">{fmtBRL(item.valor_bruto)}</td>
                  <td className="px-4 py-3 text-right text-xs text-violet-400 tabular-nums">{item.percentual_aplicado}%</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-400 tabular-nums">{fmtBRL(item.valor_liquido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'envios' && (
        <div className="space-y-3">
          {prestacao.envios.map(e => (
            <div key={e.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {ENVIO_STATUS_ICONS[e.status]}
                <div>
                  <p className="text-sm text-white/70">{e.destino}</p>
                  <p className="text-[10px] text-white/30">{CANAL_ENVIO_LABELS[e.canal]} · tentativa {e.tentativa} · {e.enviado_em ? new Date(e.enviado_em).toLocaleDateString('pt-BR') : 'aguardando'}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_ENVIO_COLORS[e.status]}`}>
                {STATUS_ENVIO_LABELS[e.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {tab === 'contestacoes' && (
        <div className="space-y-3">
          {prestacao.contestacoes.length === 0 ? (
            <div className="bg-[#0d1526] border border-emerald-500/10 rounded-xl p-8 text-center">
              <p className="text-emerald-400 text-sm font-semibold">Sem contestações</p>
              <p className="text-white/30 text-xs mt-1">Nenhum valor foi contestado para esta prestação.</p>
            </div>
          ) : (
            prestacao.contestacoes.map(c => (
              <div key={c.id} className="bg-[#0d1526] border border-rose-500/10 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-sm font-semibold text-rose-400">{c.motivo}</span>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_CONTESTACAO_COLORS[c.status]}`}>
                    {STATUS_CONTESTACAO_LABELS[c.status]}
                  </span>
                </div>
                {c.descricao && <p className="text-xs text-white/50">{c.descricao}</p>}
                {c.resposta && (
                  <div className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <p className="text-[10px] text-white/30 mb-1">Resposta da equipe:</p>
                    <p className="text-xs text-white/60">{c.resposta}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-white/30">Aberta em {new Date(c.criada_em).toLocaleDateString('pt-BR')}</p>
                  {c.status === 'aberta' || c.status === 'em_analise' ? (
                    <button className="h-7 px-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors">
                      Resolver
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function PrestacaoDetalhePage() {
  return (
    <Suspense fallback={<div className="text-white/30 text-sm p-8">Carregando...</div>}>
      <PrestacaoDetalheContent />
    </Suspense>
  )
}

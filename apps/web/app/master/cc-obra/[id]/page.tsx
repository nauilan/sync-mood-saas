'use client'

import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronLeft, Music, DollarSign, TrendingUp, TrendingDown,
  AlertTriangle, ArrowUpCircle, ArrowDownCircle, Users, Activity,
} from 'lucide-react'
import { MOCK_CC_OBRAS, fmtBRL, fmtDate } from '@/lib/mock-cc'
import {
  TIPO_MOVIMENTO_OBRA_LABELS, TIPO_MOVIMENTO_OBRA_COLORS,
  ORIGEM_RECEBIMENTO_LABELS, type TipoMovimentoObra, type TipoDestino,
} from '@/lib/types-cc'

const TIPO_DESTINO_LABELS: Record<TipoDestino, string> = {
  autor: 'Autor', editora: 'Editora', administradora: 'Administradora',
  cessionario_pf: 'Cessionário PF', cessionario_pj: 'Cessionário PJ',
  investidor: 'Investidor', herdeiro: 'Herdeiro',
}

// Parseia descricao em campos estruturados
function parseDescricao(desc?: string) {
  if (!desc) return null
  const parts = desc.split(' | ')
  const header = parts[0]
  const fields: { label: string; value: string }[] = []
  for (const part of parts.slice(1)) {
    const i = part.indexOf(':')
    if (i > -1) fields.push({ label: part.slice(0, i).trim(), value: part.slice(i + 1).trim() })
  }
  return { header, fields }
}

type Tab = 'resumo' | 'movimentos' | 'distribuicoes' | 'bloqueios'

function CCObraDetalheContent() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('resumo')

  const obra = MOCK_CC_OBRAS.find(o => o.obra_id === id || o.id === id)

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Music className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Obra não encontrada.</p>
        <Link href="/master/cc-obra" className="text-violet-400 text-xs hover:underline">Voltar</Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'movimentos', label: `Movimentos (${obra.movimentos.length})` },
    { id: 'distribuicoes', label: `Distribuições (${obra.distribuicoes.length})` },
    { id: 'bloqueios', label: `Bloqueios (${obra.bloqueios.length})` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/master/cc-obra" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </Link>
        <PageHeader
          title={obra.obra_titulo}
          description={`${obra.obra_codigo}${obra.obra_iswc ? ` · ${obra.obra_iswc}` : ''} · CC Obra`}
          className="mb-0 flex-1"
        />
      </div>

      {/* Saldo cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-emerald-400/70 mb-1">Saldo Atual</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{fmtBRL(obra.saldo_atual)}</p>
        </div>
        <div className="bg-[#0d1526] border border-sky-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-sky-400/70 mb-1">Saldo Bloqueado</p>
          <p className="text-xl font-bold text-sky-400 tabular-nums">{fmtBRL(obra.saldo_bloqueado)}</p>
        </div>
        <div className="bg-[#0d1526] border border-violet-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-violet-400/70 mb-1">Total Distribuído</p>
          <p className="text-xl font-bold text-violet-400 tabular-nums">{fmtBRL(obra.saldo_distribuido)}</p>
        </div>
        <div className="bg-[#0d1526] border border-amber-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400/70 mb-1">Pendente Distrib.</p>
          <p className="text-xl font-bold text-amber-400 tabular-nums">{fmtBRL(obra.saldo_pendente)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'h-9 px-4 text-xs font-medium rounded-t-lg transition-colors border-b-2',
              tab === t.id
                ? 'border-violet-500 text-violet-400 bg-violet-500/5'
                : 'border-transparent text-white/40 hover:text-white/70',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'resumo' && (
        <div className="space-y-6">
          {/* Evolução 12 meses — bar chart simples */}
          <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Evolução 12 meses</h3>
            <div className="flex items-end gap-2 h-32">
              {obra.evolucao_12m.map((m, i) => {
                const maxVal = Math.max(...obra.evolucao_12m.map(x => x.entradas), 1)
                const h = Math.max(4, (m.entradas / maxVal) * 100)
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-gradient-to-t from-violet-600/60 to-violet-400/40 min-h-[4px]"
                      style={{ height: `${h}%` }}
                      title={`${m.label}: ${fmtBRL(m.entradas)}`}
                    />
                    <span className="text-[9px] text-white/30">{m.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-white/25 mt-2">Entradas mensais (DSP + Sync + Internacional)</p>
          </div>
        </div>
      )}

      {tab === 'movimentos' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.05]">
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Tipo</th>
                <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden md:table-cell">Descrição</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor Líquido</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider hidden sm:table-cell">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {obra.movimentos.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-xs text-white/50 whitespace-nowrap tabular-nums">{fmtDate(m.data_movimento)}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${TIPO_MOVIMENTO_OBRA_COLORS[m.tipo_movimento]}`}>
                      {TIPO_MOVIMENTO_OBRA_LABELS[m.tipo_movimento]}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {(() => {
                      const parsed = parseDescricao(m.descricao)
                      if (!parsed) return <p className="text-xs text-white/60">{m.descricao}</p>
                      return (
                        <div>
                          <p className="text-xs text-white/60 font-medium">{parsed.header}</p>
                          {parsed.fields.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {parsed.fields.map(f => (
                                <span key={f.label} className="inline-flex items-center gap-1 text-[10px] bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">
                                  <span className="text-white/30">{f.label}:</span>
                                  <span className="text-white/65">{f.value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className={[
                      'text-sm font-semibold tabular-nums',
                      m.tipo_movimento === 'entrada' ? 'text-emerald-400' :
                      m.tipo_movimento === 'distribuicao' ? 'text-violet-400' :
                      'text-rose-400',
                    ].join(' ')}>
                      {m.tipo_movimento === 'entrada' ? '+' : '-'}{fmtBRL(m.valor_liquido)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {m.origem_recebimento && (
                      <span className="text-[10px] text-white/40">{ORIGEM_RECEBIMENTO_LABELS[m.origem_recebimento]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'distribuicoes' && (
        <div className="space-y-3">
          {obra.distribuicoes.length === 0 ? (
            <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-8 text-center text-white/30 text-sm">
              Nenhuma distribuição registrada ainda.
            </div>
          ) : (
            obra.distribuicoes.map(d => (
              <div key={d.id} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{d.titular_nome}</p>
                    <p className="text-[10px] text-white/35">{d.link_descricao} · {TIPO_DESTINO_LABELS[d.tipo_destino]}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-violet-400 tabular-nums">{fmtBRL(d.valor_destinado)}</p>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                    <span className="text-[10px] text-white/35">{d.percentual_aplicado}%</span>
                    {d.irpf_incide !== undefined && (
                      d.irpf_incide
                        ? <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">IRPF INCIDE</span>
                        : <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">IRPF NÃO INCIDE</span>
                    )}
                    <span className={[
                      'text-[9px] px-1.5 py-0.5 rounded border',
                      d.status === 'creditado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      d.status === 'bloqueado' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20',
                    ].join(' ')}>
                      {d.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'bloqueios' && (
        <div className="space-y-3">
          {obra.bloqueios.length === 0 ? (
            <div className="bg-[#0d1526] border border-emerald-500/10 rounded-xl p-8 text-center">
              <p className="text-emerald-400 text-sm font-semibold">Nenhum bloqueio ativo</p>
              <p className="text-white/30 text-xs mt-1">Todos os vínculos estão regulares.</p>
            </div>
          ) : (
            obra.bloqueios.map((b, i) => (
              <div key={i} className={[
                'flex items-start gap-3 p-4 rounded-xl border',
                b.gravidade === 'critico'
                  ? 'bg-rose-500/5 border-rose-500/20'
                  : 'bg-amber-500/5 border-amber-500/20',
              ].join(' ')}>
                <AlertTriangle className={['w-4 h-4 mt-0.5 shrink-0', b.gravidade === 'critico' ? 'text-rose-400' : 'text-amber-400'].join(' ')} />
                <div>
                  <p className={['text-xs font-semibold', b.gravidade === 'critico' ? 'text-rose-400' : 'text-amber-400'].join(' ')}>
                    {b.tipo.replace(/_/g, ' ').toUpperCase()}
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">{b.descricao}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function CCObraDetalhePage() {
  return (
    <Suspense fallback={<div className="text-white/30 text-sm p-8">Carregando...</div>}>
      <CCObraDetalheContent />
    </Suspense>
  )
}

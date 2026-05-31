'use client'

import { useState, Suspense } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import {
  ChevronLeft, Users, AlertTriangle, ArrowUpCircle, ArrowDownCircle,
  TrendingDown, DollarSign, Info,
} from 'lucide-react'
import { MOCK_CC_TITULARES, fmtBRL, fmtDate } from '@/lib/mock-cc'
import {
  TIPO_MOVIMENTO_TITULAR_LABELS,
} from '@/lib/types-cc'

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

type Tab = 'resumo' | 'movimentos' | 'recoupment' | 'pagamentos' | 'cessao'

function CCTitularDetalheContent() {
  const { id } = useParams<{ id: string }>()
  const [tab, setTab] = useState<Tab>('resumo')

  const titular = MOCK_CC_TITULARES.find(t => t.titular_id === id || t.id === id)

  if (!titular) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Users className="w-10 h-10 text-white/20" />
        <p className="text-white/40 text-sm">Titular não encontrado.</p>
        <Link href="/master/cc-titular" className="text-violet-400 text-xs hover:underline">Voltar</Link>
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'resumo', label: 'Resumo' },
    { id: 'movimentos', label: `Movimentos (${titular.movimentos.length})` },
    { id: 'recoupment', label: 'Recoupment' },
    { id: 'pagamentos', label: `Pagamentos (${titular.pagamentos_historicos.length})` },
    ...(titular.cessao_info ? [{ id: 'cessao' as Tab, label: 'Cessão' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/master/cc-titular" className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors">
          <ChevronLeft className="w-4 h-4 text-white/50" />
        </Link>
        <PageHeader
          title={titular.titular_nome}
          description={`${titular.titular_codigo} · ${titular.titular_tipo} · ${titular.editora_nome ?? ''}`}
          className="mb-0 flex-1"
        />
      </div>

      {/* Saldo cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0d1526] border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-emerald-400/70 mb-1">Saldo Atual</p>
          <p className="text-xl font-bold text-emerald-400 tabular-nums">{fmtBRL(titular.saldo_atual)}</p>
        </div>
        <div className="bg-[#0d1526] border border-sky-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-sky-400/70 mb-1">Saldo Liberado</p>
          <p className="text-xl font-bold text-sky-400 tabular-nums">{fmtBRL(titular.saldo_liberado)}</p>
        </div>
        <div className="bg-[#0d1526] border border-amber-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-amber-400/70 mb-1">Saldo Bloqueado</p>
          <p className="text-xl font-bold text-amber-400 tabular-nums">{fmtBRL(titular.saldo_bloqueado)}</p>
        </div>
        <div className="bg-[#0d1526] border border-violet-500/10 rounded-2xl p-4">
          <p className="text-[10px] text-violet-400/70 mb-1">Total Pago</p>
          <p className="text-xl font-bold text-violet-400 tabular-nums">{fmtBRL(titular.saldo_pago)}</p>
        </div>
      </div>

      {/* IRPF badge */}
      <div className={['flex items-center gap-2 px-4 py-2.5 rounded-xl border w-fit', titular.titular_tipo === 'PF' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'].join(' ')}>
        {titular.titular_tipo === 'PF'
          ? <span className="text-sm font-semibold text-amber-400">IRPF INCIDE — 27.5%</span>
          : <span className="text-sm font-semibold text-emerald-400">IRPF NÃO INCIDE — Cessão PJ</span>
        }
      </div>

      {/* Bloqueios */}
      {titular.bloqueios.length > 0 && (
        <div className="space-y-2">
          {titular.bloqueios.map((b, i) => (
            <div key={i} className={['flex items-start gap-3 p-3 rounded-xl border', b.gravidade === 'critico' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-amber-500/5 border-amber-500/20'].join(' ')}>
              <AlertTriangle className={['w-4 h-4 mt-0.5 shrink-0', b.gravidade === 'critico' ? 'text-rose-400' : 'text-amber-400'].join(' ')} />
              <div>
                <p className={['text-xs font-semibold', b.gravidade === 'critico' ? 'text-rose-400' : 'text-amber-400'].join(' ')}>{b.tipo.replace(/_/g, ' ').toUpperCase()}</p>
                <p className="text-xs text-white/50 mt-0.5">{b.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06]">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={['h-9 px-4 text-xs font-medium rounded-t-lg transition-colors border-b-2', tab === t.id ? 'border-violet-500 text-violet-400 bg-violet-500/5' : 'border-transparent text-white/40 hover:text-white/70'].join(' ')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumo' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 text-white/50 text-sm">
          <p>Titular: <span className="text-white/80 font-medium">{titular.titular_nome}</span></p>
          <p className="mt-2">Código: <span className="text-white/60 font-mono text-xs">{titular.titular_codigo}</span></p>
          <p className="mt-2">Editora: <span className="text-white/60">{titular.editora_nome ?? '—'}</span></p>
          <p className="mt-2">Status CC: <span className={titular.status === 'ativa' ? 'text-emerald-400' : 'text-rose-400'}>{titular.status}</span></p>
          <p className="mt-2">Última movimentação: <span className="text-white/60">{titular.data_ultima_movimentacao ? fmtDate(titular.data_ultima_movimentacao) : '—'}</span></p>
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
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Valor Líq.</th>
                <th className="text-right px-5 py-3 text-[10px] font-semibold text-rose-500/60 uppercase tracking-wider hidden sm:table-cell">Retenções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {titular.movimentos.map(m => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-xs text-white/50 tabular-nums whitespace-nowrap">{fmtDate(m.data_movimento)}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold bg-white/5 text-white/50 border-white/10">
                      {TIPO_MOVIMENTO_TITULAR_LABELS[m.tipo_movimento]}
                    </span>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    {(() => {
                      const parsed = parseDescricao(m.descricao)
                      if (!parsed) return (
                        <>
                          <p className="text-xs text-white/55">{m.descricao}</p>
                          {m.origem_obra_titulo && <p className="text-[10px] text-white/30">{m.origem_obra_titulo}</p>}
                        </>
                      )
                      return (
                        <div>
                          <p className="text-xs text-white/60 font-medium">{parsed.header}</p>
                          {m.origem_obra_titulo && <p className="text-[10px] text-white/30 mb-1">{m.origem_obra_titulo}</p>}
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
                    <span className={['text-sm font-semibold tabular-nums', m.tipo_movimento === 'credito' ? 'text-emerald-400' : m.tipo_movimento === 'pagamento' ? 'text-rose-400' : 'text-amber-400'].join(' ')}>
                      {m.valor_liquido > 0 ? fmtBRL(m.valor_liquido) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right hidden sm:table-cell">
                    {m.retencoes_total > 0
                      ? <span className="text-xs text-rose-400 tabular-nums">-{fmtBRL(m.retencoes_total)}</span>
                      : <span className="text-xs text-white/25">—</span>
                    }
                    {m.retencoes.map(r => (
                      <p key={r.id} className="text-[9px] text-white/25">{r.tipo_retencao.toUpperCase()} {r.percentual}%</p>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'recoupment' && (
        titular.recoupment_ativo ? (
          <div className="space-y-4">
            <div className="bg-[#0d1526] border border-amber-500/10 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/70">Recoupment Ativo — {titular.recoupment_ativo.contrato_numero}</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">Em Recoupment</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div><p className="text-[10px] text-white/40">Adiantamento</p><p className="text-sm font-bold text-white/70 tabular-nums">{fmtBRL(titular.recoupment_ativo.valor_adiantado)}</p></div>
                <div><p className="text-[10px] text-white/40">Recuperado</p><p className="text-sm font-bold text-emerald-400 tabular-nums">{fmtBRL(titular.recoupment_ativo.valor_recuperado)}</p></div>
                <div><p className="text-[10px] text-white/40">Saldo Devedor</p><p className="text-sm font-bold text-rose-400 tabular-nums">{fmtBRL(titular.recoupment_ativo.saldo_devedor)}</p></div>
              </div>
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-white/40">Progresso recuperação</span>
                  <span className="text-[10px] font-semibold text-amber-400">{titular.recoupment_ativo.percentual_recuperado.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 transition-all" style={{ width: `${titular.recoupment_ativo.percentual_recuperado}%` }} />
                </div>
              </div>
            </div>
            {titular.recoupment_ativo.historico.length > 0 && (
              <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.05]"><h4 className="text-xs font-semibold text-white/50">Histórico de Abates</h4></div>
                <div className="divide-y divide-white/[0.04]">
                  {titular.recoupment_ativo.historico.map((h, i) => (
                    <div key={i} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60">{h.origem}</p>
                        <p className="text-[10px] text-white/30">{fmtDate(h.data)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-emerald-400 tabular-nums">-{fmtBRL(h.valor_abatido)}</p>
                        <p className="text-[10px] text-white/30 tabular-nums">{fmtBRL(h.saldo_posterior)} restante</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[#0d1526] border border-emerald-500/10 rounded-xl p-8 text-center">
            <p className="text-emerald-400 text-sm font-semibold">Sem recoupment ativo</p>
            <p className="text-white/30 text-xs mt-1">Nenhum adiantamento pendente de recuperação.</p>
          </div>
        )
      )}

      {tab === 'pagamentos' && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
          {titular.pagamentos_historicos.length === 0 ? (
            <div className="p-8 text-center text-white/30 text-sm">Nenhum pagamento realizado ainda.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Data</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Método</th>
                  <th className="text-right px-5 py-3 text-[10px] font-semibold text-emerald-500/60 uppercase tracking-wider">Valor</th>
                  <th className="text-left px-5 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {titular.pagamentos_historicos.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-xs text-white/50 tabular-nums">{fmtDate(p.data)}</td>
                    <td className="px-5 py-3 text-xs text-white/60">{p.metodo}</td>
                    <td className="px-5 py-3 text-right text-sm font-semibold text-emerald-400 tabular-nums">{fmtBRL(p.valor)}</td>
                    <td className="px-5 py-3">
                      <span className={['text-[10px] font-semibold px-1.5 py-0.5 rounded border', p.status === 'pago' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'].join(' ')}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'cessao' && titular.cessao_info && (
        <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-5 space-y-4">
          <div className={['flex items-center gap-3 p-4 rounded-xl border', titular.cessao_info.irpf_incide ? 'bg-amber-500/5 border-amber-500/20' : 'bg-emerald-500/5 border-emerald-500/20'].join(' ')}>
            <Info className={['w-5 h-5 shrink-0', titular.cessao_info.irpf_incide ? 'text-amber-400' : 'text-emerald-400'].join(' ')} />
            <div>
              <p className={['text-sm font-semibold', titular.cessao_info.irpf_incide ? 'text-amber-400' : 'text-emerald-400'].join(' ')}>
                {titular.cessao_info.irpf_incide ? 'IRPF INCIDE — 27.5%' : 'IRPF NÃO INCIDE'}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {titular.cessao_info.tipo === 'PJ' ? 'Cessão para Pessoa Jurídica — não há retenção de IRPF' : 'Cessão de Pessoa Física — retenção IRPF obrigatória na fonte'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[10px] text-white/30">Cedente</p><p className="text-white/70">{titular.cessao_info.cedente_nome}</p></div>
            <div><p className="text-[10px] text-white/30">Cessionário</p><p className="text-white/70">{titular.cessao_info.cessionario_nome}</p></div>
            <div><p className="text-[10px] text-white/30">Vencimento</p><p className={titular.cessao_info.cessao_vencida ? 'text-rose-400 font-semibold' : 'text-white/70'}>{titular.cessao_info.data_vencimento ? fmtDate(titular.cessao_info.data_vencimento) : '—'}{titular.cessao_info.cessao_vencida ? ' ⚠ VENCIDA' : ''}</p></div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CCTitularDetalhePage() {
  return (
    <Suspense fallback={<div className="text-white/30 text-sm p-8">Carregando...</div>}>
      <CCTitularDetalheContent />
    </Suspense>
  )
}

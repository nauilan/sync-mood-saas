'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import {
  Search, DollarSign, CheckCircle2, AlertCircle, Clock,
  TrendingUp, Receipt, X, CalendarDays,
} from 'lucide-react'
import { MOCK_PARCELAS } from '@/lib/mock-cobrancas'
import type { ParcelaCobranca, StatusParcela, PreviewDistribuicaoItem } from '@/lib/types-cobrancas'
import { STATUS_PARCELA_LABELS, STATUS_PARCELA_COLORS, isAtrasada } from '@/lib/types-cobrancas'
import { TIPO_AUTORIZACAO_LABELS } from '@/lib/types-autorizacoes'
import type { TipoAutorizacao } from '@/lib/types-autorizacoes'
import { getLinksById } from '@/lib/mock-obras'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  }).format(v)
}

function fmtDate(d: string) {
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

/** Calcular preview de distribuicao via getLinksById */
function calcPreviewDistribuicao(obra_id: string, valor: number): PreviewDistribuicaoItem[] {
  const links = getLinksById(obra_id)
  if (!links.length) return []
  const items: PreviewDistribuicaoItem[] = []
  for (const link of links) {
    for (const tit of link.titulares ?? []) {
      const valorTit = Math.round(valor * (tit.percentual / 100) * 100) / 100
      items.push({
        nome: tit.nome,
        papel: tit.papel,
        percentual: tit.percentual,
        valor: valorTit,
      })
    }
  }
  return items
}

/** Recebido no mes corrente */
function recebidoMesCorrente(parcelas: ParcelaCobranca[]): number {
  const agora = new Date()
  const anoMes = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
  return parcelas
    .filter(p => p.status === 'pago' && p.data_pagamento?.startsWith(anoMes))
    .reduce((s, p) => s + p.valor, 0)
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CobrancasPage() {
  // estado da lista
  const [parcelas, setParcelas] = useState<ParcelaCobranca[]>(() =>
    MOCK_PARCELAS.map(p => ({
      ...p,
      status: isAtrasada(p) ? 'atrasado' : p.status,
    }))
  )

  // filtros
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusParcela | ''>('')
  const [filterAuth, setFilterAuth]   = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')

  // modal de confirmacao
  const [modalParcela, setModalParcela] = useState<ParcelaCobranca | null>(null)
  const [modalData, setModalData]       = useState(todayISO())
  const [modalObs, setModalObs]         = useState('')

  // lista filtrada
  const listaFiltrada = useMemo(() => {
    return parcelas.filter(p => {
      if (filterStatus && p.status !== filterStatus) return false
      if (filterAuth && p.autorizacao_id !== filterAuth) return false
      if (filterPeriodo) {
        if (!p.data_vencimento.startsWith(filterPeriodo)) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.autorizacao_codigo.toLowerCase().includes(q) &&
          !p.obra_titulo.toLowerCase().includes(q) &&
          !p.licenciado_nome.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [parcelas, search, filterStatus, filterAuth, filterPeriodo])

  // KPIs
  const totalAReceber = parcelas
    .filter(p => p.status !== 'pago')
    .reduce((s, p) => s + p.valor, 0)
  const recebidoMes = recebidoMesCorrente(parcelas)
  const atrasados   = parcelas.filter(p => p.status === 'atrasado').length
  const pendentes   = parcelas.filter(p => p.status === 'pendente').length

  // preview distribuicao do modal
  const previewDistribuicao: PreviewDistribuicaoItem[] = useMemo(() => {
    if (!modalParcela) return []
    return calcPreviewDistribuicao(modalParcela.obra_id, modalParcela.valor)
  }, [modalParcela])

  // confirmar recebimento
  function confirmarRecebimento() {
    if (!modalParcela) return
    const descricao = `Recebimento parcela ${modalParcela.parcela_numero}/${modalParcela.parcela_total} - Autorizacao ${modalParcela.autorizacao_codigo} - ${modalParcela.tipo_uso_label} - Obra: ${modalParcela.obra_titulo}`
    // Lancamento mock no CC da Obra (somente log client-side)
    console.info('[CC OBRA MOCK]', {
      obra_id: modalParcela.obra_id,
      tipo_movimento: 'entrada',
      origem_recebimento: 'licenciamento',
      valor_bruto: modalParcela.valor,
      valor_liquido: modalParcela.valor,
      descricao,
      data_movimento: new Date(modalData + 'T12:00:00Z').toISOString(),
      distribuicao_preview: previewDistribuicao,
    })
    // Atualiza status da parcela
    setParcelas(prev =>
      prev.map(p =>
        p.id === modalParcela.id
          ? { ...p, status: 'pago', data_pagamento: modalData, observacoes: modalObs || p.observacoes }
          : p
      )
    )
    setModalParcela(null)
    setModalObs('')
    setModalData(todayISO())
  }

  function abrirModal(p: ParcelaCobranca) {
    setModalParcela(p)
    setModalData(todayISO())
    setModalObs('')
  }

  // opcoes unicas de autorizacoes para o filtro
  const autorizacoesUnicas = useMemo(() => {
    const map = new Map<string, string>()
    parcelas.forEach(p => map.set(p.autorizacao_id, p.autorizacao_codigo))
    return Array.from(map.entries())
  }, [parcelas])

  // periodos unicos (YYYY-MM) para o filtro
  const periodosUnicos = useMemo(() => {
    const set = new Set<string>()
    parcelas.forEach(p => set.add(p.data_vencimento.slice(0, 7)))
    return Array.from(set).sort()
  }, [parcelas])

  const sel = 'h-8 bg-white/5 border border-white/[0.06] rounded-lg px-2.5 text-xs text-white/70 focus:outline-none cursor-pointer'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cobrancas"
        description="Parcelas de autorizacoes com modelo Pago a Editora — confirme o recebimento manualmente para lancar no Conta Corrente da Obra"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total a Receber', value: fmtBRL(totalAReceber), color: 'text-amber-300',   icon: TrendingUp },
          { label: 'Recebido Mes',   value: fmtBRL(recebidoMes),   color: 'text-emerald-400', icon: DollarSign },
          { label: 'Atrasados',      value: atrasados,              color: 'text-rose-400',    icon: AlertCircle },
          { label: 'Pendentes',      value: pendentes,              color: 'text-amber-400',   icon: Clock },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0d1526] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              <p className="text-[10px] text-white/35 uppercase tracking-wide">{stat.label}</p>
            </div>
            <p className={`text-xl font-bold leading-tight tabular-nums ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Alerta de atrasados */}
      {atrasados > 0 && (
        <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-400">
            <span className="font-semibold">{atrasados} parcela{atrasados > 1 ? 's' : ''} em atraso</span>
            {' '}— confirme o recebimento ou entre em contato com o licenciado.
          </p>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-[#0d1526] border border-white/[0.06] rounded-xl overflow-hidden">
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white/5 border border-white/[0.06] rounded-lg px-3 h-8">
            <Search className="w-3.5 h-3.5 text-white/30 shrink-0" />
            <input
              type="text"
              placeholder="Autorizacao, obra ou licenciado..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white placeholder:text-white/25 focus:outline-none"
            />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusParcela | '')} className={sel}>
            <option value="">Todos status</option>
            {(['pendente','pago','atrasado'] as StatusParcela[]).map(s => (
              <option key={s} value={s}>{STATUS_PARCELA_LABELS[s]}</option>
            ))}
          </select>
          <select value={filterAuth} onChange={e => setFilterAuth(e.target.value)} className={sel}>
            <option value="">Todas autorizacoes</option>
            {autorizacoesUnicas.map(([id, codigo]) => (
              <option key={id} value={id}>{codigo}</option>
            ))}
          </select>
          <select value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)} className={sel}>
            <option value="">Todos periodos</option>
            {periodosUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <span className="text-xs text-white/30 ml-auto">{listaFiltrada.length} parcelas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs font-semibold text-white/30 px-5 py-3">Autorizacao / Obra</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-24">Parcela</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Vencimento</th>
                <th className="text-right text-xs font-semibold text-white/30 px-4 py-3 w-36">Valor</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Status</th>
                <th className="text-left text-xs font-semibold text-white/30 px-4 py-3 w-32">Pgto</th>
                <th className="px-5 py-3 w-40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-white/30">
                    Nenhuma parcela encontrada
                  </td>
                </tr>
              ) : listaFiltrada.map(p => (
                <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-mono text-white/60">{p.autorizacao_codigo}</span>
                      <span className="text-sm font-semibold text-white/85">{p.obra_titulo}</span>
                      <span className="text-[10px] text-white/35">{p.licenciado_nome}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-white/70 tabular-nums">
                      {p.parcela_numero}/{p.parcela_total}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3 text-white/25 shrink-0" />
                      <span className="text-sm text-white/60">{fmtDate(p.data_vencimento)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-sm font-bold tabular-nums text-white/85">
                      {fmtBRL(p.valor)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_PARCELA_COLORS[p.status]}`}>
                      {STATUS_PARCELA_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {p.data_pagamento ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="text-xs text-emerald-400">{fmtDate(p.data_pagamento)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.status !== 'pago' ? (
                      <button
                        onClick={() => abrirModal(p)}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-xs text-white font-semibold transition-colors whitespace-nowrap"
                      >
                        <Receipt className="w-3 h-3" />
                        Confirmar Recebimento
                      </button>
                    ) : (
                      <span className="text-xs text-white/20 px-1">Recebido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de confirmacao */}
      {modalParcela && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0d1526] border border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-white/[0.06]">
              <div className="flex flex-col gap-0.5">
                <p className="text-xs text-white/40 font-mono">{modalParcela.autorizacao_codigo}</p>
                <h2 className="text-base font-bold text-white">Confirmar Recebimento</h2>
                <p className="text-xs text-white/50">
                  Parcela {modalParcela.parcela_numero}/{modalParcela.parcela_total} — {modalParcela.obra_titulo}
                </p>
              </div>
              <button
                onClick={() => setModalParcela(null)}
                className="text-white/30 hover:text-white/60 transition-colors mt-0.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Resumo da parcela */}
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Tipo</span>
                  <span className="text-white/70">{TIPO_AUTORIZACAO_LABELS[modalParcela.tipo_autorizacao as TipoAutorizacao] ?? modalParcela.tipo_autorizacao}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Licenciado</span>
                  <span className="text-white/70 text-right max-w-[60%] truncate">{modalParcela.licenciado_nome}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/40">Vencimento</span>
                  <span className="text-white/70">{fmtDate(modalParcela.data_vencimento)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-white/[0.05]">
                  <span className="text-xs text-white/40">Valor</span>
                  <span className="text-lg font-bold text-emerald-400 tabular-nums">{fmtBRL(modalParcela.valor)}</span>
                </div>
              </div>

              {/* Data de pagamento */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Data do Pagamento</label>
                <input
                  type="date"
                  value={modalData}
                  max={todayISO()}
                  onChange={e => setModalData(e.target.value)}
                  className="w-full h-9 bg-white/5 border border-white/[0.08] rounded-lg px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Observacoes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-white/50">Observacoes <span className="text-white/25 font-normal">(opcional)</span></label>
                <textarea
                  value={modalObs}
                  onChange={e => setModalObs(e.target.value)}
                  rows={2}
                  placeholder="PIX, transferencia, numero do comprovante..."
                  className="w-full bg-white/5 border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Preview de distribuicao */}
              {previewDistribuicao.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/50">Preview de Distribuicao</p>
                  <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-[10px] text-violet-400/70 uppercase tracking-wide">Serao distribuidos automaticamente:</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {previewDistribuicao.map((item, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white/75 truncate">{item.nome}</span>
                            <span className="text-[10px] text-white/35 capitalize">{item.papel.replace(/_/g, ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white/35">{item.percentual.toFixed(2)}%</span>
                            <span className="text-xs font-bold text-violet-300 tabular-nums">{fmtBRL(item.valor)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {previewDistribuicao.length === 0 && (
                <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-400/70">Nenhum link de obra encontrado para preview de distribuicao. O lancamento sera realizado sem distribuicao automatica.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setModalParcela(null)}
                className="h-9 px-4 rounded-lg text-sm text-white/50 hover:text-white/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRecebimento}
                disabled={!modalData}
                className="flex items-center gap-2 h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm text-white font-semibold transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Recebimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

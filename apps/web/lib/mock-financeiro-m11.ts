// ============================================================
// lib/mock-financeiro-m11.ts — Módulo 11: Financeiro
// 12 pagamentos + 8 recebimentos + 30 fluxo caixa + 4 contas bancárias
// Sync Mood Gestão Inteligente
// ============================================================

import type {
  PagamentoM11, RecebimentoM11, FluxoCaixa, ConciliacaoBancaria,
  ContaBancaria, KpiFinanceiro,
} from './types-financeiro-m11'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fmtBRL(v: number, moeda = 'BRL') {
  if (moeda === 'USD') return v.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtDate(d: string) {
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR')
}

// ════════════════════════════════════════════════════════════════════════════
// CONTAS BANCÁRIAS — 4 contas
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CONTAS_BANCARIAS: ContaBancaria[] = []

// ════════════════════════════════════════════════════════════════════════════
// PAGAMENTOS — 12 pagamentos a titulares
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_PAGAMENTOS: PagamentoM11[] = []

// ════════════════════════════════════════════════════════════════════════════
// RECEBIMENTOS — 8 recebimentos
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_RECEBIMENTOS_FIN: RecebimentoM11[] = []

// ════════════════════════════════════════════════════════════════════════════
// FLUXO DE CAIXA — 30 dias
// ════════════════════════════════════════════════════════════════════════════

function gerarFluxo(): FluxoCaixa[] {
  return []
}

export const MOCK_FLUXO_CAIXA: FluxoCaixa[] = gerarFluxo()

// ════════════════════════════════════════════════════════════════════════════
// CONCILIAÇÃO BANCÁRIA
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CONCILIACAO: ConciliacaoBancaria[] = []

// ════════════════════════════════════════════════════════════════════════════
// KPIs FINANCEIRO
// ════════════════════════════════════════════════════════════════════════════

export const KPI_FINANCEIRO: KpiFinanceiro = {
  a_pagar_30d: MOCK_PAGAMENTOS.filter(p => p.status === 'programado' || p.status === 'em_processamento').reduce((s, p) => s + (p.moeda === 'BRL' ? p.valor : p.valor * 5.10), 0),
  a_receber_30d: MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'previsto').reduce((s, r) => s + r.valor, 0),
  fluxo_caixa_hoje: MOCK_FLUXO_CAIXA.filter(f => f.data === '2026-05-21').reduce((s, f) => s + (f.tipo === 'entrada' ? f.valor : -f.valor), 0),
  saldo_total_contas: MOCK_CONTAS_BANCARIAS.filter(c => c.ativa && c.moeda === 'BRL').reduce((s, c) => s + c.saldo_atual, 0),
  inadimplencia: MOCK_RECEBIMENTOS_FIN.filter(r => r.status === 'inadimplente').reduce((s, r) => s + r.valor, 0),
  impostos_retidos_mes: 0,
}


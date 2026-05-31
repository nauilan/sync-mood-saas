// ============================================================
// lib/types-cobrancas.ts — Modulo 4: Cobrancas de Autorizacoes
// Sync Mood Gestao Inteligente
// Parcelas geradas a partir de autorizacoes modelo_negocio='pago_editora'
// ============================================================

export type StatusParcela = 'pendente' | 'pago' | 'atrasado'

export interface ParcelaCobranca {
  id: string
  autorizacao_id: string
  autorizacao_codigo: string          // ex: AUTH-2025-00001
  tipo_autorizacao: string            // ex: 'fonograma'
  tipo_uso_label: string              // ex: 'Fonograma / Videofonograma'
  obra_id: string
  obra_titulo: string
  licenciado_nome: string
  parcela_numero: number              // ex: 1
  parcela_total: number               // ex: 3
  data_vencimento: string             // YYYY-MM-DD
  valor: number
  status: StatusParcela
  data_pagamento?: string             // YYYY-MM-DD — preenchido ao confirmar
  observacoes?: string
}

/** true se vencimento < hoje E status == 'pendente' */
export function isAtrasada(parcela: ParcelaCobranca): boolean {
  if (parcela.status !== 'pendente') return false
  const vencimento = new Date(parcela.data_vencimento + 'T00:00:00')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return vencimento < hoje
}

// ── Labels & cores ─────────────────────────────────────────────────────────────

export const STATUS_PARCELA_LABELS: Record<StatusParcela, string> = {
  pendente: 'Pendente',
  pago:     'Pago',
  atrasado: 'Atrasado',
}

export const STATUS_PARCELA_COLORS: Record<StatusParcela, string> = {
  pendente: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  pago:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  atrasado: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
}

// ── Preview de distribuicao (calculado no lancamento) ─────────────────────────

export interface PreviewDistribuicaoItem {
  nome: string
  papel: string
  percentual: number
  valor: number
}

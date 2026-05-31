// ============================================================
// lib/types-financeiro-m11.ts — Módulo 11: Financeiro
// Sync Mood Gestão Inteligente
// ============================================================

export type MetodoPagamento = 'pix' | 'ted' | 'boleto' | 'internacional' | 'dinheiro'
export type StatusPagamentoM11 = 'programado' | 'em_processamento' | 'pago' | 'falhou' | 'cancelado'
export type StatusRecebimentoM11 = 'previsto' | 'recebido' | 'inadimplente' | 'cancelado'
export type TipoFluxo = 'entrada' | 'saida'
export type StatusConciliacao = 'pendente' | 'conciliado' | 'divergente'
export type TipoConta = 'corrente' | 'poupanca' | 'investimento'

export interface PagamentoM11 {
  id: string
  codigo: string
  titular_id: string
  titular_nome: string
  titular_tipo: 'PF' | 'PJ'
  prestacao_id?: string
  prestacao_codigo?: string
  valor: number
  moeda: string
  metodo: MetodoPagamento
  banco_origem?: string
  banco_destino?: string
  agencia_destino?: string
  conta_destino?: string
  pix_chave?: string
  data_programada?: string
  data_pagamento?: string
  status: StatusPagamentoM11
  comprovante_url?: string
  motivo_falha?: string
}

export interface RecebimentoM11 {
  id: string
  codigo: string
  fonte_pagadora: string
  recebimento_id?: string
  valor: number
  moeda: string
  metodo?: string
  banco_destino?: string
  data_prevista?: string
  data_recebimento?: string
  status: StatusRecebimentoM11
  observacoes?: string
}

export interface FluxoCaixa {
  id: string
  data: string
  tipo: TipoFluxo
  categoria: string
  descricao?: string
  valor: number
  saldo_acumulado: number
  conta_bancaria_id?: string
}

export interface ConciliacaoBancaria {
  id: string
  conta_bancaria_id: string
  conta_nome: string
  data_extrato: string
  valor_extrato: number
  transacao_id?: string
  status: StatusConciliacao
  observacao?: string
}

export interface ContaBancaria {
  id: string
  banco: string
  agencia?: string
  conta?: string
  tipo: TipoConta
  titular_conta?: string
  saldo_atual: number
  ativa: boolean
  moeda?: string
  bandeira?: string
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface KpiFinanceiro {
  a_pagar_30d: number
  a_receber_30d: number
  fluxo_caixa_hoje: number
  saldo_total_contas: number
  inadimplencia: number
  impostos_retidos_mes: number
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const METODO_PAGAMENTO_LABELS: Record<MetodoPagamento, string> = {
  pix: 'PIX',
  ted: 'TED',
  boleto: 'Boleto',
  internacional: 'Internacional',
  dinheiro: 'Dinheiro',
}

export const STATUS_PAGAMENTO_LABELS: Record<StatusPagamentoM11, string> = {
  programado: 'Programado',
  em_processamento: 'Em Processamento',
  pago: 'Pago',
  falhou: 'Falhou',
  cancelado: 'Cancelado',
}

export const STATUS_PAGAMENTO_COLORS: Record<StatusPagamentoM11, string> = {
  programado: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  em_processamento: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  pago: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  falhou: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  cancelado: 'bg-white/8 text-white/50 border-white/10',
}

export const STATUS_RECEBIMENTO_LABELS: Record<StatusRecebimentoM11, string> = {
  previsto: 'Previsto',
  recebido: 'Recebido',
  inadimplente: 'Inadimplente',
  cancelado: 'Cancelado',
}

export const STATUS_RECEBIMENTO_COLORS: Record<StatusRecebimentoM11, string> = {
  previsto: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  recebido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  inadimplente: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  cancelado: 'bg-white/8 text-white/50 border-white/10',
}

export const STATUS_CONCILIACAO_LABELS: Record<StatusConciliacao, string> = {
  pendente: 'Pendente',
  conciliado: 'Conciliado',
  divergente: 'Divergente',
}

export const STATUS_CONCILIACAO_COLORS: Record<StatusConciliacao, string> = {
  pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  conciliado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  divergente: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

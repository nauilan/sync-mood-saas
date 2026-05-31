// ============================================================
// lib/types-conciliacao.ts — Modulo 7: Conciliacao
// Sync Mood Gestao Inteligente
// ============================================================

// ── Enums / Union Types ───────────────────────────────────────────────────────

export type ConciliacaoStatus =
  | 'pendente'
  | 'em_andamento'
  | 'concluida'
  | 'com_divergencia'

export type ConciliacaoItemStatus = 'validado' | 'divergente' | 'ajustado'

export type ConciliacaoDivergenciaTipo =
  | 'obra_nao_localizada'
  | 'titular_nao_localizado'
  | 'contrato_invalido'
  | 'percentual_invalido'
  | 'territorio_invalido'
  | 'direito_nao_cedido'
  | 'recebedor_incorreto'

export type ConciliacaoDivergenciaStatus = 'aberta' | 'em_analise' | 'resolvida' | 'ignorada'

// ── Tabelas ───────────────────────────────────────────────────────────────────

export interface Conciliacao {
  id:               string
  recebimento_id:   string   // polymorphic: rec-XXX or tv-recv-XXX
  periodo:          string
  status:           ConciliacaoStatus
  iniciada_em?:     string | null
  finalizada_em?:   string | null
  total_itens:      number
  total_validados:  number
  total_divergentes:number
  editora_id?:      string | null
  // relacoes
  _itens?:          ConciliacaoItem[]
  _divergencias?:   ConciliacaoDivergencia[]
  // helpers
  _fonte_label?:    string
  _recebimento_valor?: number
}

export interface ConciliacaoItem {
  id:                  string
  conciliacao_id:      string
  obra_id?:            string | null
  titular_id?:         string | null
  valor_bruto:         number
  percentual_aplicado: number
  valor_calculado:     number
  status:              ConciliacaoItemStatus
  observacao?:         string | null
  // helpers
  _obra_titulo?:       string
  _titular_nome?:      string
  _divergencias?:      ConciliacaoDivergencia[]
}

export interface ConciliacaoDivergencia {
  id:                     string
  conciliacao_item_id:    string
  tipo:                   ConciliacaoDivergenciaTipo
  status:                 ConciliacaoDivergenciaStatus
  resolucao_observacao?:  string | null
}

// ── Labels e Colors ───────────────────────────────────────────────────────────

export const CONCILIACAO_STATUS_LABELS: Record<ConciliacaoStatus, string> = {
  pendente:         'Pendente',
  em_andamento:     'Em Andamento',
  concluida:        'Concluida',
  com_divergencia:  'Com Divergencia',
}

export const CONCILIACAO_STATUS_COLORS: Record<ConciliacaoStatus, string> = {
  pendente:         'bg-slate-500/20 text-slate-300 border-slate-500/30',
  em_andamento:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  concluida:        'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  com_divergencia:  'bg-red-500/20 text-red-300 border-red-500/30',
}

export const CONCILIACAO_ITEM_STATUS_LABELS: Record<ConciliacaoItemStatus, string> = {
  validado:   'Validado',
  divergente: 'Divergente',
  ajustado:   'Ajustado',
}

export const CONCILIACAO_ITEM_STATUS_COLORS: Record<ConciliacaoItemStatus, string> = {
  validado:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  divergente: 'bg-red-500/20 text-red-300 border-red-500/30',
  ajustado:   'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

export const CONCILIACAO_DIVERGENCIA_TIPO_LABELS: Record<ConciliacaoDivergenciaTipo, string> = {
  obra_nao_localizada:    'Obra nao localizada',
  titular_nao_localizado: 'Titular nao localizado',
  contrato_invalido:      'Contrato invalido',
  percentual_invalido:    'Percentual invalido',
  territorio_invalido:    'Territorio invalido',
  direito_nao_cedido:     'Direito nao cedido',
  recebedor_incorreto:    'Recebedor incorreto',
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export interface KpiConciliacoes {
  pendentes:        number
  em_andamento:     number
  concluidas:       number
  com_divergencia:  number
}

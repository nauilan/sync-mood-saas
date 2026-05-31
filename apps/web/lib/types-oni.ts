// ============================================================
// lib/types-oni.ts — Modulo ONI: Obras Nao Identificadas
// Sync Mood Gestao Inteligente — M5 BackOffice
// ============================================================

// ── ONI Row (linha do XLSX da lista BackOffice) ───────────────────────────────

export interface ONIRow {
  Ranking: number
  ONI_CODE: string
  Title: string
  Subtitle: string | null
  Performer: string
  Writers: string
  ISRC: string | null
  First_Informed_Date: string          // DD/MM/YYYY
  RoyaltyRange_Spotify: string
  RoyaltyRange_Youtube: string
  RoyaltyRange_Others: string
  Claimed: 'Y' | null
}

// ── ONI List (cabecalho de uma lista importada) ───────────────────────────────

export type ONIListStatus =
  | 'processando'
  | 'em_revisao'
  | 'aprovado'
  | 'exportado'

export interface ONIList {
  id: string
  filename: string
  data_lista: string                   // YYYY-MM-DD
  total_onis: number
  processed_at: string | null
  status: ONIListStatus
  matches_count: number
  aprovados_count: number
}

// ── ONI Match (resultado do cruzamento) ─────────────────────────────────────

export type ONIMatchConfidence = 'alta' | 'media' | 'baixa'
export type ONIMatchStatus =
  | 'pendente'
  | 'aprovado'
  | 'rejeitado'
  | 'manual_review'

export type ONIMatchCriterio = 'titulo' | 'autor' | 'interprete' | 'isrc'

export interface ONIMatch {
  id: string
  lista_id: string
  oni_code: string
  obra_id: string | null               // null = sem match
  submitter_songcode: string | null    // codigo interno da editora
  score: number                        // 0 a 1
  criterios_matched: ONIMatchCriterio[]
  confidence: ONIMatchConfidence
  status: ONIMatchStatus
  // dados espelhados da ONI row para exibicao rapida
  oni_title: string
  oni_performer: string
  oni_writers: string
  oni_isrc: string | null
  oni_royalty_spotify: string
  oni_royalty_youtube: string
  oni_royalty_others: string
  oni_claimed: 'Y' | null
  oni_first_date: string
  // dados espelhados da obra do catalogo
  obra_titulo: string | null
  obra_codigo: string | null
  obra_interpretes: string | null
  obra_autores: string | null
  obra_isrc: string | null
}

// ── ONI Identificacao (CSV exportado para o BackOffice) ─────────────────────

export interface ONIIdentificacao {
  id: string
  lista_id: string
  total_aprovados: number
  exported_at: string
  csv_filename: string
}

// ── Labels & helpers ──────────────────────────────────────────────────────────

export const ONI_LIST_STATUS_LABELS: Record<ONIListStatus, string> = {
  processando:  'Processando',
  em_revisao:   'Em Revisao',
  aprovado:     'Aprovado',
  exportado:    'Exportado',
}

export const ONI_LIST_STATUS_COLORS: Record<ONIListStatus, string> = {
  processando:  'bg-sky-500/15 text-sky-400 border-sky-500/20',
  em_revisao:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
  aprovado:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  exportado:    'bg-violet-500/15 text-violet-400 border-violet-500/20',
}

export const ONI_CONFIDENCE_LABELS: Record<ONIMatchConfidence, string> = {
  alta:   'Alta',
  media:  'Media',
  baixa:  'Baixa',
}

export const ONI_CONFIDENCE_COLORS: Record<ONIMatchConfidence, string> = {
  alta:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  media: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  baixa: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
}

export const ONI_MATCH_STATUS_LABELS: Record<ONIMatchStatus, string> = {
  pendente:      'Pendente',
  aprovado:      'Aprovado',
  rejeitado:     'Rejeitado',
  manual_review: 'Revisao Manual',
}

export const ONI_MATCH_STATUS_COLORS: Record<ONIMatchStatus, string> = {
  pendente:      'bg-white/[0.05] text-white/40 border-white/10',
  aprovado:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  rejeitado:     'bg-rose-500/15 text-rose-400 border-rose-500/20',
  manual_review: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
}

export const ONI_CRITERIO_LABELS: Record<ONIMatchCriterio, string> = {
  titulo:     'Titulo',
  autor:      'Autor',
  interprete: 'Interprete',
  isrc:       'ISRC',
}

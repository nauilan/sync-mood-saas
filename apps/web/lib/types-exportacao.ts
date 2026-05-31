// ============================================================
// lib/types-exportacao.ts — Módulo 5: Exportação / BackOffice
// Sync Mood Gestão Inteligente
// ============================================================

// ── Enums ─────────────────────────────────────────────────────────────────────

export type DestinoExportacao =
  | 'socinpro'
  | 'backoffice_music_services'
  | 'parceiro_internacional'

export type FormatoExportacao =
  | 'cwr_v21'
  | 'cwr_v22'
  | 'cwr_v30'
  | 'xml'
  | 'csv'
  | 'xlsx'

export type StatusExportacao =
  | 'preparando'
  | 'gerando'
  | 'enviado'
  | 'processado'
  | 'com_retorno'
  | 'erro'

export type StatusObraExportacao =
  | 'incluida'
  | 'aceita'
  | 'rejeitada'
  | 'divergente'

// ── Labels e Colors ───────────────────────────────────────────────────────────

export const DESTINO_EXPORTACAO_LABELS: Record<DestinoExportacao, string> = {
  socinpro:                   'SOCINPRO',
  backoffice_music_services:  'BackOffice Music Services',
  parceiro_internacional:     'Parceiro Internacional',
}

export const FORMATO_EXPORTACAO_LABELS: Record<FormatoExportacao, string> = {
  cwr_v21: 'CWR v2.1',
  cwr_v22: 'CWR v2.2',
  cwr_v30: 'CWR v3.0',
  xml:     'XML',
  csv:     'CSV',
  xlsx:    'XLSX',
}

export const STATUS_EXPORTACAO_LABELS: Record<StatusExportacao, string> = {
  preparando:   'Preparando',
  gerando:      'Gerando',
  enviado:      'Enviado',
  processado:   'Processado',
  com_retorno:  'Com Retorno',
  erro:         'Erro',
}

export const STATUS_EXPORTACAO_COLORS: Record<StatusExportacao, string> = {
  preparando:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
  gerando:      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  enviado:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  processado:   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  com_retorno:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  erro:         'bg-red-500/20 text-red-300 border-red-500/30',
}

export const DESTINO_EXPORTACAO_COLORS: Record<DestinoExportacao, string> = {
  socinpro:                   'bg-violet-500/20 text-violet-300 border-violet-500/30',
  backoffice_music_services:  'bg-sky-500/20 text-sky-300 border-sky-500/30',
  parceiro_internacional:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface ExportacaoObra {
  exportacao_id:            string
  obra_id:                  string
  obra_titulo?:             string
  obra_codigo?:             string
  status_obra:              StatusObraExportacao
  codigo_externo_retornado?:string | null
  iswc_retornado?:          string | null
}

export interface ExportacaoLog {
  id:            string
  exportacao_id: string
  evento:        string
  mensagem?:     string | null
  dados_json?:   Record<string, unknown> | null
  timestamp:     string
}

export interface ExportacaoRetorno {
  id:                  string
  exportacao_id:       string
  arquivo_retorno_url?:string | null
  total_aceitas:       number
  total_rejeitadas:    number
  total_divergencias:  number
  processado_em:       string
}

export interface Exportacao {
  id:              string
  codigo:          string
  destino:         DestinoExportacao
  formato:         FormatoExportacao
  periodo_inicio:  string
  periodo_fim:     string
  total_obras:     number
  total_titulares: number
  status:          StatusExportacao
  arquivo_url?:    string | null
  hash?:           string | null
  criado_por?:     string | null
  editora_id?:     string | null
  criado_em:       string
  enviado_em?:     string | null
  processado_em?:  string | null
  // relações carregadas
  _obras?:         ExportacaoObra[]
  _logs?:          ExportacaoLog[]
  _retorno?:       ExportacaoRetorno | null
}

// ── KPI helpers ───────────────────────────────────────────────────────────────

export interface KpiExportacoes {
  total:        number
  enviadas:     number
  com_retorno:  number
  erros:        number
  processadas:  number
}

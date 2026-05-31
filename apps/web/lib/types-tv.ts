// ============================================================
// lib/types-tv.ts — Modulo 6 TV: Tipos TypeScript
// Sync Mood Gestao Inteligente
// ============================================================

// ── Enums / Union Types ───────────────────────────────────────────────────────

export type TvFormatoArquivo = 'xls' | 'xlsx' | 'csv' | 'pdf' | 'cue_sheet'

export type TvTipoUso =
  | 'abertura'
  | 'encerramento'
  | 'tema'
  | 'fundo'
  | 'performance'
  | 'trailer'
  | 'teaser'
  | 'chamada'
  | 'vinheta'
  | 'publicidade'
  | 'incidental'

export type TvMatchingCriterio = 'titulo_autor' | 'titulo_interprete' | 'iswc' | 'manual'

export type TvMatchingStatus = 'auto_match' | 'sugerido' | 'confirmado' | 'divergente' | 'sem_match'

export type TvDivergenciaTipo =
  | 'obra_nao_encontrada'
  | 'similaridade_baixa'
  | 'multiplas_obras'
  | 'autor_divergente'
  | 'titulo_diferente'
  | 'editora_ausente'
  | 'percentual_nao_identificado'
  | 'obra_sem_contrato'
  | 'obra_sem_controle_valido'
  | 'tipo_uso_indefinido'

export type TvDivergenciaStatus = 'aberta' | 'em_analise' | 'resolvida' | 'ignorada'

export type TvAutorizacaoStatus = 'calculada' | 'faturada' | 'paga' | 'cancelada'

export type TvRecebimentoStatus = 'pendente' | 'recebido' | 'conciliado' | 'estornado'

export type TvDistribuicaoStatus = 'pendente' | 'processando' | 'concluida' | 'erro'

// ── Tabelas ───────────────────────────────────────────────────────────────────

export interface TvImportacao {
  id:               string
  codigo:           string
  emissora:         string
  formato_arquivo:  TvFormatoArquivo
  periodo_inicio:   string
  periodo_fim:      string
  total_linhas:     number
  total_matched:    number
  total_divergentes:number
  hash?:            string | null
  importado_em:     string
  editora_id?:      string | null
  // relacoes
  _execucoes?:      TvExecucao[]
}

export interface TvExecucao {
  id:                   string
  importacao_id:        string
  titulo_importado:     string
  interprete_importado?: string | null
  autor_importado?:     string | null
  programa:             string
  capitulo?:            string | null
  data_exibicao:        string
  hora_exibicao?:       string | null
  duracao_seg:          number
  tipo_uso:             TvTipoUso
  emissora:             string
  canal:                string
  plataforma?:          string | null
  territorio:           string
  // relacoes
  _matching?:           TvMatching | null
  _divergencias?:       TvDivergencia[]
}

export interface TvMatching {
  id:           string
  execucao_id:  string
  obra_id?:     string | null
  score:        number
  criterio:     TvMatchingCriterio
  status:       TvMatchingStatus
}

export interface TvDivergencia {
  id:           string
  execucao_id:  string
  tipo:         TvDivergenciaTipo
  descricao?:   string | null
  dados_json?:  Record<string, unknown> | null
  status:       TvDivergenciaStatus
}

export interface TvPrecificacao {
  id:           string
  emissora:     string
  canal:        string
  plataforma?:  string | null
  tipo_uso:     TvTipoUso
  ano:          number
  territorio:   string
  nacional:     boolean
  duracao_min:  number
  duracao_max:  number
  valor_base:   number
  moeda:        string
}

export interface TvAutorizacao {
  id:                                   string
  codigo:                               string
  execucao_id:                          string
  obra_id?:                             string | null
  percentual_controlado:                number
  percentual_autorizado:                number
  valor_calculado:                      number
  valor_negociado?:                     number | null
  territorio:                           string
  prazo_inicio:                         string
  prazo_fim:                            string
  clausula_percentual_controlado_text:  string
  status:                               TvAutorizacaoStatus
  pdf_url?:                             string | null
  // relacoes
  _execucao?:                           TvExecucao
  _obra_titulo?:                        string
}

export interface TvRecebimento {
  id:               string
  autorizacao_id:   string
  valor_bruto:      number
  valor_liquido:    number
  moeda:            string
  data_recebimento: string
  status:           TvRecebimentoStatus
}

export interface TvDistribuicao {
  id:             string
  recebimento_id: string
  status:         TvDistribuicaoStatus
  processado_em?: string | null
}

// ── Labels e Colors ───────────────────────────────────────────────────────────

export const TV_TIPO_USO_LABELS: Record<TvTipoUso, string> = {
  abertura:    'Abertura',
  encerramento:'Encerramento',
  tema:        'Tema',
  fundo:       'Fundo Musical',
  performance: 'Performance',
  trailer:     'Trailer',
  teaser:      'Teaser',
  chamada:     'Chamada',
  vinheta:     'Vinheta',
  publicidade: 'Publicidade',
  incidental:  'Incidental',
}

export const TV_TIPO_USO_COLORS: Record<TvTipoUso, string> = {
  abertura:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  encerramento:'bg-purple-500/20 text-purple-300 border-purple-500/30',
  tema:        'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  fundo:       'bg-slate-500/20 text-slate-300 border-slate-500/30',
  performance: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  trailer:     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  teaser:      'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  chamada:     'bg-sky-500/20 text-sky-300 border-sky-500/30',
  vinheta:     'bg-teal-500/20 text-teal-300 border-teal-500/30',
  publicidade: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  incidental:  'bg-gray-500/20 text-gray-300 border-gray-500/30',
}

export const TV_MATCHING_STATUS_LABELS: Record<TvMatchingStatus, string> = {
  auto_match:  'Auto Match',
  sugerido:    'Sugerido',
  confirmado:  'Confirmado',
  divergente:  'Divergente',
  sem_match:   'Sem Match',
}

export const TV_MATCHING_STATUS_COLORS: Record<TvMatchingStatus, string> = {
  auto_match:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  sugerido:    'bg-amber-500/20 text-amber-300 border-amber-500/30',
  confirmado:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  divergente:  'bg-red-500/20 text-red-300 border-red-500/30',
  sem_match:   'bg-slate-500/20 text-slate-300 border-slate-500/30',
}

export const TV_AUTORIZACAO_STATUS_LABELS: Record<TvAutorizacaoStatus, string> = {
  calculada:  'Calculada',
  faturada:   'Faturada',
  paga:       'Paga',
  cancelada:  'Cancelada',
}

export const TV_AUTORIZACAO_STATUS_COLORS: Record<TvAutorizacaoStatus, string> = {
  calculada:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  faturada:   'bg-sky-500/20 text-sky-300 border-sky-500/30',
  paga:       'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelada:  'bg-red-500/20 text-red-300 border-red-500/30',
}

export const TV_DIVERGENCIA_TIPO_LABELS: Record<TvDivergenciaTipo, string> = {
  obra_nao_encontrada:          'Obra nao encontrada',
  similaridade_baixa:           'Similaridade baixa',
  multiplas_obras:              'Multiplas obras possiveis',
  autor_divergente:             'Autor divergente',
  titulo_diferente:             'Titulo diferente',
  editora_ausente:              'Editora ausente',
  percentual_nao_identificado:  'Percentual nao identificado',
  obra_sem_contrato:            'Obra sem contrato',
  obra_sem_controle_valido:     'Obra sem controle valido',
  tipo_uso_indefinido:          'Tipo de uso indefinido',
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export interface KpiTV {
  total_identificadas:  number
  total_faturado:       number
  total_recebido:       number
  divergencias_abertas: number
}

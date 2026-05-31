// ============================================================
// lib/types-recebimentos.ts — Módulo 6: Recebimentos
// Sync Mood Gestão Inteligente
// ============================================================

// ── Enums ─────────────────────────────────────────────────────────────────────

export type FonteRecebimento =
  | 'ecad_socinpro'
  | 'backoffice_music_services'
  | 'sync'
  | 'internacional'
  | 'acordo_direto'

export type CategoriaRecebimento =
  | 'informativo'
  | 'operacional'

export type StatusRecebimento =
  | 'importado'
  | 'pendente_matching'
  | 'em_conciliacao'
  | 'conciliado'
  | 'divergente'
  | 'distribuido'
  | 'auditado'

export type TipoDivergencia =
  | 'obra_nao_encontrada'
  | 'isrc_divergente'
  | 'iswc_divergente'
  | 'percentual_invalido'
  | 'titular_ausente'
  | 'obra_sem_contrato'
  | 'obra_sem_link_valido'
  | 'dsp_nao_identificada'
  | 'outros'

export type StatusDivergencia =
  | 'aberta'
  | 'em_analise'
  | 'resolvida'
  | 'ignorada'

export type FormatoImportacao =
  | 'pdf'
  | 'xls'
  | 'xlsx'
  | 'csv'
  | 'txt'
  | 'xml'

export type TipoFonte =
  | 'sociedade'
  | 'dsp'
  | 'cliente_direto'
  | 'subeditora'
  | 'outro'

// ── Labels e Colors ───────────────────────────────────────────────────────────

export const FONTE_LABELS: Record<FonteRecebimento, string> = {
  ecad_socinpro:             'ECAD / SOCINPRO',
  backoffice_music_services: 'BackOffice Music Services',
  sync:                      'Sync',
  internacional:             'Internacional',
  acordo_direto:             'Acordo Direto',
}

export const FONTE_COLORS: Record<FonteRecebimento, string> = {
  ecad_socinpro:             'bg-slate-500/20 text-slate-300 border-slate-500/30',
  backoffice_music_services: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  sync:                      'bg-amber-500/20 text-amber-300 border-amber-500/30',
  internacional:             'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  acordo_direto:             'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

export const CATEGORIA_LABELS: Record<CategoriaRecebimento, string> = {
  informativo:  'Informativo',
  operacional:  'Operacional',
}

export const CATEGORIA_COLORS: Record<CategoriaRecebimento, string> = {
  informativo:  'bg-slate-500/20 text-slate-300 border-slate-500/30',
  operacional:  'bg-violet-500/20 text-violet-300 border-violet-500/30',
}

export const STATUS_RECEBIMENTO_LABELS: Record<StatusRecebimento, string> = {
  importado:          'Importado',
  pendente_matching:  'Pendente Matching',
  em_conciliacao:     'Em Conciliação',
  conciliado:         'Conciliado',
  divergente:         'Divergente',
  distribuido:        'Distribuído',
  auditado:           'Auditado',
}

export const STATUS_RECEBIMENTO_COLORS: Record<StatusRecebimento, string> = {
  importado:          'bg-slate-500/20 text-slate-300 border-slate-500/30',
  pendente_matching:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  em_conciliacao:     'bg-sky-500/20 text-sky-300 border-sky-500/30',
  conciliado:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  divergente:         'bg-red-500/20 text-red-300 border-red-500/30',
  distribuido:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
  auditado:           'bg-teal-500/20 text-teal-300 border-teal-500/30',
}

export const DIVERGENCIA_TIPO_LABELS: Record<TipoDivergencia, string> = {
  obra_nao_encontrada:   'Obra não encontrada',
  isrc_divergente:       'ISRC divergente',
  iswc_divergente:       'ISWC divergente',
  percentual_invalido:   'Percentual inválido',
  titular_ausente:       'Titular ausente',
  obra_sem_contrato:     'Obra sem contrato',
  obra_sem_link_valido:  'Obra sem link válido',
  dsp_nao_identificada:  'DSP não identificada',
  outros:                'Outros',
}

// ── Sub-tabelas ───────────────────────────────────────────────────────────────

export interface RecebimentoImportacao {
  id:               string
  recebimento_id:   string
  arquivo_nome:     string
  arquivo_url?:     string | null
  formato:          FormatoImportacao
  total_linhas:     number
  total_processadas:number
  total_divergentes:number
  hash?:            string | null
  importado_em:     string
  importado_por?:   string | null
}

export interface RecebimentoDivergencia {
  id:                   string
  recebimento_id:       string
  tipo:                 TipoDivergencia
  descricao?:           string | null
  dados_json?:          Record<string, unknown> | null
  status:               StatusDivergencia
  resolucao_observacao?:string | null
}

export interface RecebimentoLog {
  id:            string
  recebimento_id:string
  evento:        string
  mensagem?:     string | null
  usuario?:      string | null
  timestamp:     string
}

export interface RecebimentoEcad {
  id:                string
  recebimento_id?:   string | null
  sociedade:         string
  periodo:           string
  obra_id?:          string | null
  titulo_importado?: string | null
  autores_importados?:string | null
  valor:             number
  categoria_execucao?:string | null
  origem_execucao?:  string | null
  tipo_execucao?:    string | null
  status:            'importado' | 'conciliado' | 'divergente'
}

export interface RecebimentoBackoffice {
  id:                   string
  recebimento_id?:      string | null
  plataforma:           string
  periodo:              string
  obra_id?:             string | null
  fonograma_id?:        string | null
  isrc?:                string | null
  iswc?:                string | null
  quantidade_execucoes: number
  valor_bruto:          number
  valor_liquido:        number
  moeda:                string
  territorio?:          string | null
  percentual_controlado?:number | null
  status:               'importado' | 'conciliado' | 'divergente'
}

export interface RecebimentoSync {
  id:               string
  recebimento_id?:  string | null
  autorizacao_id?:  string | null
  obra_id:          string
  tipo_sync:        string
  licenciado?:      string | null
  valor_bruto:      number
  valor_liquido:    number
  moeda:            string
  territorio:       string
  data_recebimento?:string | null
  status:           'importado' | 'conciliado' | 'divergente'
}

export interface RecebimentoInternacional {
  id:                    string
  recebimento_id?:       string | null
  origem:                string
  subeditora?:           string | null
  territorio?:           string | null
  moeda_original:        string
  valor_original:        number
  cotacao?:              number | null
  valor_convertido:      number
  data_cambio?:          string | null
  obra_id?:              string | null
  percentual_controlado?:number | null
  status:                'importado' | 'conciliado' | 'divergente'
}

export interface RecebimentoAcordoDireto {
  id:               string
  recebimento_id?:  string | null
  origem?:          string | null
  parceiro:         string
  obra_id?:         string | null
  tipo_receita?:    string | null
  valor:            number
  moeda:            string
  territorio?:      string | null
  data_recebimento?:string | null
  status:           'importado' | 'conciliado' | 'divergente'
}

export interface RecebimentoFonte {
  codigo:            string
  nome:              string
  tipo:              TipoFonte
  ativo:             boolean
  configuracoes_json?:Record<string, unknown> | null
}

// ── Tabela principal ──────────────────────────────────────────────────────────

export interface Recebimento {
  id:              string
  codigo:          string
  fonte:           FonteRecebimento
  categoria:       CategoriaRecebimento
  periodo_inicio:  string
  periodo_fim:     string
  valor_bruto:     number
  valor_liquido:   number
  moeda:           string
  cotacao?:        number | null
  valor_brl:       number
  status:          StatusRecebimento
  data_importacao: string
  editora_id?:     string | null
  observacoes?:    string | null
  // relações
  _importacoes?:   RecebimentoImportacao[]
  _divergencias?:  RecebimentoDivergencia[]
  _logs?:          RecebimentoLog[]
  _ecad?:          RecebimentoEcad[]
  _backoffice?:    RecebimentoBackoffice[]
  _sync?:          RecebimentoSync[]
  _internacionais?:RecebimentoInternacional[]
  _acordos?:       RecebimentoAcordoDireto[]
}

// ── KPI helpers ───────────────────────────────────────────────────────────────

export interface KpiRecebimentos {
  total:              number
  valor_total_brl:    number
  operacional:        number
  informativo:        number
  divergencias_abertas:number
  conciliados:        number
}

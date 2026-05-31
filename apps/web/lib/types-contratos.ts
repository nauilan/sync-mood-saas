// lib/types-contratos.ts
// Módulo 2 — Gestão de Contratos

export type StatusContrato =
  | 'rascunho'
  | 'aguardando_assinatura'
  | 'em_vigor'
  | 'suspenso'
  | 'vencendo'
  | 'vencido'
  | 'rescindido'
  | 'revogado'

export type TipoContrato =
  | 'cessao'
  | 'administracao'
  | 'edicao'
  | 'coedicao'
  | 'licenca'
  | 'representacao'

export type TipoParteContrato = 'cedente' | 'cessionario' | 'testemunha' | 'interveniente'

export type StatusAssinatura = 'pendente' | 'assinado' | 'recusado'

export type DireitoCedido =
  | 'exec_publica'
  | 'fonomecanico'
  | 'sincronizacao'
  | 'digital'
  | 'impressao'
  | 'todos'

// ── Cessão de Obras — 8 direitos específicos ───────────────────────────────────
export type DireitoCessao =
  | 'fonomecanico'        // a) Reprodução Fonomecânica
  | 'sincronizacao_av'   // b) Sincronização Audiovisual
  | 'exec_publica'       // c) Execução Pública
  | 'digital_streaming'  // d) Direitos Digitais (streaming)
  | 'grafico_partitura'  // e) Direitos Gráficos (partituras)
  | 'dramatico'          // f) Direitos Dramáticos
  | 'subedicao_intl'     // g) Sub-edição Internacional
  | 'adaptacoes'         // h) Adaptações/Derivativas

export type Territorio = 'BR' | 'EXT' | 'MUNDIAL'

export type TipoPessoaTitular = 'PF' | 'PJ'

export interface SplitTerritorio {
  territorio: Territorio
  pct_titular: number   // % para o titular/autor
  pct_editora: number   // % para a editora/cessionária
}

export interface DireitoCessaoItem {
  direito: DireitoCessao
  ativo: boolean
  splits: SplitTerritorio[]
}

// ── Aditivo Contratual ────────────────────────────────────────────────────────
export interface AditivoContrato {
  id: string
  contrato_id: string
  numero_aditivo: string
  descricao: string
  tipo: 'alteracao_percentual' | 'adicao_obras' | 'alteracao_vigencia' | 'alteracao_territorio' | 'misto'
  status: StatusContrato
  data_criacao: string
  data_vigencia?: string
  obras_adicionadas?: AditivoObraAdicionada[]
  alteracoes_percentual?: AlteracaoPercentual[]
  assinado_em?: string
}

export interface AditivoObraAdicionada {
  obra_id: string
  titulo_obra: string
  codigo_obra?: string
  percentual: number
  direitos: DireitoCessao[]
}

export interface AlteracaoPercentual {
  obra_id: string
  titulo_obra: string
  direito: DireitoCessao
  territorio: Territorio
  pct_titular_anterior: number
  pct_editora_anterior: number
  pct_titular_novo: number
  pct_editora_novo: number
}

// ── Contrato de Cessão enriquecido ─────────────────────────────────────────────
export interface ContratoCessaoDetalhado {
  id: string
  numero: string
  modelo_cessao_id?: string
  tipo_cessao: 'total_brasil' | 'total_mundo' | 'parcial_sincronizacao' | 'subedicao_internacional' | 'customizado'
  titular_id: string
  titular_nome: string
  titular_tipo_pessoa: TipoPessoaTitular
  titular_cpf_cnpj?: string
  editora_id: string
  editora_nome: string
  status: StatusContrato
  territorio_principal: Territorio
  exclusividade: boolean
  vigencia_inicio: string
  vigencia_fim?: string
  prazo_indeterminado: boolean
  clausula_reversao: boolean
  prazo_reversao_anos?: number
  direitos_cedidos: DireitoCessaoItem[]
  obras_cessao: ObraCessao[]
  aditivos?: AditivoContrato[]
  created_at: string
  updated_at: string
}

export interface ObraCessao {
  id: string
  obra_id: string
  titulo: string
  codigo?: string
  percentual_autor_obra: number  // % que o autor detém nesta obra
  direitos_cedidos: DireitoCessao[]
  splits: Record<DireitoCessao, SplitTerritorio[]>
}

// ── Recebimento simulado ──────────────────────────────────────────────────────
export interface RecebimentoCessao {
  id: string
  contrato_id: string
  obra_titulo: string
  direito: DireitoCessao
  territorio: Territorio
  valor_bruto: number
  pct_titular: number
  pct_editora: number
  valor_titular: number
  valor_editora: number
  retencao_irrf: boolean
  valor_irrf?: number
  valor_titular_liquido: number
  periodo: string
  fonte: string
  data_credito: string
}

// ── Modelos prontos de Cessão ─────────────────────────────────────────────────
export interface ModeloCessao {
  id: string
  nome: string
  descricao: string
  tipo_cessao: ContratoCessaoDetalhado['tipo_cessao']
  direitos_padrao: DireitoCessao[]
  territorio_padrao: Territorio
  splits_padrao_br: { pct_titular: number; pct_editora: number }
  splits_padrao_ext: { pct_titular: number; pct_editora: number }
  clausulas: string
  clausulas_reversao?: string
  vigencia_padrao_anos: number
}

// ── Legados (existentes) ──────────────────────────────────────────────────────

export interface ModeloContrato {
  id: string
  tenant_id: string
  nome: string
  descricao?: string
  tipo: TipoContrato
  clausulas: string
  ativo: boolean
  contagem_uso: number
  created_at: string
  updated_at: string
}

export interface Contrato {
  id: string
  tenant_id: string
  numero: string
  modelo_id?: string
  tipo: TipoContrato
  status: StatusContrato
  vigencia_inicio: string
  vigencia_fim?: string
  renovacao_automatica: boolean
  clausulas_extras?: string
  observacoes?: string
  criado_por?: string
  created_at: string
  updated_at: string
  _partes?: ParteContrato[]
  _obras_vinculadas?: ContratoObra[]
  _assinaturas?: AssinaturaContrato[]
}

export interface ParteContrato {
  id: string
  contrato_id: string
  titular_id: string
  nome_titular: string
  tipo_parte: TipoParteContrato
  cpf_cnpj?: string
}

export interface ContratoObra {
  id: string
  contrato_id: string
  obra_id: string
  titulo_obra: string
  codigo_obra?: string
  percentual: number
  vigencia_inicio?: string
  vigencia_fim?: string
  direitos_cedidos: DireitoCedido[]
}

export interface AssinaturaContrato {
  id: string
  contrato_id: string
  parte_id: string
  nome_parte: string
  tipo_parte: TipoParteContrato
  status: StatusAssinatura
  data_assinatura?: string
  ip_origem?: string
  hash_documento?: string
  observacao?: string
}

export interface EventoAuditoria {
  id: string
  contrato_id: string
  tipo_evento: string
  descricao: string
  usuario?: string
  ip?: string
  created_at: string
}

export interface ContratoRow extends Contrato {
  titular_principal: string
  titular_tipo_pessoa?: TipoPessoaTitular
  _obras_count: number
  _assinaturas_pendentes: number
  _cessao_detalhes?: ContratoCessaoDetalhado
}

// ── Labels & Colors ───────────────────────────────────────────────────────────

export const STATUS_CONTRATO_LABELS: Record<StatusContrato, string> = {
  rascunho:              'Rascunho',
  aguardando_assinatura: 'Ag. Assinatura',
  em_vigor:              'Em Vigor',
  suspenso:              'Suspenso',
  vencendo:              'Vencendo',
  vencido:               'Vencido',
  rescindido:            'Rescindido',
  revogado:              'Revogado',
}

export const STATUS_CONTRATO_COLORS: Record<StatusContrato, string> = {
  rascunho:              'bg-slate-500/15 text-slate-400',
  aguardando_assinatura: 'bg-amber-500/15 text-amber-400',
  em_vigor:              'bg-emerald-500/20 text-emerald-300',
  suspenso:              'bg-orange-500/15 text-orange-400',
  vencendo:              'bg-yellow-500/15 text-yellow-400',
  vencido:               'bg-rose-500/15 text-rose-400',
  rescindido:            'bg-rose-500/20 text-rose-300',
  revogado:              'bg-slate-600/20 text-slate-400',
}

export const TIPO_CONTRATO_LABELS: Record<TipoContrato, string> = {
  cessao:         'Cessao de Direitos',
  administracao:  'Administracao',
  edicao:         'Edicao',
  coedicao:       'Co-edicao',
  licenca:        'Licenca',
  representacao:  'Representacao',
}

export const TIPO_CONTRATO_COLORS: Record<TipoContrato, string> = {
  cessao:        'bg-violet-500/20 text-violet-300',
  administracao: 'bg-sky-500/15 text-sky-400',
  edicao:        'bg-emerald-500/15 text-emerald-400',
  coedicao:      'bg-teal-500/15 text-teal-400',
  licenca:       'bg-amber-500/15 text-amber-400',
  representacao: 'bg-pink-500/15 text-pink-400',
}

export const DIREITO_LABELS: Record<DireitoCedido, string> = {
  exec_publica:  'Exec. Publica',
  fonomecanico:  'Fonomecanico',
  sincronizacao: 'Sincronizacao',
  digital:       'Digital',
  impressao:     'Impressao',
  todos:         'Todos os Direitos',
}

export const STATUS_ASSINATURA_LABELS: Record<StatusAssinatura, string> = {
  pendente: 'Pendente',
  assinado: 'Assinado',
  recusado: 'Recusado',
}

export const STATUS_ASSINATURA_COLORS: Record<StatusAssinatura, string> = {
  pendente: 'bg-amber-500/15 text-amber-400',
  assinado: 'bg-emerald-500/20 text-emerald-300',
  recusado: 'bg-rose-500/15 text-rose-400',
}

// ── Cessão — 8 direitos labels ────────────────────────────────────────────────
export const DIREITO_CESSAO_LABELS: Record<DireitoCessao, string> = {
  fonomecanico:       'a) Reprodução Fonomecânica',
  sincronizacao_av:   'b) Sincronização Audiovisual',
  exec_publica:       'c) Execução Pública',
  digital_streaming:  'd) Direitos Digitais (Streaming)',
  grafico_partitura:  'e) Direitos Gráficos (Partituras)',
  dramatico:          'f) Direitos Dramáticos',
  subedicao_intl:     'g) Sub-edição Internacional',
  adaptacoes:         'h) Adaptações / Derivativas',
}

export const DIREITO_CESSAO_SIGLA: Record<DireitoCessao, string> = {
  fonomecanico:      'FONO',
  sincronizacao_av:  'SYNC',
  exec_publica:      'EXEC',
  digital_streaming: 'DGTL',
  grafico_partitura: 'GRFC',
  dramatico:         'DRAM',
  subedicao_intl:    'INTL',
  adaptacoes:        'ADPT',
}

export const DIREITO_CESSAO_ICONS: Record<DireitoCessao, string> = {
  fonomecanico:      '💿',
  sincronizacao_av:  '🎬',
  exec_publica:      '🎵',
  digital_streaming: '📡',
  grafico_partitura: '📄',
  dramatico:         '🎭',
  subedicao_intl:    '🌐',
  adaptacoes:        '🔀',
}

export const TERRITORIO_LABELS: Record<Territorio, string> = {
  BR:     'Brasil',
  EXT:    'Exterior',
  MUNDIAL:'Mundial',
}

export const TIPO_CESSAO_LABELS: Record<ContratoCessaoDetalhado['tipo_cessao'], string> = {
  total_brasil:              'Cessão Total Brasil',
  total_mundo:               'Cessão Total Mundial',
  parcial_sincronizacao:     'Cessão Parcial (Sync)',
  subedicao_internacional:   'Cessão c/ Sub-edição',
  customizado:               'Customizado',
}

// Splits padrão conforme spec
export const SPLIT_PADRAO_BR = { pct_titular: 75, pct_editora: 25 }
export const SPLIT_PADRAO_EXT = { pct_titular: 50, pct_editora: 50 }

export const TODOS_DIREITOS_CESSAO: DireitoCessao[] = [
  'fonomecanico',
  'sincronizacao_av',
  'exec_publica',
  'digital_streaming',
  'grafico_partitura',
  'dramatico',
  'subedicao_intl',
  'adaptacoes',
]

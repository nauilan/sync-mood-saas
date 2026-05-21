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
  _obras_count: number
  _assinaturas_pendentes: number
}

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

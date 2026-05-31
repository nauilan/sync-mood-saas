// ============================================================
// lib/types-distribuicao.ts — Modulo 8: Distribuicao
// Sync Mood Gestao Inteligente
// ============================================================

// ── Enums / Union Types ───────────────────────────────────────────────────────

export type DistribuicaoStatus =
  | 'previa'
  | 'calculando'
  | 'aprovacao'
  | 'aprovada'
  | 'executada'
  | 'estornada'

export type DistribuicaoItemTipoDestino =
  | 'autor'
  | 'editora'
  | 'administradora'
  | 'subeditora'
  | 'cessionario_pf'
  | 'cessionario_pj'
  | 'investidor'
  | 'herdeiro'
  | 'licenciado'

export type DistribuicaoRetencaoTipo =
  | 'irpf'
  | 'iss'
  | 'comissao'
  | 'taxa_administrativa'
  | 'imposto_internacional'
  | 'retencao_contratual'

// ── Tabelas ───────────────────────────────────────────────────────────────────

export interface Distribuicao {
  id:               string
  codigo:           string
  conciliacao_id?:  string | null
  periodo:          string
  valor_total:      number
  total_titulares:  number
  status:           DistribuicaoStatus
  calculado_em:     string
  aprovado_por?:    string | null
  aprovado_em?:     string | null
  executado_em?:    string | null
  editora_id?:      string | null
  // relacoes
  _itens?:          DistribuicaoItem[]
  _conciliacao_periodo?: string
}

export interface DistribuicaoItem {
  id:                   string
  distribuicao_id:      string
  obra_id?:             string | null
  link_id?:             string | null
  titular_destino_id?:  string | null
  tipo_destino:         DistribuicaoItemTipoDestino
  percentual_aplicado:  number
  valor_bruto:          number
  valor_liquido:        number
  // helpers
  _obra_titulo?:        string
  _obra_codigo?:        string
  _link_descricao?:     string
  _titular_nome?:       string
  _titular_tipo_pessoa?: 'PF' | 'PJ'
  _retencoes?:          DistribuicaoRetencao[]
  _recoupment?:         DistribuicaoRecoupment[]
}

export interface DistribuicaoRetencao {
  id:                    string
  distribuicao_item_id:  string
  tipo:                  DistribuicaoRetencaoTipo
  percentual:            number
  valor:                 number
}

export interface DistribuicaoRecoupment {
  id:                     string
  distribuicao_item_id:   string
  contrato_recoupment_id: string
  valor_abatido:          number
  // helpers
  _contrato_numero?:      string
  _saldo_anterior?:       number
  _saldo_posterior?:      number
}

// ── Labels e Colors ───────────────────────────────────────────────────────────

export const DISTRIBUICAO_STATUS_LABELS: Record<DistribuicaoStatus, string> = {
  previa:      'Prévia',
  calculando:  'Calculando',
  aprovacao:   'Aguardando Aprovacao',
  aprovada:    'Aprovada',
  executada:   'Executada',
  estornada:   'Estornada',
}

export const DISTRIBUICAO_STATUS_COLORS: Record<DistribuicaoStatus, string> = {
  previa:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  calculando:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  aprovacao:   'bg-sky-500/20 text-sky-300 border-sky-500/30',
  aprovada:    'bg-violet-500/20 text-violet-300 border-violet-500/30',
  executada:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  estornada:   'bg-red-500/20 text-red-300 border-red-500/30',
}

export const DISTRIBUICAO_TIPO_DESTINO_LABELS: Record<DistribuicaoItemTipoDestino, string> = {
  autor:           'Autor (CA)',
  editora:         'Editora (E)',
  administradora:  'Administradora (AM)',
  subeditora:      'Subeditora',
  cessionario_pf:  'Cessionario PF',
  cessionario_pj:  'Cessionario PJ',
  investidor:      'Investidor',
  herdeiro:        'Herdeiro',
  licenciado:      'Licenciado',
}

export const DISTRIBUICAO_TIPO_DESTINO_COLORS: Record<DistribuicaoItemTipoDestino, string> = {
  autor:           'bg-violet-500/20 text-violet-300 border-violet-500/30',
  editora:         'bg-sky-500/20 text-sky-300 border-sky-500/30',
  administradora:  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  subeditora:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
  cessionario_pf:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  cessionario_pj:  'bg-teal-500/20 text-teal-300 border-teal-500/30',
  investidor:      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  herdeiro:        'bg-rose-500/20 text-rose-300 border-rose-500/30',
  licenciado:      'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

export const RETENCAO_TIPO_LABELS: Record<DistribuicaoRetencaoTipo, string> = {
  irpf:                   'IRPF (15%)',
  iss:                    'ISS',
  comissao:               'Comissao Administrativa',
  taxa_administrativa:    'Taxa Administrativa',
  imposto_internacional:  'Imposto Internacional',
  retencao_contratual:    'Retencao Contratual',
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export interface KpiDistribuicoes {
  calculando:           number
  aguardando_aprovacao: number
  executadas_mes:       number
  valor_total_distribuido: number
}

// ── Recoupment Saldo ─────────────────────────────────────────────────────────

export interface RecoupmentSaldo {
  contrato_id:       string
  contrato_numero:   string
  titular_id:        string
  titular_nome:      string
  valor_adiantado:   number
  valor_recuperado:  number
  saldo_devedor:     number
  percentual_recuperado: number
}

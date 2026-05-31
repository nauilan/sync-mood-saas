// M4 FINANCEIRO — Mock Data
// Coerente com Nauilan/Giovani/Marcelo dos contratos M2 e obras do M3

// ─── TIPOS ──────────────────────────────────────────────────────────────────

export type OrigemLancamento =
  | 'ecad' | 'abramus' | 'socinpro' | 'amar' | 'sombras'   // INFORMATIVO
  | 'dsp_backoffice' | 'sync'                               // OPERACIONAL
  | 'distribuicao_titulares' | 'ajuste_manual' | 'estorno'

export type StatusLote = 'rascunho' | 'em_processamento' | 'confirmado' | 'estornado'
export type StatusDemonstrativo = 'rascunho' | 'aprovado' | 'enviado'

export interface LancamentoCCObra {
  id: string
  data: string
  tipo: 'credito' | 'debito'
  origem: OrigemLancamento
  descricao: string
  valor_bruto: number
  ir_retido: number
  valor_liquido: number
  saldo_pos: number
  documento_ref?: string
  lote_id?: string
}

export interface ObraCC {
  id: string
  codigo: string
  titulo: string
  iswc?: string
  editora: string
  saldo_atual: number
  total_recebido: number
  total_distribuido: number
  pendente_distribuicao: number
  ultimo_movimento: string
  total_lancamentos: number
  extrato: LancamentoCCObra[]
}

export interface LancamentoCCTitular {
  id: string
  data: string
  tipo: 'credito' | 'debito'
  origem: 'distribuicao_obra' | 'pagamento_titular' | 'ajuste_manual' | 'estorno' | 'informativo_sociedade'
  categoria: 'operacional' | 'informativo'
  obra_titulo?: string
  obra_id?: string
  descricao: string
  valor_bruto: number
  ir_retido: number
  valor_liquido: number
  saldo_pos: number
  sociedade?: string
  periodo_ref?: string
  recoupment_descontado?: number
  documento_ref?: string
}

export interface AdiantamentoTitular {
  id: string
  valor_adiantado: number
  valor_recuperado: number
  saldo_a_recuperar: number
  data_adiantamento: string
  status: 'em_recoupment' | 'recuperado' | 'cancelado'
  obra_titulo?: string
  tipo: 'recoupable' | 'non_recoupable'
}

export interface TitularCC {
  id: string
  nome: string
  tipo_pessoa: 'PF' | 'PJ'
  tipo_titular: 'writer' | 'publisher'
  saldo_operacional: number     // a pagar (DSP/Sync)
  total_informativo_ano: number // sociedades (informativo)
  total_recebido_operacional_ano: number
  total_pagamentos_realizados: number
  adiantamentos_pendentes: number
  adiantamentos: AdiantamentoTitular[]
  ultimo_movimento: string
  extrato: LancamentoCCTitular[]
}

export interface ItemLoteDistribuicao {
  obra_id: string
  obra_titulo: string
  saldo_obra: number
  pct_controlado: number
  titulares: {
    nome: string
    tipo: 'writer' | 'publisher'
    tipo_pessoa: 'PF' | 'PJ'
    pr_share: number
    valor_bruto: number
    recoupment: number
    ir_retido: number
    valor_liquido: number
  }[]
  total_distribuido: number
}

export interface LoteDistribuicao {
  id: string
  codigo: string
  competencia: string
  status: StatusLote
  total_obras: number
  total_titulares: number
  total_bruto: number
  total_retencoes: number
  total_liquido: number
  criado_em: string
  confirmado_em?: string
  criado_por: string
  observacoes?: string
  itens: ItemLoteDistribuicao[]
}

export interface EnvioHistorico {
  id: string
  enviado_em: string
  email_destino: string
  status: 'enviado' | 'bounce' | 'erro'
  lido_em?: string
}

export interface Demonstrativo {
  id: string
  numero: string
  titular_nome: string
  titular_tipo_pessoa: 'PF' | 'PJ'
  tipo: 'demonstrativo' | 'informe_ir'
  periodo_inicio: string
  periodo_fim: string
  valor_bruto: number
  valor_ir: number
  valor_iss: number
  valor_liquido: number
  status: StatusDemonstrativo
  gerado_em?: string
  pdf_path?: string
  envios: EnvioHistorico[]
  obras_count: number
}

// ─── MOCK: OBRAS CC ──────────────────────────────────────────────────────────

export const MOCK_OBRAS_CC: ObraCC[] = []

// ─── MOCK: TITULARES CC ──────────────────────────────────────────────────────

export const MOCK_TITULARES_CC: TitularCC[] = []

// ─── MOCK: LOTES DISTRIBUIÇÃO ────────────────────────────────────────────────

export const MOCK_LOTES: LoteDistribuicao[] = []

// ─── MOCK: DEMONSTRATIVOS ────────────────────────────────────────────────────

export const MOCK_DEMONSTRATIVOS: Demonstrativo[] = []

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(d: string): string {
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR')
}

export function formatDatetime(d: string): string {
  return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

// INFORMATIVO label map
export const ORIGEM_LABEL: Record<string, string> = {
  ecad: 'ECAD',
  abramus: 'ABRAMUS',
  socinpro: 'Socinpro',
  amar: 'AMAR',
  sombras: 'SOMBRAS',
  dsp_backoffice: 'DSP Backoffice',
  sync: 'Sync',
  distribuicao_titulares: 'Distribuição',
  ajuste_manual: 'Ajuste Manual',
  estorno: 'Estorno',
  informativo_sociedade: 'Sociedade',
}

export const SOCIEDADES = ['ecad', 'abramus', 'socinpro', 'amar', 'sombras']
export function isInformativo(origem: string): boolean {
  return SOCIEDADES.includes(origem) || origem === 'informativo_sociedade'
}


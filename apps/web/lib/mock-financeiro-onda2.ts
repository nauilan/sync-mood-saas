// M4 FINANCEIRO — Onda 2 Mock Data
// Coerente com titulares: Nauilan Pereira Barbosa, Giovani Messias da Rocha,
// Marcelo Carvalho Santos, Sync Edições Musicais Ltda.

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDate(d: string): string {
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR')
}

// ─── CONTAS A PAGAR ───────────────────────────────────────────────────────────

export type StatusContaPagar = 'a_vencer' | 'vencida' | 'paga' | 'cancelada'

export interface ContaPagar {
  id: string
  descricao: string
  fornecedor: string
  vencimento: string
  valor: number
  status: StatusContaPagar
  categoria: string
  documento_ref?: string
}

export const MOCK_CONTAS_PAGAR: ContaPagar[] = []

// ─── CONTAS A RECEBER ─────────────────────────────────────────────────────────

export type StatusContaReceber = 'previsto' | 'atrasado' | 'recebido' | 'parcial'

export interface ContaReceber {
  id: string
  descricao: string
  cliente: string
  vencimento: string
  valor: number
  valor_recebido?: number
  status: StatusContaReceber
  categoria: string
}

export const MOCK_CONTAS_RECEBER: ContaReceber[] = []

// ─── DESPESAS ─────────────────────────────────────────────────────────────────

export type StatusDespesa = 'pendente' | 'aprovada' | 'paga' | 'rejeitada'

export interface Despesa {
  id: string
  descricao: string
  categoria: string
  fornecedor: string
  data: string
  valor: number
  status: StatusDespesa
  tipo: 'empresa' | 'reembolso'
  colaborador?: string
}

export const MOCK_DESPESAS: Despesa[] = []

// ─── ADIANTAMENTOS ONDA 2 ─────────────────────────────────────────────────────

export interface AdiantamentoOp {
  id: string
  titular: string
  data_adiantamento: string
  valor_original: number
  valor_recoupado: number
  saldo: number
  taxa_recoupment: number
  status: 'em_recoupment' | 'recuperado' | 'cancelado'
  tipo: 'recoupable' | 'non_recoupable'
  recoupment_log: Array<{
    data: string
    royalties_brutos: number
    valor_descontado: number
    saldo_antes: number
    saldo_depois: number
    obra: string
  }>
}

export const MOCK_ADIANTAMENTOS_OP: AdiantamentoOp[] = []

// ─── INVESTIMENTOS ────────────────────────────────────────────────────────────

export type StatusInvestimento = 'em_execucao' | 'concluido' | 'em_estudo' | 'cancelado'

export interface Investimento {
  id: string
  titulo: string
  tipo: string
  valor_total: number
  valor_investido: number
  retorno_realizado: number
  roi_atual: number
  data_inicio: string
  data_fim_prevista?: string
  status: StatusInvestimento
  descricao: string
}

export const MOCK_INVESTIMENTOS: Investimento[] = []

// ─── FLUXO DE CAIXA ───────────────────────────────────────────────────────────

export interface LancamentoFluxo {
  id: string
  data: string
  descricao: string
  tipo: 'entrada' | 'saida'
  valor: number
  categoria: string
  saldo_acumulado: number
}

export const MOCK_FLUXO_LANCAMENTOS: LancamentoFluxo[] = []

export interface FluxoChartPoint {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

export const MOCK_FLUXO_CHART: FluxoChartPoint[] = []

// ─── IMPOSTOS ─────────────────────────────────────────────────────────────────

export type StatusImposto = 'a_pagar' | 'pago' | 'vencido'

export interface ImpostoObrigacao {
  id: string
  tipo: string
  competencia: string
  base_calculo: number
  aliquota: number
  valor: number
  vencimento: string
  status: StatusImposto
  titular?: string
}

export const MOCK_IMPOSTOS: ImpostoObrigacao[] = []

// ─── CENTRO DE CUSTOS ─────────────────────────────────────────────────────────

export interface CentroCusto {
  id: string
  codigo: string
  nome: string
  pai_id: string | null
  responsavel: string
  budget_mensal: number
  despesas_mes: number
  percentual_total: number
  ativo: boolean
  cor: string
  filhos?: CentroCusto[]
}

export const MOCK_CENTROS_CUSTO: CentroCusto[] = []

// ─── CONCILIACAO BANCARIA ─────────────────────────────────────────────────────

export type StatusConciliacao = 'conciliado' | 'pendente' | 'divergencia'

export interface LancamentoConciliacao {
  id: string
  data: string
  descricao_banco: string
  valor_banco: number
  descricao_sistema: string
  valor_sistema: number
  status: StatusConciliacao
}

export const MOCK_CONCILIACAO: LancamentoConciliacao[] = []


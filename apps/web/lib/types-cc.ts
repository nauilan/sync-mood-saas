// ============================================================
// lib/types-cc.ts — Módulo 9: Conta Corrente (Obra + Titular)
// Sync Mood Gestão Inteligente
// ============================================================

// ── Enums ─────────────────────────────────────────────────────────────────────

export type CCObraStatus = 'ativa' | 'bloqueada'
export type CCTitularStatus = 'ativa' | 'bloqueada'

export type TipoMovimentoObra =
  | 'entrada' | 'distribuicao' | 'recoupment' | 'retencao'
  | 'taxa_administrativa' | 'estorno' | 'ajuste' | 'bloqueio' | 'liberacao'

export type OrigemRecebimento =
  | 'backoffice' | 'sync' | 'internacional' | 'acordo_direto' | 'tv' | 'licenciamento'

export type TipoMovimentoTitular =
  | 'credito' | 'debito' | 'retencao' | 'recoupment'
  | 'pagamento' | 'estorno' | 'bloqueio' | 'ajuste'

export type TipoRetencao =
  | 'irpf' | 'iss' | 'comissao' | 'taxa_administrativa'
  | 'imposto_internacional' | 'retencao_contratual'

export type TipoDestino =
  | 'autor' | 'editora' | 'administradora' | 'cessionario_pf'
  | 'cessionario_pj' | 'investidor' | 'herdeiro'

// ── CC Obra ───────────────────────────────────────────────────────────────────

export interface ContaCorrenteObra {
  id: string
  obra_id: string
  obra_codigo: string
  obra_titulo: string
  obra_iswc?: string
  saldo_atual: number
  saldo_bloqueado: number
  saldo_distribuido: number
  saldo_pendente: number
  moeda: string
  status: CCObraStatus
  data_ultima_movimentacao?: string
  // computed
  total_entradas_mes: number
  total_saidas_mes: number
  bloqueios: BloqueioCC[]
  movimentos: MovimentoObra[]
  distribuicoes: DistribuicaoObra[]
  evolucao_12m: EvolucaoMensal[]
}

export interface MovimentoObra {
  id: string
  conta_obra_id: string
  tipo_movimento: TipoMovimentoObra
  origem_recebimento?: OrigemRecebimento
  recebimento_id?: string
  valor_bruto: number
  valor_liquido: number
  moeda: string
  data_movimento: string
  descricao?: string
  usuario?: string
  status: string
}

export interface DistribuicaoObra {
  id: string
  conta_obra_movimento_id: string
  obra_link_id?: string
  titular_destino_id?: string
  titular_nome?: string
  percentual_aplicado: number
  valor_destinado: number
  tipo_destino: TipoDestino
  status: string
  // para hierarquia LINK→TITULARES
  link_descricao?: string
  irpf_incide?: boolean
}

export interface EvolucaoMensal {
  mes: string  // 'YYYY-MM'
  label: string // 'Jan', 'Fev', etc
  entradas: number
  saidas: number
  saldo_final: number
}

// ── CC Titular ────────────────────────────────────────────────────────────────

export interface ContaCorrenteTitular {
  id: string
  titular_id: string
  titular_codigo: string
  titular_nome: string
  titular_tipo: 'PF' | 'PJ'
  editora_nome?: string
  saldo_atual: number
  saldo_bloqueado: number
  saldo_liberado: number
  saldo_pago: number
  moeda: string
  status: CCTitularStatus
  data_ultima_movimentacao?: string
  // computed
  recoupment_ativo?: RecoupmentTitular
  bloqueios: BloqueioCC[]
  movimentos: MovimentoTitular[]
  pagamentos_historicos: PagamentoHistorico[]
  cessao_info?: CessaoInfo
}

export interface MovimentoTitular {
  id: string
  conta_titular_id: string
  origem_obra_id?: string
  origem_obra_titulo?: string
  origem_recebimento_id?: string
  tipo_movimento: TipoMovimentoTitular
  valor_bruto: number
  valor_liquido: number
  retencoes_total: number
  moeda: string
  data_movimento: string
  descricao?: string
  status: string
  retencoes: RetencaoTitular[]
}

export interface RetencaoTitular {
  id: string
  movimento_id: string
  tipo_retencao: TipoRetencao
  percentual: number
  valor: number
  observacoes?: string
}

export interface RecoupmentTitular {
  contrato_id: string
  contrato_numero: string
  valor_adiantado: number
  valor_recuperado: number
  saldo_devedor: number
  percentual_recuperado: number
  status: 'em_recoupment' | 'quitado'
  historico: RecoupmentHistoricoItem[]
}

export interface RecoupmentHistoricoItem {
  data: string
  valor_abatido: number
  saldo_anterior: number
  saldo_posterior: number
  origem: string
}

export interface PagamentoHistorico {
  id: string
  data: string
  valor: number
  metodo: string
  status: 'pago' | 'falhou' | 'cancelado'
  comprovante_url?: string
}

export interface CessaoInfo {
  tipo: 'PJ' | 'PF_terceiro'
  irpf_incide: boolean
  cessao_vencida: boolean
  data_vencimento?: string
  cedente_nome: string
  cessionario_nome: string
}

export interface BloqueioCC {
  tipo: 'sem_contrato' | 'sem_link' | 'sem_percentual' | 'titular_bloqueado'
        | 'sem_dados_bancarios' | 'pagamento_duplicado' | 'cessao_vencida'
  descricao: string
  gravidade: 'critico' | 'aviso'
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface KpiCCObra {
  saldo_total_obras: number
  total_entradas_mes: number
  total_distribuido_mes: number
  obras_com_bloqueio: number
}

export interface KpiCCTitular {
  saldo_total_titulares: number
  saldo_disponivel: number
  saldo_bloqueado: number
  total_pago_mes: number
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const TIPO_MOVIMENTO_OBRA_LABELS: Record<TipoMovimentoObra, string> = {
  entrada: 'Entrada',
  distribuicao: 'Distribuição',
  recoupment: 'Recoupment',
  retencao: 'Retenção',
  taxa_administrativa: 'Taxa Adm.',
  estorno: 'Estorno',
  ajuste: 'Ajuste',
  bloqueio: 'Bloqueio',
  liberacao: 'Liberação',
}

export const TIPO_MOVIMENTO_OBRA_COLORS: Record<TipoMovimentoObra, string> = {
  entrada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  distribuicao: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  recoupment: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  retencao: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  taxa_administrativa: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  estorno: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  ajuste: 'bg-white/8 text-white/50 border-white/10',
  bloqueio: 'bg-rose-700/10 text-rose-300 border-rose-700/20',
  liberacao: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

export const TIPO_MOVIMENTO_TITULAR_LABELS: Record<TipoMovimentoTitular, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  retencao: 'Retenção',
  recoupment: 'Recoupment',
  pagamento: 'Pagamento',
  estorno: 'Estorno',
  bloqueio: 'Bloqueio',
  ajuste: 'Ajuste',
}

export const ORIGEM_RECEBIMENTO_LABELS: Record<OrigemRecebimento, string> = {
  backoffice: 'BackOffice/DSP',
  sync: 'Sync',
  internacional: 'Internacional',
  acordo_direto: 'Acordo Direto',
  tv: 'TV/Audiovisual',
  licenciamento: 'Licenciamento',
}

// ============================================================
// lib/types-prestacao.ts — Módulo 10: Prestação de Contas
// Sync Mood Gestão Inteligente
// ============================================================

export type PrestacaoStatus = 'gerada' | 'enviada' | 'aprovada' | 'contestada' | 'paga'
export type CanalEnvio = 'email' | 'whatsapp' | 'portal' | 'multiplo'
export type StatusEnvio = 'enfileirado' | 'enviado' | 'entregue' | 'visualizado' | 'erro'
export type StatusContestacao = 'aberta' | 'em_analise' | 'procedente' | 'improcedente' | 'resolvida'

export interface PrestacaoConta {
  id: string
  codigo: string
  titular_id: string
  titular_nome: string
  titular_tipo: 'PF' | 'PJ'
  titular_avatar?: string
  periodo_inicio: string
  periodo_fim: string
  valor_bruto: number
  retencoes_total: number
  recoupment_aplicado: number
  valor_liquido: number
  status: PrestacaoStatus
  data_geracao: string
  data_envio?: string
  canal_envio?: CanalEnvio
  data_aprovacao?: string
  pdf_url?: string
  itens: PrestacaoItem[]
  envios: PrestacaoEnvio[]
  contestacoes: PrestacaoContestacao[]
}

export interface PrestacaoItem {
  id: string
  prestacao_id: string
  obra_id: string
  obra_titulo: string
  obra_codigo: string
  recebimento_id?: string
  recebimento_descricao?: string
  valor_bruto: number
  percentual_aplicado: number
  valor_liquido: number
  descricao?: string
}

export interface PrestacaoEnvio {
  id: string
  prestacao_id: string
  canal: 'email' | 'whatsapp' | 'portal'
  destino: string
  status: StatusEnvio
  tentativa: number
  log_json?: Record<string, unknown>
  enviado_em?: string
}

export interface PrestacaoContestacao {
  id: string
  prestacao_id: string
  titular_id: string
  titular_nome: string
  motivo: string
  status: StatusContestacao
  descricao?: string
  resposta?: string
  criada_em: string
  resolvida_em?: string
}

// ── KPIs ──────────────────────────────────────────────────────────────────────

export interface KpiPrestacao {
  total_geradas: number
  total_enviadas: number
  total_aprovadas: number
  total_contestadas: number
  total_pagas: number
  valor_total_pendente: number
}

// ── Automação ─────────────────────────────────────────────────────────────────

export interface RegraAutomacaoPrestacao {
  id: string
  trigger: 'fim_trimestre' | 'fim_mes' | 'manual'
  canais: CanalEnvio[]
  template_email?: string
  template_whatsapp?: string
  ativa: boolean
  ultimo_disparo?: string
  proximo_disparo?: string
}

// ── Labels ────────────────────────────────────────────────────────────────────

export const PRESTACAO_STATUS_LABELS: Record<PrestacaoStatus, string> = {
  gerada: 'Gerada',
  enviada: 'Enviada',
  aprovada: 'Aprovada',
  contestada: 'Contestada',
  paga: 'Paga',
}

export const PRESTACAO_STATUS_COLORS: Record<PrestacaoStatus, string> = {
  gerada: 'bg-white/8 text-white/60 border-white/10',
  enviada: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  aprovada: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  contestada: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  paga: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

export const CANAL_ENVIO_LABELS: Record<CanalEnvio, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  portal: 'Portal',
  multiplo: 'Múltiplo',
}

export const STATUS_ENVIO_LABELS: Record<StatusEnvio, string> = {
  enfileirado: 'Enfileirado',
  enviado: 'Enviado',
  entregue: 'Entregue',
  visualizado: 'Visualizado',
  erro: 'Erro',
}

export const STATUS_ENVIO_COLORS: Record<StatusEnvio, string> = {
  enfileirado: 'bg-white/8 text-white/50 border-white/10',
  enviado: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  entregue: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  visualizado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  erro: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
}

export const STATUS_CONTESTACAO_LABELS: Record<StatusContestacao, string> = {
  aberta: 'Aberta',
  em_analise: 'Em Análise',
  procedente: 'Procedente',
  improcedente: 'Improcedente',
  resolvida: 'Resolvida',
}

export const STATUS_CONTESTACAO_COLORS: Record<StatusContestacao, string> = {
  aberta: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  em_analise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  procedente: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  improcedente: 'bg-white/8 text-white/50 border-white/10',
  resolvida: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

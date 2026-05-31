// ── Tipos e enums para Orcamentos de Autorizacao ─────────────────────────────

export type StatusOrcamento =
  | 'rascunho'
  | 'enviado'
  | 'em_negociacao'
  | 'aprovado'
  | 'recusado'
  | 'expirado'
  | 'convertido'  // convertido em autorizacao

export const STATUS_ORCAMENTO_LABELS: Record<StatusOrcamento, string> = {
  rascunho:      'Rascunho',
  enviado:       'Enviado',
  em_negociacao: 'Em Negociacao',
  aprovado:      'Aprovado',
  recusado:      'Recusado',
  expirado:      'Expirado',
  convertido:    'Convertido',
}

export const STATUS_ORCAMENTO_COLORS: Record<StatusOrcamento, string> = {
  rascunho:      'bg-white/10 text-white/50',
  enviado:       'bg-sky-500/15 text-sky-400',
  em_negociacao: 'bg-amber-500/15 text-amber-400',
  aprovado:      'bg-emerald-500/15 text-emerald-400',
  recusado:      'bg-rose-500/15 text-rose-400',
  expirado:      'bg-orange-500/15 text-orange-400',
  convertido:    'bg-violet-500/15 text-violet-400',
}

// ── Metodologia de precificacao audiovisual ───────────────────────────────────

// Valor base por tipo de sincronizacao (R$)
export const PRECIFICACAO_BASE_SINC: Record<string, number> = {
  'Abertura':                  8000,
  'Encerramento':              3500,
  'Abertura/Encerramento':     10000,
  'Tema':                      5000,
  'Fundo':                     2000,
  'Performance':               4000,
}

// Fator multiplicador por meio de utilizacao
export const FATOR_MEIO: Record<string, number> = {
  'Filme':          2.0,
  'Serie':          1.5,
  'Novela':         1.8,
  'Publicidade':    2.5,
  'Programa de TV': 1.2,
  'Documentario':   0.8,
}

// Fator por territorio
export const FATOR_TERRITORIO: Record<string, number> = {
  'Mundial':           3.0,
  'Europa':            2.0,
  'Estados Unidos':    2.0,
  'America Latina':    1.5,
  'Brasil':            1.0,
  'Portugal':          1.2,
}

/** Retorna o maior fator de territorio a partir de um array de territorios selecionados */
export function calcFatorTerritorio(territorios: string[]): number {
  if (!territorios || territorios.length === 0) return 1.0
  return Math.max(...territorios.map(t => FATOR_TERRITORIO[t] ?? 1.0))
}

/**
 * Calcula o valor sugerido para autorizacoes audiovisuais (Sincronizacao)
 * Formula:
 *   base = PRECIFICACAO_BASE_SINC[tipoSinc]
 *   valor = base
 *           × FATOR_MEIO[meio]
 *           × calcFatorTerritorio(territorios)
 *           × (diasLicenca / 365)
 *           × (percentualControle / 100)
 *   + (exclusividade ? base * 0.5 : 0)
 *   + (participacaoFestivais ? 2000 : 0)
 */
export function calcValorAudiovisual(params: {
  tipoSincronizacao?: string
  meioUtilizacao?: string
  territorio?: string[]
  periodoLicencaDias?: number
  percentualControle?: number
  exclusividade?: boolean
  participacaoFestivais?: boolean
}): {
  valorBase: number
  fatorMeio: number
  fatorTerritorio: number
  fatorTempo: number
  adicionalExclusividade: number
  adicionalFestivais: number
  valorSugerido: number
  detalhamento: string[]
} {
  const {
    tipoSincronizacao = '',
    meioUtilizacao = '',
    territorio = ['Brasil'],
    periodoLicencaDias = 365,
    percentualControle = 100,
    exclusividade = false,
    participacaoFestivais = false,
  } = params

  const valorBase = PRECIFICACAO_BASE_SINC[tipoSincronizacao] ?? 0
  const fatorMeio = FATOR_MEIO[meioUtilizacao] ?? 1.0
  const fatorTerritorio = calcFatorTerritorio(territorio)
  const fatorTempo = Math.max(0.1, (periodoLicencaDias || 365) / 365)
  const controle = (percentualControle ?? 100) / 100

  const valorAjustado = valorBase * fatorMeio * fatorTerritorio * fatorTempo * controle
  const adicionalExclusividade = exclusividade ? valorBase * 0.5 * controle : 0
  const adicionalFestivais = participacaoFestivais ? 2000 * controle : 0
  const valorSugerido = Math.round(valorAjustado + adicionalExclusividade + adicionalFestivais)

  const detalhamento = [
    `Base (${tipoSincronizacao || '—'}): R$ ${valorBase.toLocaleString('pt-BR')}`,
    `× Meio (${meioUtilizacao || '—'}): ${fatorMeio}x`,
    `× Territorio: ${fatorTerritorio}x`,
    `× Tempo (${periodoLicencaDias}d / 365): ${fatorTempo.toFixed(2)}x`,
    `× Controle editora: ${percentualControle ?? 100}%`,
    ...(exclusividade ? [`+ Exclusividade: R$ ${adicionalExclusividade.toLocaleString('pt-BR')}`] : []),
    ...(participacaoFestivais ? [`+ Festivais: R$ ${adicionalFestivais.toLocaleString('pt-BR')}`] : []),
  ]

  return { valorBase, fatorMeio, fatorTerritorio, fatorTempo, adicionalExclusividade, adicionalFestivais, valorSugerido, detalhamento }
}

// ── Tipo principal Orcamento ──────────────────────────────────────────────────

export interface Orcamento {
  id: string
  numero_orcamento: string        // ex: ORC-2026-0001
  tipo: string                    // mesmo TipoAutorizacao
  status: StatusOrcamento
  data_emissao: string            // ISO date
  data_validade: string           // ISO date (emissao + 30d por padrao)
  licenciado_nome?: string
  modelo_negocio?: string
  valor_sugerido?: number
  valor_negociado?: number
  autorizacao_id?: string         // preenchido ao converter
  numero_autorizacao?: string
  _obras?: { obra_id: string; obra_titulo: string }[]
  _dados_especificos?: Record<string, any>
  observacoes?: string
}

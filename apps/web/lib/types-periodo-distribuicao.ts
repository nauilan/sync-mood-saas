// ============================================================
// lib/types-periodo-distribuicao.ts
// Período de Distribuição — entidade central do módulo.
// Toda distribuição pertence a um período cadastrado.
// ============================================================

// ── Tipos de Período ──────────────────────────────────────────────────────────

export type TipoPeriodoDistribuicao = 'mensal' | 'trimestral'

export type StatusPeriodoDistribuicao =
  | 'aberto'        // período em coleta de valores (prévia disponível)
  | 'em_processamento' // encerramento solicitado, sistema processando
  | 'encerrado'     // CC Obra e CC Titular gravados, recibos emitidos
  | 'cancelado'

// Mapeamento de trimestre: "1Q26" = Q1 de 2026 = Jan/Fev/Mar
export interface PeriodoDistribuicao {
  id: string
  codigo: string            // ex: "2026-05" ou "1Q26"
  tipo: TipoPeriodoDistribuicao
  label: string             // ex: "Maio/2026" ou "1º Trimestre 2026"
  ano: number
  mes?: number              // 1-12 (apenas mensal)
  trimestre?: 1 | 2 | 3 | 4 // (apenas trimestral)
  data_inicio: string       // YYYY-MM-DD
  data_fim: string          // YYYY-MM-DD
  data_prevista_pagamento?: string
  status: StatusPeriodoDistribuicao
  total_previsto: number    // soma dos valores atribuídos (prévia)
  total_processado: number  // soma após encerramento
  fontes: string[]          // DSPs / fontes atribuídas
  observacao?: string
  criado_em: string
  encerrado_em?: string
}

// ── Labels e cores ────────────────────────────────────────────────────────────

export const TIPO_PERIODO_LABELS: Record<TipoPeriodoDistribuicao, string> = {
  mensal:      'Mensal',
  trimestral:  'Trimestral',
}

export const STATUS_PERIODO_LABELS: Record<StatusPeriodoDistribuicao, string> = {
  aberto:            'Aberto',
  em_processamento:  'Em Processamento',
  encerrado:         'Encerrado',
  cancelado:         'Cancelado',
}

export const STATUS_PERIODO_COLORS: Record<StatusPeriodoDistribuicao, string> = {
  aberto:            'bg-sky-500/20 text-sky-300 border-sky-500/30',
  em_processamento:  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  encerrado:         'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  cancelado:         'bg-red-500/20 text-red-300 border-red-500/30',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Gera o código de trimestre: ano + trimestre → "1Q26"
 */
export function trimestreCodigo(ano: number, trim: 1 | 2 | 3 | 4): string {
  return `${trim}Q${String(ano).slice(2)}`
}

/**
 * Gera o código mensal: "2026-05"
 */
export function mensalCodigo(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`
}

/**
 * Label amigável do período
 */
const MESES = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
export function periodoLabel(p: Pick<PeriodoDistribuicao, 'tipo' | 'mes' | 'trimestre' | 'ano'>): string {
  if (p.tipo === 'mensal' && p.mes) return `${MESES[p.mes]}/${p.ano}`
  if (p.tipo === 'trimestral' && p.trimestre) return `${p.trimestre}º Trimestre ${p.ano}`
  return '—'
}

/**
 * Retorna o trimestre (1-4) a que um mês pertence
 */
export function mesParaTrimestre(mes: number): 1 | 2 | 3 | 4 {
  return Math.ceil(mes / 3) as 1 | 2 | 3 | 4
}

/**
 * Verifica se um período mensal conflita com algum trimestral existente.
 * Recebe a lista de períodos já cadastrados.
 * Retorna o código do trimestral conflitante ou null se OK.
 */
export function conflitaTrimestral(
  ano: number,
  mes: number,
  periodos: Array<{ tipo: TipoPeriodoDistribuicao; ano: number; trimestre?: number; codigo: string }>
): string | null {
  const trim = mesParaTrimestre(mes)
  const conflito = periodos.find(
    p => p.tipo === 'trimestral' && p.ano === ano && p.trimestre === trim
  )
  return conflito ? conflito.codigo : null
}

export function trimestreDatas(ano: number, trim: 1 | 2 | 3 | 4): { inicio: string; fim: string } {
  const meses: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [1, 3], 2: [4, 6], 3: [7, 9], 4: [10, 12],
  }
  const [mi, mf] = meses[trim]
  const diasFim: Record<number, number> = {
    1: 31, 2: 28, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31,
  }
  return {
    inicio: `${ano}-${String(mi).padStart(2, '0')}-01`,
    fim:    `${ano}-${String(mf).padStart(2, '0')}-${diasFim[mf]}`,
  }
}

// ============================================================
// lib/mock-periodos-distribuicao.ts
// Períodos de distribuição cadastrados no sistema.
// Trimestral OBRIGATÓRIO; mensal OPCIONAL (pode coexistir).
// ============================================================

import type { PeriodoDistribuicao } from './types-periodo-distribuicao'

export const MOCK_PERIODOS_DISTRIBUICAO: PeriodoDistribuicao[] = []

// ── Helpers ───────────────────────────────────────────────────────────────────

export const PERIODOS_ABERTOS = MOCK_PERIODOS_DISTRIBUICAO
  .filter(p => p.status === 'aberto')
  .sort((a, b) => a.codigo.localeCompare(b.codigo))

export const PERIODO_CORRENTE = MOCK_PERIODOS_DISTRIBUICAO
  .find(p => p.codigo === '2Q26') ?? MOCK_PERIODOS_DISTRIBUICAO[0]

export const KPI_PERIODOS = {
  total_encerrados: MOCK_PERIODOS_DISTRIBUICAO.filter(p => p.status === 'encerrado').length,
  total_abertos:    MOCK_PERIODOS_DISTRIBUICAO.filter(p => p.status === 'aberto').length,
  total_processado: MOCK_PERIODOS_DISTRIBUICAO.reduce((s, p) => s + p.total_processado, 0),
  total_previsto:   MOCK_PERIODOS_DISTRIBUICAO.filter(p => p.status === 'aberto')
                      .reduce((s, p) => s + p.total_previsto, 0),
}


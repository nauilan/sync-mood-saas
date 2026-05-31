// ============================================================
// lib/mock-cobrancas.ts — Modulo 4: Cobrancas
// Parcelas geradas a partir de MOCK_AUTORIZACOES com modelo_negocio='pago_editora'
// Sync Mood Gestao Inteligente
// ============================================================

import type { ParcelaCobranca } from './types-cobrancas'
import { TIPO_AUTORIZACAO_LABELS } from './types-autorizacoes'

// ── Parcelas geradas manualmente a partir dos mocks pago_editora ──────────────
//
// auth-001 AUTH-2025-00001 fonograma       R$ 18.000  — 3x de R$ 6.000  (obra-0001)
// auth-003 AUTH-2025-00003 fonograma       R$ 12.000  — 2x de R$ 6.000  (obra-0001)
// auth-004 AUTH-2025-00004 sincronizacao   R$ 85.000  — 3x parcelas     (obra-0003)
// auth-006 AUTH-2026-00002 tv              R$ 22.000  — 2x de R$ 11.000 (obra-0001)
// auth-008 AUTH-2026-00004 versao          R$ 15.000  — 1x R$ 15.000    (obra-0001)

export const MOCK_PARCELAS: ParcelaCobranca[] = []

export function getParcelaById(id: string): ParcelaCobranca | undefined {
  return MOCK_PARCELAS.find(p => p.id === id)
}

export function getParcelasByAutorizacao(autorizacao_id: string): ParcelaCobranca[] {
  return MOCK_PARCELAS.filter(p => p.autorizacao_id === autorizacao_id)
}

export const KPI_COBRANCAS = {
  total_a_receber: MOCK_PARCELAS
    .filter(p => p.status !== 'pago')
    .reduce((s, p) => s + p.valor, 0),
  pendentes: MOCK_PARCELAS.filter(p => p.status === 'pendente').length,
  atrasados: MOCK_PARCELAS.filter(p => p.status === 'atrasado').length,
  pagos: MOCK_PARCELAS.filter(p => p.status === 'pago').length,
}


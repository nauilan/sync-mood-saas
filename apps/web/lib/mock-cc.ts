// ============================================================
// lib/mock-cc.ts — Módulo 9: Conta Corrente (Obra + Titular)
// Distribuição real: iMúsica S.A. — ST505168 — 2026-04-17
// 89 CC Obras | 40 CC Titulares | R$ 91198.39
// Sync Mood Gestão Inteligente
// ============================================================

import type {
  ContaCorrenteObra, ContaCorrenteTitular,
} from './types-cc'

// ── Helpers ───────────────────────────────────────────────────────────────────

export function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function fmtDate(d: string) {
  return new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('pt-BR')
}

// ════════════════════════════════════════════════════════════════════════════
// CC OBRAS — 89 obras distribuídas (iMúsica ST505168)
// ════════════════════════════════════════════════════════════════════════════

export const MOCK_CC_OBRAS: ContaCorrenteObra[] = []

export const KPI_CC_OBRAS = {
  total_obras: 0,
  saldo_total: 0,
  saldo_total_obras: 0,
  total_recebido: 0,
  total_distribuido: 0,
  total_entradas_mes: 0,
  total_distribuido_mes: 0,
  pendente_distribuicao: 0,
  obras_com_bloqueio: 0,
}

export const MOCK_CC_TITULARES: ContaCorrenteTitular[] = []

export function getCCTitularById(id: string) {
  return MOCK_CC_TITULARES.find(t => t.id === id || t.titular_id === id)
}

export const KPI_CC_TITULARES = {
  saldo_total_titulares: 0,
  saldo_disponivel: 0,
  saldo_bloqueado: 0,
  total_pago_mes: 0,
}

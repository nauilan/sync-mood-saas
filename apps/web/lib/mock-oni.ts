// ============================================================
// lib/mock-oni.ts — Dados mock para o modulo ONI
// Sync Mood Gestao Inteligente — M5 BackOffice
// ============================================================

import type { ONIList, ONIMatch, ONIIdentificacao } from './types-oni'

// ── 2 Listas ONI ─────────────────────────────────────────────────────────────

export const MOCK_ONI_LISTS: ONIList[] = []

// ── 30 Matches variados ───────────────────────────────────────────────────────

export const MOCK_ONI_MATCHES: ONIMatch[] = []

// ── 1 Identificacao exportada ─────────────────────────────────────────────────

export const MOCK_ONI_IDENTIFICACOES: ONIIdentificacao[] = []

// ── KPIs ──────────────────────────────────────────────────────────────────────

export const KPI_ONI = {
  total_listas: MOCK_ONI_LISTS.length,
  listas_processadas: MOCK_ONI_LISTS.filter(l => l.status === 'exportado' || l.status === 'aprovado').length,
  total_matches: MOCK_ONI_MATCHES.filter(m => m.obra_id !== null).length,
  matches_confirmados: MOCK_ONI_MATCHES.filter(m => m.status === 'aprovado').length,
  listas_pendentes: MOCK_ONI_LISTS.filter(l => l.status === 'em_revisao' || l.status === 'processando').length,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getMatchesByLista(listaId: string): ONIMatch[] {
  return MOCK_ONI_MATCHES.filter(m => m.lista_id === listaId)
}

export function getListaById(id: string): ONIList | undefined {
  return MOCK_ONI_LISTS.find(l => l.id === id)
}

export function getIdentificacaoByLista(listaId: string): ONIIdentificacao | undefined {
  return MOCK_ONI_IDENTIFICACOES.find(i => i.lista_id === listaId)
}


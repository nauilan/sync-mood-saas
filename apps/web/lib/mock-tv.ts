// ============================================================
// lib/mock-tv.ts — Modulo 6 TV: Dados mock realistas
// Sync Mood Gestao Inteligente
// 1 importacao Globo, 15 execucoes, matching variado, 5 divergencias
// 12 linhas precificacao, 8 autorizacoes, 5 recebimentos
// ============================================================

import type {
  TvImportacao, TvExecucao, TvMatching, TvDivergencia,
  TvPrecificacao, TvAutorizacao, TvRecebimento, TvDistribuicao,
  KpiTV,
} from './types-tv'

// ── IMPORTACAO ────────────────────────────────────────────────────────────────

export const TV_IMPORTACAO_GLOBO: TvImportacao = {
  id:               'tv-imp-001',
  codigo:           'TV-IMP-2026-001',
  emissora:         'Globo',
  formato_arquivo:  'xlsx',
  periodo_inicio:   '2026-01-01',
  periodo_fim:      '2026-03-31',
  total_linhas:     0,
  total_matched:    0,
  total_divergentes:0,
  hash:             'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6',
  importado_em:     '2026-04-10T09:00:00Z',
  editora_id:       'ed-tsm',
}

// ── EXECUCOES ─────────────────────────────────────────────────────────────────

export const TV_EXECUCOES: TvExecucao[] = []

// ── MATCHING ──────────────────────────────────────────────────────────────────
// 10 auto_match alta similaridade, 3 sugerido medio, 2 sem_match

export const TV_MATCHINGS: TvMatching[] = []

// ── DIVERGENCIAS ──────────────────────────────────────────────────────────────

export const TV_DIVERGENCIAS: TvDivergencia[] = []

// ── PRECIFICACAO ──────────────────────────────────────────────────────────────

export const TV_PRECIFICACAO: TvPrecificacao[] = []

// ── AUTORIZACOES ──────────────────────────────────────────────────────────────
// 8 autorizacoes geradas para execucoes matched com clausula obrigatoria

const CLAUSULA = 'A presente autorizacao cobre exclusivamente o percentual sob controle editorial da autorizante.'

export const TV_AUTORIZACOES: TvAutorizacao[] = []

// ── RECEBIMENTOS ──────────────────────────────────────────────────────────────

export const TV_RECEBIMENTOS: TvRecebimento[] = []

// ── KPI ───────────────────────────────────────────────────────────────────────

export const KPI_TV: KpiTV = {
  total_identificadas:  0,  // auto_match + confirmados
  total_faturado:       TV_AUTORIZACOES.reduce((s, a) => s + (a.valor_negociado ?? a.valor_calculado), 0),
  total_recebido:       TV_RECEBIMENTOS.filter(r => r.status !== 'pendente').reduce((s, r) => s + r.valor_liquido, 0),
  divergencias_abertas: TV_DIVERGENCIAS.filter(d => d.status === 'aberta').length,
}

// ── Top Emissoras (para dashboard) ───────────────────────────────────────────

export const TV_TOP_EMISSORAS: Array<{ emissora: string; execucoes: number; valor: number }> = []

// ── Top Obras Audiovisuais (para dashboard) ───────────────────────────────────

export const TV_TOP_OBRAS: Array<{ obra_titulo: string; execucoes: number; valor: number }> = []


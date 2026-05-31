// ============================================================
// lib/mock-conciliacao.ts — Modulo 7: 6 conciliacoes realistas
// 3 BackOffice DSP, 1 Sync, 1 Internacional, 1 TV
// 25 itens validados, 4 divergencias
// Sync Mood Gestao Inteligente
// ============================================================

import type {
  Conciliacao, ConciliacaoItem, ConciliacaoDivergencia, KpiConciliacoes,
} from './types-conciliacao'

// ── Conciliacao 1 — BackOffice Spotify Q1/2025 ────────────────────────────────

const CONC001_ITENS: ConciliacaoItem[] = []

export const CONC_BACKOFFICE_SPOTIFY: Conciliacao = {
  id: 'conc-001', recebimento_id: 'rec-003', periodo: '2025-Q1',
  status: 'concluida', iniciada_em: '2025-04-22T09:00:00Z', finalizada_em: '2025-04-22T11:00:00Z',
  total_itens: 4, total_validados: 4, total_divergentes: 0,
  editora_id: 'ed-tsm', _itens: CONC001_ITENS, _divergencias: [],
  _fonte_label: 'BackOffice Music Services — Spotify', _recebimento_valor: 35309.46,
}

// ── Conciliacao 2 — BackOffice YouTube Q1/2025 ───────────────────────────────

const CONC002_ITENS: ConciliacaoItem[] = []

export const CONC_BACKOFFICE_YOUTUBE: Conciliacao = {
  id: 'conc-002', recebimento_id: 'rec-004', periodo: '2025-Q1',
  status: 'concluida', iniciada_em: '2025-04-20T14:00:00Z', finalizada_em: '2025-04-20T15:00:00Z',
  total_itens: 2, total_validados: 2, total_divergentes: 0,
  editora_id: 'ed-tsm', _itens: CONC002_ITENS, _divergencias: [],
  _fonte_label: 'BackOffice Music Services — YouTube', _recebimento_valor: 6041.80,
}

// ── Conciliacao 3 — BackOffice Deezer Q1/2025 ────────────────────────────────

const CONC003_ITENS: ConciliacaoItem[] = []

export const CONC_BACKOFFICE_DEEZER: Conciliacao = {
  id: 'conc-003', recebimento_id: 'rec-005', periodo: '2025-Q1',
  status: 'concluida', iniciada_em: '2025-04-21T10:00:00Z', finalizada_em: '2025-04-21T10:45:00Z',
  total_itens: 2, total_validados: 2, total_divergentes: 0,
  editora_id: 'ed-tsm', _itens: CONC003_ITENS, _divergencias: [],
  _fonte_label: 'BackOffice Music Services — Deezer', _recebimento_valor: 3602.84,
}

// ── Conciliacao 4 — Sync Publicidade ─────────────────────────────────────────

const CONC004_DIVS: ConciliacaoDivergencia[] = []

const CONC004_ITENS: ConciliacaoItem[] = []

export const CONC_SYNC_PUBLICIDADE: Conciliacao = {
  id: 'conc-004', recebimento_id: 'rec-007', periodo: '2025-04',
  status: 'concluida', iniciada_em: '2025-04-19T09:00:00Z', finalizada_em: '2025-04-19T14:00:00Z',
  total_itens: 2, total_validados: 1, total_divergentes: 1,
  editora_id: 'ed-tsm', _itens: CONC004_ITENS, _divergencias: CONC004_DIVS,
  _fonte_label: 'Sync — Publicidade', _recebimento_valor: 26320,
}

// ── Conciliacao 5 — Internacional USD ────────────────────────────────────────

const CONC005_DIVS: ConciliacaoDivergencia[] = []

const CONC005_ITENS: ConciliacaoItem[] = []

export const CONC_INTERNACIONAL_USD: Conciliacao = {
  id: 'conc-005', recebimento_id: 'rec-008', periodo: '2024-Q4',
  status: 'com_divergencia', iniciada_em: '2025-04-06T10:00:00Z', finalizada_em: null,
  total_itens: 3, total_validados: 2, total_divergentes: 1,
  editora_id: 'ed-tsm', _itens: CONC005_ITENS, _divergencias: CONC005_DIVS,
  _fonte_label: 'Internacional — BMI/UMP', _recebimento_valor: 48334.67,
}

// ── Conciliacao 6 — TV ────────────────────────────────────────────────────────

const CONC006_DIVS: ConciliacaoDivergencia[] = []

const CONC006_ITENS: ConciliacaoItem[] = []

export const CONC_TV_Q1: Conciliacao = {
  id: 'conc-006', recebimento_id: 'tv-recv-001', periodo: '2026-Q1',
  status: 'em_andamento', iniciada_em: '2026-04-12T09:00:00Z', finalizada_em: null,
  total_itens: 4, total_validados: 3, total_divergentes: 1,
  editora_id: 'ed-tsm', _itens: CONC006_ITENS, _divergencias: CONC006_DIVS,
  _fonte_label: 'TV Audiovisual — Globo', _recebimento_valor: 25662.50,
}

// ── Array geral ───────────────────────────────────────────────────────────────

export const MOCK_CONCILIACOES: Conciliacao[] = []

// ── KPI ───────────────────────────────────────────────────────────────────────

export const KPI_CONCILIACOES: KpiConciliacoes = {
  pendentes:        0,
  em_andamento:     0,
  concluidas:       0,
  com_divergencia:  0,
}


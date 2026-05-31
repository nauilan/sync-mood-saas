// ============================================================
// lib/mock-distribuicao.ts — Modulo 8: 4 distribuicoes realistas
// 1 calculando, 1 aprovacao, 2 executadas
// 30 itens: OBRA→LINKS→TITULARES→CESSIONARIOS
// IRPF em cessionario_pf, sem IRPF em cessionario_pj
// Recoupment aplicado em distribuicao executada
// Sync Mood Gestao Inteligente
// ============================================================

import type {
  Distribuicao, DistribuicaoItem, DistribuicaoRetencao, DistribuicaoRecoupment,
  KpiDistribuicoes, RecoupmentSaldo,
} from './types-distribuicao'

// ── Distribuicao 1 — BackOffice DSP Q1/2025 (EXECUTADA) ──────────────────────

const DIST001_RETENCOES: DistribuicaoRetencao[] = []
const DIST001_RECOUPMENT: DistribuicaoRecoupment[] = []
const DIST001_ITENS: DistribuicaoItem[] = []

export const DIST_BACKOFFICE_Q1_EXECUTADA: Distribuicao = {
  id: 'dist-001', codigo: 'DIST-2025-001', conciliacao_id: 'conc-001',
  periodo: '2025-Q1', valor_total: 0, total_titulares: 0,
  status: 'executada',
  calculado_em: '2025-04-22T11:00:00Z',
  aprovado_por: 'tit-pj-1',
  aprovado_em: '2025-04-24T10:00:00Z',
  executado_em: '2025-04-25T15:00:00Z',
  editora_id: 'ed-tsm',
  _itens: DIST001_ITENS,
  _conciliacao_periodo: '2025-Q1 BackOffice DSP',
}

// ── Distribuicao 2 — Sync + Internacional (EXECUTADA) ────────────────────────

const DIST002_RETENCOES: DistribuicaoRetencao[] = []
const DIST002_ITENS: DistribuicaoItem[] = []

export const DIST_SYNC_INTL_EXECUTADA: Distribuicao = {
  id: 'dist-002', codigo: 'DIST-2025-002', conciliacao_id: 'conc-004',
  periodo: '2025-Q1/Q2', valor_total: 0, total_titulares: 0,
  status: 'executada',
  calculado_em: '2025-05-10T09:00:00Z',
  aprovado_por: 'tit-pj-1',
  aprovado_em: '2025-05-12T14:00:00Z',
  executado_em: '2025-05-15T10:00:00Z',
  editora_id: 'ed-tsm',
  _itens: DIST002_ITENS,
  _conciliacao_periodo: '2025-Q1/Q2 Sync + Internacional',
}

// ── Distribuicao 3 — TV Audiovisual (APROVACAO) ───────────────────────────────

const DIST003_ITENS: DistribuicaoItem[] = []

export const DIST_TV_APROVACAO: Distribuicao = {
  id: 'dist-003', codigo: 'DIST-2026-001', conciliacao_id: 'conc-006',
  periodo: '2026-Q1', valor_total: 0, total_titulares: 0,
  status: 'aprovacao',
  calculado_em: '2026-04-13T10:00:00Z',
  aprovado_por: null,
  aprovado_em: null,
  executado_em: null,
  editora_id: 'ed-tsm',
  _itens: DIST003_ITENS,
  _conciliacao_periodo: '2026-Q1 TV Audiovisual Globo',
}

// ── Distribuicao 4 — BackOffice Q2/2025 (CALCULANDO) ─────────────────────────

const DIST004_ITENS: DistribuicaoItem[] = []

export const DIST_BACKOFFICE_Q2_CALCULANDO: Distribuicao = {
  id: 'dist-004', codigo: 'DIST-2025-003', conciliacao_id: null,
  periodo: '2025-Q2', valor_total: 0, total_titulares: 0,
  status: 'calculando',
  calculado_em: '2025-08-05T09:00:00Z',
  aprovado_por: null,
  aprovado_em: null,
  executado_em: null,
  editora_id: 'ed-tsm',
  _itens: DIST004_ITENS,
  _conciliacao_periodo: '2025-Q2 BackOffice DSP',
}

// ── Array geral ───────────────────────────────────────────────────────────────

export const MOCK_DISTRIBUICOES: Distribuicao[] = []

// ── KPI ───────────────────────────────────────────────────────────────────────

export const KPI_DISTRIBUICOES: KpiDistribuicoes = {
  calculando:             0,
  aguardando_aprovacao:   0,
  executadas_mes:         0,
  valor_total_distribuido: 0,
}

// ── Recoupment Saldos ─────────────────────────────────────────────────────────

export const MOCK_RECOUPMENT_SALDOS: RecoupmentSaldo[] = []

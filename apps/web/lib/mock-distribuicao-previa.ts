// ============================================================
// lib/mock-distribuicao-previa.ts
// Distribuição Prévia — valores esperados ANTES da efetivação.
// Baseado nos 9 arquivos TXT já processados (R$ 91.198,39 total).
// Aparece em: Distribuição (lista), CC Obra (saldo previsto),
//             CC Titular (valor previsto), Portal Autor (próxima dist.)
// ============================================================

import type { Distribuicao, DistribuicaoItem } from './types-distribuicao'

// ─── Prévia 1 — YouTube Maio/2026 (em construção pelo usuário) ────────────────
// Fontes: ST514893, ST516089, ST516090 (YouTube 2026-05-20)
//         ST510632, ST510633, ST510639 (YouTube 2026-05-12)
// Total previsto: R$ 91.198,39

export const MOCK_PREVIA_OBRA: Array<{
  obra_codigo: string
  obra_titulo: string
  valor_previsto: number
  sources: string[]
  periodo: string
}> = []

// ─── Prévia por Titular (top titulares) ───────────────────────────────────────

export interface PreviaTitular {
  titular_nome: string
  tipo: 'autor' | 'editora' | 'administradora'
  valor_previsto: number
  obras_count: number
  periodo: string
}

export const MOCK_PREVIA_TITULAR: PreviaTitular[] = []

// ─── Objeto Distribuicao com status = 'previa' ────────────────────────────────

export const MOCK_DISTRIBUICAO_PREVIA: Distribuicao = {
  id: 'dist-previa-001',
  codigo: 'DIST-PRE-2026-05-001',
  periodo: '2026-05',
  valor_total: 0,
  total_titulares: 0,
  status: 'previa',
  calculado_em: '2026-05-28T10:00:00Z',
  aprovado_por: null,
  aprovado_em: null,
  executado_em: null,
  _conciliacao_periodo: 'YouTube 2026-05 + iMúsica 2026-04',
}

// ─── KPIs da prévia ────────────────────────────────────────────────────────────

export const KPI_PREVIA = {
  total_previsto: 0,
  obras_identificadas: 0,
  titulares: 0,
  periodo: '2026-05',
  fontes: ['YOUTUBE', 'IMUSICA', 'SPOTIFY'],
  statements: ['ST514893', 'ST516089', 'ST516090', 'ST510632', 'ST510633', 'ST510639', 'ST505168', 'ST492347', 'ST492348'],
  data_prevista_pagamento: '2026-06-10',
}


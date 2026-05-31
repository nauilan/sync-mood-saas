// ============================================================
// lib/mock-exportacao.ts — Módulo 5: 3 exportações realistas
// Sync Mood Gestão Inteligente
// ============================================================

import type {
  Exportacao, ExportacaoObra, ExportacaoLog, ExportacaoRetorno, KpiExportacoes
} from './types-exportacao'

// ── Exportação 1 — SOCINPRO CWR v2.2 com retorno e ISWCs preenchidos ─────────

const EXP1_OBRAS: ExportacaoObra[] = []

const EXP1_LOGS: ExportacaoLog[] = []

const EXP1_RETORNO: ExportacaoRetorno = {
  id:                  'ret-001',
  exportacao_id:       'exp-001',
  arquivo_retorno_url: '/docs/retorno-socinpro-2025-0310.cwr',
  total_aceitas:       4,
  total_rejeitadas:    0,
  total_divergencias:  1,
  processado_em:       '2025-03-10T14:30:00Z',
}

export const EXP_SOCINPRO_COM_RETORNO: Exportacao = {
  id:              'exp-001',
  codigo:          'EXP-2025-001',
  destino:         'socinpro',
  formato:         'cwr_v22',
  periodo_inicio:  '2025-01-01',
  periodo_fim:     '2025-03-31',
  total_obras:     5,
  total_titulares: 12,
  status:          'com_retorno',
  arquivo_url:     '/docs/exp-2025-001-cwr22.cwr',
  hash:            'a3f9b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
  criado_por:      'admin@topshowmusic.com.br',
  editora_id:      'ed-tsm',
  criado_em:       '2025-03-01T10:00:00Z',
  enviado_em:      '2025-03-01T10:08:00Z',
  processado_em:   '2025-03-10T14:30:00Z',
  _obras:          EXP1_OBRAS,
  _logs:           EXP1_LOGS,
  _retorno:        EXP1_RETORNO,
}

// ── Exportação 2 — BackOffice Music Services processada ───────────────────────

const EXP2_OBRAS: ExportacaoObra[] = []

const EXP2_LOGS: ExportacaoLog[] = []

export const EXP_BACKOFFICE_PROCESSADA: Exportacao = {
  id:              'exp-002',
  codigo:          'EXP-2025-002',
  destino:         'backoffice_music_services',
  formato:         'xml',
  periodo_inicio:  '2025-01-01',
  periodo_fim:     '2025-04-30',
  total_obras:     5,
  total_titulares: 10,
  status:          'processado',
  arquivo_url:     '/docs/exp-2025-002-bms.xml',
  hash:            'b4f0c3d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3',
  criado_por:      'admin@topshowmusic.com.br',
  editora_id:      'ed-tsm',
  criado_em:       '2025-04-01T09:00:00Z',
  enviado_em:      '2025-04-01T09:10:00Z',
  processado_em:   '2025-04-05T11:00:00Z',
  _obras:          EXP2_OBRAS,
  _logs:           EXP2_LOGS,
  _retorno:        null,
}

// ── Exportação 3 — Em preparação ─────────────────────────────────────────────

const EXP3_OBRAS: ExportacaoObra[] = []

const EXP3_LOGS: ExportacaoLog[] = []

export const EXP_PREPARANDO: Exportacao = {
  id:              'exp-003',
  codigo:          'EXP-2025-003',
  destino:         'socinpro',
  formato:         'cwr_v30',
  periodo_inicio:  '2025-04-01',
  periodo_fim:     '2025-06-30',
  total_obras:     3,
  total_titulares: 8,
  status:          'preparando',
  arquivo_url:     null,
  hash:            null,
  criado_por:      'admin@topshowmusic.com.br',
  editora_id:      'ed-tsm',
  criado_em:       '2025-05-15T14:00:00Z',
  enviado_em:      null,
  processado_em:   null,
  _obras:          EXP3_OBRAS,
  _logs:           EXP3_LOGS,
  _retorno:        null,
}

// ── Array geral ───────────────────────────────────────────────────────────────

export const MOCK_EXPORTACOES: Exportacao[] = []

// ── KPIs ──────────────────────────────────────────────────────────────────────

export const KPI_EXPORTACOES: KpiExportacoes = {
  total:       0,
  enviadas:    0,
  com_retorno: 0,
  erros:       0,
  processadas: 0,
}

// ── Obras disponíveis para seleção no wizard ──────────────────────────────────

export const OBRAS_DISPONIVEIS_EXPORTACAO: Array<{
  id: string
  codigo: string
  titulo: string
  iswc: string | null
  titulares: number
  genero: string
  percentual_controlado: number
}> = []

// ── Preview CWR simulado ──────────────────────────────────────────────────────

export const CWR_PREVIEW_LINES: string[] = []



// ============================================================
// lib/mock-autorizacoes.ts — Modulo 4: Autorizacoes
// Sync Mood Gestao Inteligente
// Cobre 8 tipos: fonograma, videofonograma, sincronizacao,
//   publicidade, tv, edicao_grafica, incidental, versao
// ============================================================

import type { Autorizacao, AutorizacaoObra, AutorizacaoDocumento } from './types-autorizacoes'

// ── 1. Fonograma — exclusividade vigente, pago a editora ─────────────────────
export const AUTH_FONOGRAMA_EXCLUSIVO: Autorizacao = {
  id: 'auth-001',
  numero_autorizacao: 'AUTH-2025-00001',
  tipo: 'fonograma',
  status: 'assinado',
  modelo_negocio: 'pago_editora',
  solicitante_nome: 'Som Total Records Producoes Fonograficas Ltda',
  licenciado_nome: 'Som Total Records Producoes Fonograficas Ltda',
  data_solicitacao: '2025-03-01',
  data_emissao: '2025-03-10',
  data_inicio: '2025-04-01',
  data_fim: '2027-04-01',
  territorio: 'BR',
  exclusividade: true,
  exclusividade_periodo_meses: 24,
  exclusividade_data_fim: '2027-04-01',
  valor_total: 18000,
  moeda: 'BRL',
  observacoes: 'Gravacao exclusiva de 100% COUNTRY pelo Grupo Sensacao. Exclusividade por 24 meses em territorio nacional.',
  pdf_url: '/docs/auth-2025-00001.pdf',
  pdf_assinado_url: '/docs/auth-2025-00001-signed.pdf',
  token_assinatura: 'TKN-A001-X9K2M',
  status_assinatura: 'assinado',
  created_at: '2025-03-01T10:00:00Z',
  updated_at: '2025-03-10T14:00:00Z',
  _obras: [
    {
      id: 'ao-001-1', autorizacao_id: 'auth-001',
      obra_id: 'obra-0001', obra_titulo: '100% COUNTRY', obra_codigo: '27',
      percentual_controlado: 62.5, percentual_autorizado: 62.5,
      tipo_uso: undefined, tempo_utilizacao: 'integral', valor: 18000,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-001-1', autorizacao_id: 'auth-001', tipo: 'contrato_licenca_editora', url: '/docs/auth-2025-00001.pdf', hash: 'abc123', assinado: false, created_at: '2025-03-05T10:00:00Z' },
    { id: 'doc-001-2', autorizacao_id: 'auth-001', tipo: 'contrato_assinado', url: '/docs/auth-2025-00001-signed.pdf', hash: 'def456', assinado: true, token_assinatura: 'TKN-A001-X9K2M', data_assinatura: '2025-03-10T14:00:00Z', assinado_por: 'Marina Lopes', created_at: '2025-03-10T14:00:00Z' },
  ],
}

// ── 2. Fonograma — sem exclusividade, pago ao autor ──────────────────────────
export const AUTH_FONOGRAMA_SIMPLES: Autorizacao = {
  id: 'auth-002',
  numero_autorizacao: 'AUTH-2025-00002',
  tipo: 'fonograma',
  status: 'emitido',
  modelo_negocio: 'pago_autor',
  solicitante_nome: 'Independente Records',
  licenciado_nome: 'Independente Records',
  data_solicitacao: '2025-04-15',
  data_emissao: '2025-04-22',
  data_inicio: '2025-05-01',
  data_fim: '2026-05-01',
  territorio: 'BR',
  exclusividade: false,
  valor_total: 5000,
  moeda: 'BRL',
  observacoes: 'Autorizacao de gravacao de 3 TAMBORES sem exclusividade.',
  pdf_url: '/docs/auth-2025-00002.pdf',
  status_assinatura: 'pendente',
  created_at: '2025-04-15T10:00:00Z',
  updated_at: '2025-04-22T11:00:00Z',
  _obras: [
    {
      id: 'ao-002-1', autorizacao_id: 'auth-002',
      obra_id: 'obra-0002', obra_titulo: '3 TAMBORES', obra_codigo: '482',
      percentual_controlado: 100, percentual_autorizado: 100,
      tipo_uso: undefined, tempo_utilizacao: 'integral', valor: 5000,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-002-1', autorizacao_id: 'auth-002', tipo: 'contrato_direto_autor', url: '/docs/auth-2025-00002.pdf', hash: null, assinado: false, token_assinatura: 'TKN-A002-P3R7Q', created_at: '2025-04-22T11:00:00Z' },
  ],
}

// ── 3. Videofonograma — clipe oficial, pago a editora ────────────────────────
export const AUTH_VIDEO_CLIPE: Autorizacao = {
  id: 'auth-003',
  numero_autorizacao: 'AUTH-2025-00003',
  tipo: 'fonograma',
  status: 'pago',
  modelo_negocio: 'pago_editora',
  solicitante_nome: 'Visual Works Producao Audiovisual',
  licenciado_nome: 'Visual Works Producao Audiovisual',
  data_solicitacao: '2025-02-10',
  data_emissao: '2025-02-20',
  data_inicio: '2025-03-01',
  data_fim: '2027-03-01',
  territorio: 'MUNDIAL',
  exclusividade: false,
  valor_total: 12000,
  moeda: 'BRL',
  observacoes: 'Clipe oficial de 100% COUNTRY — distribuicao mundial em plataformas digitais.',
  pdf_url: '/docs/auth-2025-00003.pdf',
  pdf_assinado_url: '/docs/auth-2025-00003-signed.pdf',
  token_assinatura: 'TKN-A003-V8C1L',
  status_assinatura: 'assinado',
  created_at: '2025-02-10T10:00:00Z',
  updated_at: '2025-02-25T16:00:00Z',
  _obras: [
    {
      id: 'ao-003-1', autorizacao_id: 'auth-003',
      obra_id: 'obra-0001', obra_titulo: '100% COUNTRY', obra_codigo: '27',
      percentual_controlado: 62.5, percentual_autorizado: 50.0,
      tipo_uso: undefined, tempo_utilizacao: 'integral', valor: 12000,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-003-1', autorizacao_id: 'auth-003', tipo: 'contrato_licenca_editora', url: '/docs/auth-2025-00003.pdf', hash: 'ghi789', assinado: false, created_at: '2025-02-20T10:00:00Z' },
    { id: 'doc-003-2', autorizacao_id: 'auth-003', tipo: 'contrato_assinado', url: '/docs/auth-2025-00003-signed.pdf', hash: 'jkl012', assinado: true, token_assinatura: 'TKN-A003-V8C1L', data_assinatura: '2025-02-25T16:00:00Z', assinado_por: 'Marina Lopes', created_at: '2025-02-25T16:00:00Z' },
    { id: 'doc-003-3', autorizacao_id: 'auth-003', tipo: 'comprovante_pagamento', url: '/docs/auth-2025-00003-pgto.pdf', hash: null, assinado: false, created_at: '2025-03-15T10:00:00Z' },
  ],
}

// ── 4. Sincronizacao Audiovisual — tema de novela, exclusividade em alerta ───
export const AUTH_SINC_NOVELA: Autorizacao = {
  id: 'auth-004',
  numero_autorizacao: 'AUTH-2025-00004',
  tipo: 'sincronizacao',
  status: 'assinado',
  modelo_negocio: 'pago_editora',
  solicitante_nome: 'Globo Comunicacoes e Participacoes S.A.',
  licenciado_nome: 'Globo Comunicacoes e Participacoes S.A.',
  data_solicitacao: '2025-01-10',
  data_emissao: '2025-01-20',
  data_inicio: '2025-02-01',
  data_fim: '2026-01-31',
  territorio: 'BR',
  exclusividade: true,
  exclusividade_periodo_meses: 12,
  exclusividade_data_fim: '2026-06-06',  // 12 dias restantes — em alerta
  valor_total: 85000,
  moeda: 'BRL',
  observacoes: 'Tema de abertura da novela 4K. Exclusividade em TV Aberta.',
  pdf_url: '/docs/auth-2025-00004.pdf',
  pdf_assinado_url: '/docs/auth-2025-00004-signed.pdf',
  token_assinatura: 'TKN-A004-M5N8P',
  status_assinatura: 'assinado',
  created_at: '2025-01-10T10:00:00Z',
  updated_at: '2025-01-25T09:00:00Z',
  _obras: [
    {
      id: 'ao-004-1', autorizacao_id: 'auth-004',
      obra_id: 'obra-0003', obra_titulo: '4K', obra_codigo: '399',
      percentual_controlado: 100, percentual_autorizado: 100,
      tipo_uso: 'tema', tempo_utilizacao: 'abertura integral (90s)', valor: 85000,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-004-1', autorizacao_id: 'auth-004', tipo: 'contrato_licenca_editora', url: '/docs/auth-2025-00004.pdf', hash: 'mno345', assinado: false, created_at: '2025-01-20T10:00:00Z' },
    { id: 'doc-004-2', autorizacao_id: 'auth-004', tipo: 'contrato_assinado', url: '/docs/auth-2025-00004-signed.pdf', hash: 'pqr678', assinado: true, token_assinatura: 'TKN-A004-M5N8P', data_assinatura: '2025-01-25T09:00:00Z', assinado_por: 'Marina Lopes', created_at: '2025-01-25T09:00:00Z' },
  ],
}

// ── 5. Publicidade — sem onus (material cultural) ────────────────────────────
export const AUTH_PUBLICIDADE_SEMONUS: Autorizacao = {
  id: 'auth-005',
  numero_autorizacao: 'AUTH-2026-00001',
  tipo: 'publicidade',
  status: 'emitido',
  modelo_negocio: 'sem_onus',
  solicitante_nome: 'Instituto Cultural Melodia',
  licenciado_nome: 'Instituto Cultural Melodia',
  data_solicitacao: '2026-01-10',
  data_emissao: '2026-01-18',
  data_inicio: '2026-02-01',
  data_fim: '2026-12-31',
  territorio: 'BR',
  exclusividade: false,
  valor_total: null,
  moeda: 'BRL',
  observacoes: 'Uso sem onus para campanha de incentivo a musica brasileira sem fins comerciais.',
  pdf_url: '/docs/auth-2026-00001.pdf',
  status_assinatura: 'enviado',
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-01-18T14:00:00Z',
  _obras: [
    {
      id: 'ao-005-1', autorizacao_id: 'auth-005',
      obra_id: 'obra-0002', obra_titulo: '3 TAMBORES', obra_codigo: '482',
      percentual_controlado: 100, percentual_autorizado: 100,
      tipo_uso: 'publicidade', tempo_utilizacao: 'maximo 30s', valor: null,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-005-1', autorizacao_id: 'auth-005', tipo: 'declaracao_gratuita', url: '/docs/auth-2026-00001.pdf', hash: null, assinado: false, token_assinatura: 'TKN-A005-G2D4F', created_at: '2026-01-18T14:00:00Z' },
  ],
}

// ── 6. Uso em TV — vinheta, pago a editora ───────────────────────────────────
export const AUTH_TV_VINHETA: Autorizacao = {
  id: 'auth-006',
  numero_autorizacao: 'AUTH-2026-00002',
  tipo: 'tv',
  status: 'em_negociacao',
  modelo_negocio: 'pago_editora',
  solicitante_nome: 'Multishow Entretenimento',
  licenciado_nome: 'Multishow Entretenimento',
  data_solicitacao: '2026-03-01',
  data_emissao: null,
  data_inicio: '2026-04-01',
  data_fim: '2027-04-01',
  territorio: 'BR',
  exclusividade: false,
  valor_total: 22000,
  moeda: 'BRL',
  observacoes: 'Vinheta de abertura do programa Musica Brasil na Multishow.',
  pdf_url: null,
  status_assinatura: null,
  created_at: '2026-03-01T10:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
  _obras: [
    {
      id: 'ao-006-1', autorizacao_id: 'auth-006',
      obra_id: 'obra-0001', obra_titulo: '100% COUNTRY', obra_codigo: '27',
      percentual_controlado: 62.5, percentual_autorizado: 62.5,
      tipo_uso: 'vinheta', tempo_utilizacao: 'maximo 15s', valor: 22000,
    } as AutorizacaoObra,
  ],
  _documentos: [],
}

// ── 7. Edicao Grafica — songbook, pago ao autor ──────────────────────────────
export const AUTH_EDICAO_GRAFICA: Autorizacao = {
  id: 'auth-007',
  numero_autorizacao: 'AUTH-2026-00003',
  tipo: 'edicao_grafica',
  status: 'aprovado',
  modelo_negocio: 'pago_autor',
  solicitante_nome: 'Editora Partitura Viva Ltda',
  licenciado_nome: 'Editora Partitura Viva Ltda',
  data_solicitacao: '2026-02-10',
  data_emissao: null,
  data_inicio: '2026-03-01',
  data_fim: '2028-03-01',
  territorio: 'BR',
  exclusividade: true,
  exclusividade_periodo_meses: 24,
  exclusividade_data_fim: '2028-03-01',
  valor_total: 4500,
  moeda: 'BRL',
  observacoes: 'Publicacao de songbook com letras e partituras. Tiragem de 1000 copias.',
  pdf_url: null,
  status_assinatura: null,
  created_at: '2026-02-10T10:00:00Z',
  updated_at: '2026-02-15T10:00:00Z',
  _obras: [
    {
      id: 'ao-007-1', autorizacao_id: 'auth-007',
      obra_id: 'obra-0002', obra_titulo: '3 TAMBORES', obra_codigo: '482',
      percentual_controlado: 100, percentual_autorizado: 100,
      tipo_uso: 'songbook', tempo_utilizacao: null, valor: 4500,
    } as AutorizacaoObra,
  ],
  _documentos: [],
}

// ── 8. Versao — versao em ingles, pago a editora ─────────────────────────────
export const AUTH_VERSAO_INGLES: Autorizacao = {
  id: 'auth-008',
  numero_autorizacao: 'AUTH-2026-00004',
  tipo: 'versao',
  status: 'rascunho',
  modelo_negocio: 'pago_editora',
  solicitante_nome: 'Universal Music Brasil',
  licenciado_nome: 'Universal Music Brasil',
  data_solicitacao: '2026-04-01',
  data_emissao: null,
  data_inicio: null,
  data_fim: null,
  territorio: 'MUNDIAL',
  exclusividade: false,
  valor_total: 15000,
  moeda: 'BRL',
  observacoes: 'Versao em ingles de 100% COUNTRY para distribuicao internacional.',
  pdf_url: null,
  status_assinatura: null,
  created_at: '2026-04-01T10:00:00Z',
  updated_at: '2026-04-01T10:00:00Z',
  _obras: [
    {
      id: 'ao-008-1', autorizacao_id: 'auth-008',
      obra_id: 'obra-0001', obra_titulo: '100% COUNTRY', obra_codigo: '27',
      percentual_controlado: 62.5, percentual_autorizado: 62.5,
      tipo_uso: 'versao_idioma', tempo_utilizacao: null, valor: 15000,
    } as AutorizacaoObra,
  ],
  _documentos: [],
}

// ── 9. Uso Incidental — sem onus ─────────────────────────────────────────────
export const AUTH_INCIDENTAL: Autorizacao = {
  id: 'auth-009',
  numero_autorizacao: 'AUTH-2026-00005',
  tipo: 'incidental',
  status: 'faturado',
  modelo_negocio: 'sem_onus',
  solicitante_nome: 'Producoes Cena Viva Ltda',
  licenciado_nome: 'Producoes Cena Viva Ltda',
  data_solicitacao: '2026-01-20',
  data_emissao: '2026-02-01',
  data_inicio: '2026-02-10',
  data_fim: '2026-12-31',
  territorio: 'BR',
  exclusividade: false,
  valor_total: null,
  moeda: 'BRL',
  observacoes: 'Uso incidental em cena de festa de aniversario no longa-metragem Verao Eterno.',
  pdf_url: '/docs/auth-2026-00005.pdf',
  status_assinatura: 'assinado',
  created_at: '2026-01-20T10:00:00Z',
  updated_at: '2026-02-05T10:00:00Z',
  _obras: [
    {
      id: 'ao-009-1', autorizacao_id: 'auth-009',
      obra_id: 'obra-0003', obra_titulo: '4K', obra_codigo: '399',
      percentual_controlado: 100, percentual_autorizado: 100,
      tipo_uso: 'incidental', tempo_utilizacao: 'maximo 20s', valor: null,
    } as AutorizacaoObra,
  ],
  _documentos: [
    { id: 'doc-009-1', autorizacao_id: 'auth-009', tipo: 'declaracao_gratuita', url: '/docs/auth-2026-00005.pdf', hash: 'stu901', assinado: true, token_assinatura: 'TKN-A009-H7J0K', data_assinatura: '2026-02-05T10:00:00Z', assinado_por: 'Marina Lopes', created_at: '2026-02-05T10:00:00Z' },
  ],
}

// ── Export geral ──────────────────────────────────────────────────────────────

export const MOCK_AUTORIZACOES: Autorizacao[] = []

export function getAutorizacaoById(id: string): Autorizacao | undefined {
  return MOCK_AUTORIZACOES.find(a => a.id === id)
}

export function getAutorizacoesByObra(obraId: string): Autorizacao[] {
  return MOCK_AUTORIZACOES.filter(a =>
    a._obras?.some(o => o.obra_id === obraId)
  )
}

export const KPI_AUTORIZACOES = {
  total:          MOCK_AUTORIZACOES.length,
  emitidas:       MOCK_AUTORIZACOES.filter(a => a.status === 'emitido').length,
  faturadas:      MOCK_AUTORIZACOES.filter(a => a.status === 'faturado').length,
  pagas:          MOCK_AUTORIZACOES.filter(a => a.status === 'pago').length,
  em_negociacao:  MOCK_AUTORIZACOES.filter(a => a.status === 'em_negociacao').length,
  valor_total:    MOCK_AUTORIZACOES.reduce((s, a) => s + (a.valor_total ?? 0), 0),
  com_exclusividade: MOCK_AUTORIZACOES.filter(a => a.exclusividade).length,
}
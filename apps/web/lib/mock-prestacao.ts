// ============================================================
// lib/mock-prestacao.ts — Módulo 10: Prestação de Contas
// 6 prestações + 8 envios + 1 contestação
// Sync Mood Gestão Inteligente
// ============================================================

import type {
  PrestacaoConta, PrestacaoItem, PrestacaoEnvio, PrestacaoContestacao,
  KpiPrestacao, RegraAutomacaoPrestacao,
} from './types-prestacao'

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 1 — Nauilan Q4/2025 — APROVADA
// ════════════════════════════════════════════════════════════════════════════

const PC1_ITENS: PrestacaoItem[] = [
  { id: 'pci-001-1', prestacao_id: 'pc-001', obra_id: 'obra-001', obra_titulo: 'Amo Noite e Dia', obra_codigo: 'TSM-OBR-001', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 974.47, percentual_aplicado: 25, valor_liquido: 707.49, descricao: 'BackOffice DSP — Link 1 Nauilan (25%)' },
  { id: 'pci-001-2', prestacao_id: 'pc-001', obra_id: 'obra-002', obra_titulo: 'Saudade do Interior', obra_codigo: 'TSM-OBR-002', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 585.30, percentual_aplicado: 50, valor_liquido: 424.59, descricao: 'BackOffice DSP — Link único Nauilan (50%)' },
]

const PC1_ENVIOS: PrestacaoEnvio[] = [
  { id: 'env-001-1', prestacao_id: 'pc-001', canal: 'email', destino: 'nauilan@email.com', status: 'visualizado', tentativa: 1, log_json: { smtp_id: 'msg-001', opened_at: '2026-01-16T14:22:00Z' }, enviado_em: '2026-01-15T10:00:00Z' },
  { id: 'env-001-2', prestacao_id: 'pc-001', canal: 'whatsapp', destino: '+5521999990001', status: 'entregue', tentativa: 1, log_json: { message_id: 'wa-001', delivered_at: '2026-01-15T10:05:00Z' }, enviado_em: '2026-01-15T10:00:00Z' },
]

export const PC_001: PrestacaoConta = {
  id: 'pc-001', codigo: 'PC-2026-001',
  titular_id: 'tit-pf-1', titular_nome: 'Nauilan Barbosa Silva', titular_tipo: 'PF',
  periodo_inicio: '2025-10-01', periodo_fim: '2025-12-31',
  valor_bruto: 1559.77, retencoes_total: 427.94, recoupment_aplicado: 0, valor_liquido: 1131.83,
  status: 'aprovada',
  data_geracao: '2026-01-15T08:00:00Z', data_envio: '2026-01-15T10:00:00Z',
  canal_envio: 'multiplo', data_aprovacao: '2026-01-18T15:30:00Z',
  pdf_url: '/demonstrativos/pc-001.pdf',
  itens: PC1_ITENS, envios: PC1_ENVIOS, contestacoes: [],
}

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 2 — Giovani Q4/2025 — ENVIADA
// ════════════════════════════════════════════════════════════════════════════

export const PC_002: PrestacaoConta = {
  id: 'pc-002', codigo: 'PC-2026-002',
  titular_id: 'tit-pf-2', titular_nome: 'Giovani Alves Rodrigues', titular_tipo: 'PF',
  periodo_inicio: '2025-10-01', periodo_fim: '2025-12-31',
  valor_bruto: 487.24, retencoes_total: 133.99, recoupment_aplicado: 0, valor_liquido: 353.25,
  status: 'enviada',
  data_geracao: '2026-01-15T08:00:00Z', data_envio: '2026-01-15T10:00:00Z',
  canal_envio: 'email',
  pdf_url: '/demonstrativos/pc-002.pdf',
  itens: [{ id: 'pci-002-1', prestacao_id: 'pc-002', obra_id: 'obra-001', obra_titulo: 'Amo Noite e Dia', obra_codigo: 'TSM-OBR-001', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 487.24, percentual_aplicado: 12.5, valor_liquido: 353.25, descricao: 'BackOffice DSP — Link 2 Giovani (12.5%)' }],
  envios: [{ id: 'env-002-1', prestacao_id: 'pc-002', canal: 'email', destino: 'giovani@email.com', status: 'entregue', tentativa: 1, log_json: { smtp_id: 'msg-002' }, enviado_em: '2026-01-15T10:00:00Z' }],
  contestacoes: [],
}

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 3 — Edi Music Q4/2025 — PAGA
// ════════════════════════════════════════════════════════════════════════════

export const PC_003: PrestacaoConta = {
  id: 'pc-003', codigo: 'PC-2026-003',
  titular_id: 'tit-pj-1', titular_nome: 'Edi Music Edicoes Musicais Ltda', titular_tipo: 'PJ',
  periodo_inicio: '2025-10-01', periodo_fim: '2025-12-31',
  valor_bruto: 2877.93, retencoes_total: 143.89, recoupment_aplicado: 0, valor_liquido: 2734.04,
  status: 'paga',
  data_geracao: '2026-01-15T08:00:00Z', data_envio: '2026-01-15T10:00:00Z',
  canal_envio: 'email', data_aprovacao: '2026-01-20T09:00:00Z',
  pdf_url: '/demonstrativos/pc-003.pdf',
  itens: [
    { id: 'pci-003-1', prestacao_id: 'pc-003', obra_id: 'obra-001', obra_titulo: 'Amo Noite e Dia', obra_codigo: 'TSM-OBR-001', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 974.47, percentual_aplicado: 25, valor_liquido: 830.58, descricao: 'BackOffice DSP — cessionário PJ Link 1 (25%)' },
    { id: 'pci-003-2', prestacao_id: 'pc-003', obra_id: 'obra-001', obra_titulo: 'Amo Noite e Dia', obra_codigo: 'TSM-OBR-001', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 487.24, percentual_aplicado: 12.5, valor_liquido: 487.24, descricao: 'BackOffice DSP — editora Link 2 (12.5%)' },
    { id: 'pci-003-3', prestacao_id: 'pc-003', obra_id: 'obra-002', obra_titulo: 'Saudade do Interior', obra_codigo: 'TSM-OBR-002', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q4/2025', valor_bruto: 1416.22, percentual_aplicado: 25, valor_liquido: 1416.22, descricao: 'BackOffice DSP — Top Show AM (25%)' },
  ],
  envios: [
    { id: 'env-003-1', prestacao_id: 'pc-003', canal: 'email', destino: 'contato@edimusic.com', status: 'visualizado', tentativa: 1, log_json: { smtp_id: 'msg-003', opened_at: '2026-01-16T09:10:00Z' }, enviado_em: '2026-01-15T10:00:00Z' },
  ],
  contestacoes: [],
}

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 4 — Marcelo Q1/2026 — CONTESTADA
// ════════════════════════════════════════════════════════════════════════════

const PC4_CONTESTACAO: PrestacaoContestacao = {
  id: 'cont-004-1', prestacao_id: 'pc-004',
  titular_id: 'tit-pf-3', titular_nome: 'Marcelo Costa Ferreira',
  motivo: 'Percentual incorreto',
  status: 'em_analise',
  descricao: 'O percentual aplicado na obra TSM-OBR-001 (Amo Noite e Dia) consta como 12.5% mas deveria ser 15% conforme aditivo contratual de 2024.',
  criada_em: '2026-04-20T14:30:00Z',
}

export const PC_004: PrestacaoConta = {
  id: 'pc-004', codigo: 'PC-2026-004',
  titular_id: 'tit-pf-3', titular_nome: 'Marcelo Costa Ferreira', titular_tipo: 'PF',
  periodo_inicio: '2026-01-01', periodo_fim: '2026-03-31',
  valor_bruto: 890.11, retencoes_total: 244.78, recoupment_aplicado: 0, valor_liquido: 645.33,
  status: 'contestada',
  data_geracao: '2026-04-10T08:00:00Z', data_envio: '2026-04-10T10:00:00Z',
  canal_envio: 'whatsapp',
  pdf_url: '/demonstrativos/pc-004.pdf',
  itens: [{ id: 'pci-004-1', prestacao_id: 'pc-004', obra_id: 'obra-001', obra_titulo: 'Amo Noite e Dia', obra_codigo: 'TSM-OBR-001', recebimento_id: 'rec-005', recebimento_descricao: 'Spotify Q1/2026', valor_bruto: 890.11, percentual_aplicado: 12.5, valor_liquido: 645.33, descricao: 'BackOffice DSP — Marcelo Link 3 (12.5%)' }],
  envios: [
    { id: 'env-004-1', prestacao_id: 'pc-004', canal: 'whatsapp', destino: '+5511988880003', status: 'visualizado', tentativa: 1, log_json: { message_id: 'wa-004', read_at: '2026-04-10T11:15:00Z' }, enviado_em: '2026-04-10T10:00:00Z' },
  ],
  contestacoes: [PC4_CONTESTACAO],
}

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 5 — LR Edicoes Q1/2026 — APROVADA (aguardando pgto)
// ════════════════════════════════════════════════════════════════════════════

export const PC_005: PrestacaoConta = {
  id: 'pc-005', codigo: 'PC-2026-005',
  titular_id: 'tit-pj-2', titular_nome: 'LR Edicoes Musicais Ltda', titular_tipo: 'PJ',
  periodo_inicio: '2026-01-01', periodo_fim: '2026-03-31',
  valor_bruto: 310.00, retencoes_total: 0, recoupment_aplicado: 0, valor_liquido: 310.00,
  status: 'aprovada',
  data_geracao: '2026-04-10T08:00:00Z', data_envio: '2026-04-10T10:00:00Z',
  canal_envio: 'email', data_aprovacao: '2026-04-12T09:00:00Z',
  pdf_url: '/demonstrativos/pc-005.pdf',
  itens: [{ id: 'pci-005-1', prestacao_id: 'pc-005', obra_id: 'obra-004', obra_titulo: 'Feliz Demais', obra_codigo: 'TSM-OBR-004', recebimento_id: 'rec-005', recebimento_descricao: 'Spotify Q1/2026', valor_bruto: 310.00, percentual_aplicado: 25, valor_liquido: 310.00, descricao: 'BackOffice DSP — LR Edicoes Link 1 (25%)' }],
  envios: [
    { id: 'env-005-1', prestacao_id: 'pc-005', canal: 'email', destino: 'contato@lredicoes.com', status: 'entregue', tentativa: 1, enviado_em: '2026-04-10T10:00:00Z' },
  ],
  contestacoes: [],
}

// ════════════════════════════════════════════════════════════════════════════
// PRESTAÇÃO 6 — Daniel Q1/2026 — GERADA (pendente envio)
// ════════════════════════════════════════════════════════════════════════════

export const PC_006: PrestacaoConta = {
  id: 'pc-006', codigo: 'PC-2026-006',
  titular_id: 'tit-pf-5', titular_nome: 'Daniel Souza Mendes', titular_tipo: 'PF',
  periodo_inicio: '2026-01-01', periodo_fim: '2026-03-31',
  valor_bruto: 280.00, retencoes_total: 77.00, recoupment_aplicado: 0, valor_liquido: 203.00,
  status: 'gerada',
  data_geracao: '2026-05-01T08:00:00Z',
  pdf_url: '/demonstrativos/pc-006.pdf',
  itens: [{ id: 'pci-006-1', prestacao_id: 'pc-006', obra_id: 'obra-005', obra_titulo: 'Vem Dancar', obra_codigo: 'TSM-OBR-005', recebimento_id: 'rec-003', recebimento_descricao: 'Spotify Q1/2026', valor_bruto: 280.00, percentual_aplicado: 50, valor_liquido: 203.00, descricao: 'BackOffice DSP — Daniel Link 1 (50%)' }],
  envios: [
    { id: 'env-006-1', prestacao_id: 'pc-006', canal: 'email', destino: 'daniel@email.com', status: 'enfileirado', tentativa: 1, enviado_em: undefined },
    { id: 'env-006-2', prestacao_id: 'pc-006', canal: 'whatsapp', destino: '+5571966660005', status: 'erro', tentativa: 2, log_json: { error: 'Invalid number format', retry_at: '2026-05-01T10:30:00Z' }, enviado_em: undefined },
  ],
  contestacoes: [],
}

export const MOCK_PRESTACOES: PrestacaoConta[] = []

export const MOCK_CONTESTACOES: PrestacaoContestacao[] = []

export function getPrestacaoById(id: string) {
  return MOCK_PRESTACOES.find(p => p.id === id)
}

export const KPI_PRESTACOES: KpiPrestacao = {
  total_geradas: MOCK_PRESTACOES.filter(p => p.status === 'gerada').length,
  total_enviadas: MOCK_PRESTACOES.filter(p => p.status === 'enviada').length,
  total_aprovadas: MOCK_PRESTACOES.filter(p => p.status === 'aprovada').length,
  total_contestadas: MOCK_PRESTACOES.filter(p => p.status === 'contestada').length,
  total_pagas: MOCK_PRESTACOES.filter(p => p.status === 'paga').length,
  valor_total_pendente: MOCK_PRESTACOES
    .filter(p => p.status !== 'paga' && p.status !== 'contestada')
    .reduce((s, p) => s + p.valor_liquido, 0),
}

export const MOCK_REGRAS_AUTOMACAO: RegraAutomacaoPrestacao[] = []


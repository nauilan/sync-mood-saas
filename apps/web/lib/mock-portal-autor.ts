// ============================================================
// mock-portal-autor.ts — Portal / App do Autor
// Visão de Nauilan logado — Sync Mood Gestão Inteligente
// Onda 7
// ============================================================

import type {
  PortalAutorPerfil, PortalObraAutor, PortalRecebimento,
  PortalDemonstrativo, PortalRecibo, PortalRoyaltyFuturo,
  PortalKpis, PortalInformeRendimentos,
} from './types-portal-autor'

// ============================================================
// PERFIL DE NAUILAN
// ============================================================

export const PORTAL_PERFIL: PortalAutorPerfil = {
  id: 'tit-003',
  nome: 'Nauilan Barbosa',
  nome_artistico: 'Nauilan',
  cpf: '123.456.789-00',
  email: 'nauilan@gmail.com',
  telefone: '(11) 98888-0001',
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music',
  cae: 'CAE-456789',
  ipi: 'IPI-123456',
  dados_bancarios: {
    banco: 'Banco do Brasil',
    agencia: '1234-5',
    conta: '98765-4',
    tipo: 'corrente',
    pix_chave: 'nauilan@gmail.com',
    validado: true,
  },
  pendencias: [],
}

// ============================================================
// OBRAS DE NAUILAN (5)
// ============================================================

export const PORTAL_OBRAS: PortalObraAutor[] = []

// ============================================================
// RECEBIMENTOS (últimos 6)
// ============================================================

export const PORTAL_RECEBIMENTOS: PortalRecebimento[] = []

// ============================================================
// DEMONSTRATIVOS TRIMESTRAIS (6)
// ============================================================

export const PORTAL_DEMONSTRATIVOS: PortalDemonstrativo[] = []

// ============================================================
// RECIBOS (12)
// ============================================================

export const PORTAL_RECIBOS: PortalRecibo[] = []

// ============================================================
// ROYALTIES FUTUROS
// ============================================================

export const PORTAL_ROYALTIES_FUTUROS: PortalRoyaltyFuturo[] = []

// ============================================================
// KPIs DO PORTAL
// ============================================================

export const PORTAL_KPIS: PortalKpis = {
  saldo_disponivel: 0,
  saldo_bloqueado: 0,
  recebimentos_12m: 0,
  royalties_futuros_previstos: 0,
  obras_ativas: 0,
  pendencias_count: 0,
}

// ============================================================
// INFORME DE RENDIMENTOS
// ============================================================

export const PORTAL_INFORMES: PortalInformeRendimentos[] = []


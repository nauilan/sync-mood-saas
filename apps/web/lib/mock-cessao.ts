// lib/mock-cessao.ts
// Mock data — cenário Nauilan (PJ) + contratos variados para popular telas

import type {
  ContratoRow,
  ContratoCessaoDetalhado,
  AssinaturaContrato,
  EventoAuditoria,
  AditivoContrato,
  RecebimentoCessao,
  DireitoCessaoItem,
} from './types-contratos'
import { TODOS_DIREITOS_CESSAO, SPLIT_PADRAO_BR, SPLIT_PADRAO_EXT } from './types-contratos'

// ─── Helper: gera direitos padrão com splits ──────────────────────────────────
function gerarDireitosPadrao(direitos = TODOS_DIREITOS_CESSAO, brOverride?: { pct_titular: number; pct_editora: number }): DireitoCessaoItem[] {
  const br = brOverride ?? SPLIT_PADRAO_BR
  return direitos.map(d => ({
    direito: d,
    ativo: true,
    splits: [
      { territorio: 'BR' as const, pct_titular: br.pct_titular, pct_editora: br.pct_editora },
      { territorio: 'EXT' as const, pct_titular: SPLIT_PADRAO_EXT.pct_titular, pct_editora: SPLIT_PADRAO_EXT.pct_editora },
    ],
  }))
}

// ─── Cessão Detalhada — Nauilan PJ, Total Brasil, 3 obras ─────────────────────
export const CESSAO_NAUILAN: ContratoCessaoDetalhado = {
  id: 'cess-nau-001',
  numero: 'TSM-2025-001',
  modelo_cessao_id: 'mc-total-br',
  tipo_cessao: 'total_brasil',
  titular_id: 'tit-nau',
  titular_nome: 'Nauilan Producoes Musicais Ltda',
  titular_tipo_pessoa: 'PJ',
  titular_cpf_cnpj: '42.891.330/0001-55',
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music Editora Ltda',
  status: 'em_vigor',
  territorio_principal: 'BR',
  exclusividade: true,
  vigencia_inicio: '2025-01-15',
  vigencia_fim: '2028-01-15',
  prazo_indeterminado: false,
  clausula_reversao: true,
  prazo_reversao_anos: 3,
  direitos_cedidos: gerarDireitosPadrao(),
  obras_cessao: [
    {
      id: 'oc-1',
      obra_id: 'obra-0001',
      titulo: 'Amor de Bar',
      codigo: 'OBR-2025-001',
      percentual_autor_obra: 100,
      direitos_cedidos: TODOS_DIREITOS_CESSAO,
      splits: Object.fromEntries(TODOS_DIREITOS_CESSAO.map(d => [d, [
        { territorio: 'BR' as const, pct_titular: 75, pct_editora: 25 },
        { territorio: 'EXT' as const, pct_titular: 50, pct_editora: 50 },
      ]])) as ContratoCessaoDetalhado['obras_cessao'][0]['splits'],
    },
    {
      id: 'oc-2',
      obra_id: 'obra-0002',
      titulo: '3 TAMBORES',
      codigo: 'OBR-2025-002',
      percentual_autor_obra: 100,
      direitos_cedidos: TODOS_DIREITOS_CESSAO,
      splits: Object.fromEntries(TODOS_DIREITOS_CESSAO.map(d => [d, [
        { territorio: 'BR' as const, pct_titular: 75, pct_editora: 25 },
        { territorio: 'EXT' as const, pct_titular: 50, pct_editora: 50 },
      ]])) as ContratoCessaoDetalhado['obras_cessao'][0]['splits'],
    },
    {
      id: 'oc-3',
      obra_id: 'obra-0003',
      titulo: 'Cheiro de Terra Molhada',
      codigo: 'OBR-2025-003',
      percentual_autor_obra: 100,
      direitos_cedidos: TODOS_DIREITOS_CESSAO,
      splits: Object.fromEntries(TODOS_DIREITOS_CESSAO.map(d => [d, [
        { territorio: 'BR' as const, pct_titular: 75, pct_editora: 25 },
        { territorio: 'EXT' as const, pct_titular: 50, pct_editora: 50 },
      ]])) as ContratoCessaoDetalhado['obras_cessao'][0]['splits'],
    },
  ],
  aditivos: [],
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
}

// ─── Cessão Detalhada — Giovani PF, Total Mundo ───────────────────────────────
export const CESSAO_GIOVANI: ContratoCessaoDetalhado = {
  id: 'cess-gio-001',
  numero: 'TSM-2025-012',
  modelo_cessao_id: 'mc-total-mundo',
  tipo_cessao: 'total_mundo',
  titular_id: 'tit-gio',
  titular_nome: 'Giovani Alves Rodrigues',
  titular_tipo_pessoa: 'PF',
  titular_cpf_cnpj: '123.456.789-00',
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music Editora Ltda',
  status: 'em_vigor',
  territorio_principal: 'MUNDIAL',
  exclusividade: true,
  vigencia_inicio: '2025-03-01',
  vigencia_fim: '2030-03-01',
  prazo_indeterminado: false,
  clausula_reversao: true,
  prazo_reversao_anos: 3,
  direitos_cedidos: gerarDireitosPadrao(),
  obras_cessao: [
    {
      id: 'oc-4',
      obra_id: 'obra-0004',
      titulo: 'Passarinho do Norte',
      codigo: 'OBR-2025-004',
      percentual_autor_obra: 60,
      direitos_cedidos: TODOS_DIREITOS_CESSAO,
      splits: Object.fromEntries(TODOS_DIREITOS_CESSAO.map(d => [d, [
        { territorio: 'BR' as const, pct_titular: 75, pct_editora: 25 },
        { territorio: 'EXT' as const, pct_titular: 50, pct_editora: 50 },
      ]])) as ContratoCessaoDetalhado['obras_cessao'][0]['splits'],
    },
    {
      id: 'oc-5',
      obra_id: 'obra-0005',
      titulo: 'Estrada da Vida',
      codigo: 'OBR-2025-005',
      percentual_autor_obra: 50,
      direitos_cedidos: TODOS_DIREITOS_CESSAO,
      splits: Object.fromEntries(TODOS_DIREITOS_CESSAO.map(d => [d, [
        { territorio: 'BR' as const, pct_titular: 75, pct_editora: 25 },
        { territorio: 'EXT' as const, pct_titular: 50, pct_editora: 50 },
      ]])) as ContratoCessaoDetalhado['obras_cessao'][0]['splits'],
    },
  ],
  created_at: '2025-03-01T09:00:00Z',
  updated_at: '2025-03-01T09:00:00Z',
}

// ─── Cessão Parcial Sync — Marcelo PF ─────────────────────────────────────────
export const CESSAO_MARCELO: ContratoCessaoDetalhado = {
  id: 'cess-mar-001',
  numero: 'TSM-2025-032',
  modelo_cessao_id: 'mc-parcial-sync',
  tipo_cessao: 'parcial_sincronizacao',
  titular_id: 'tit-mar',
  titular_nome: 'Marcelo Costa Ferreira',
  titular_tipo_pessoa: 'PF',
  titular_cpf_cnpj: '987.654.321-00',
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music Editora Ltda',
  status: 'aguardando_assinatura',
  territorio_principal: 'MUNDIAL',
  exclusividade: false,
  vigencia_inicio: '2025-05-01',
  vigencia_fim: '2027-05-01',
  prazo_indeterminado: false,
  clausula_reversao: false,
  direitos_cedidos: gerarDireitosPadrao(['sincronizacao_av']),
  obras_cessao: [
    {
      id: 'oc-6',
      obra_id: 'obra-006',
      titulo: 'Tempo de Amar',
      codigo: 'OBR-2025-006',
      percentual_autor_obra: 50,
      direitos_cedidos: ['sincronizacao_av'],
      splits: {
        fonomecanico: [],
        sincronizacao_av: [
          { territorio: 'BR', pct_titular: 75, pct_editora: 25 },
          { territorio: 'EXT', pct_titular: 50, pct_editora: 50 },
        ],
        exec_publica: [],
        digital_streaming: [],
        grafico_partitura: [],
        dramatico: [],
        subedicao_intl: [],
        adaptacoes: [],
      },
    },
    {
      id: 'oc-7',
      obra_id: 'obra-007',
      titulo: 'Luz do Amanhecer',
      codigo: 'OBR-2025-007',
      percentual_autor_obra: 100,
      direitos_cedidos: ['sincronizacao_av'],
      splits: {
        fonomecanico: [],
        sincronizacao_av: [
          { territorio: 'BR', pct_titular: 75, pct_editora: 25 },
          { territorio: 'EXT', pct_titular: 50, pct_editora: 50 },
        ],
        exec_publica: [],
        digital_streaming: [],
        grafico_partitura: [],
        dramatico: [],
        subedicao_intl: [],
        adaptacoes: [],
      },
    },
  ],
  created_at: '2025-05-01T08:00:00Z',
  updated_at: '2025-05-01T08:00:00Z',
}

// ─── Mapa de cessões por contrato ID ────────────────────────────────────────
export const CESSOES_MAP: Record<string, ContratoCessaoDetalhado> = {
  'cess-nau-001': CESSAO_NAUILAN,
  'cess-gio-001': CESSAO_GIOVANI,
  'cess-mar-001': CESSAO_MARCELO,
  // aliases por número de contrato
  'TSM-2025-001': CESSAO_NAUILAN,
  'TSM-2025-012': CESSAO_GIOVANI,
  'TSM-2025-032': CESSAO_MARCELO,
}

// ─── Mock ContratoRow expandido ───────────────────────────────────────────────
export const MOCK_CONTRATOS_CESSAO: ContratoRow[] = []

// ─── Assinaturas ──────────────────────────────────────────────────────────────
export const MOCK_ASSINATURAS_CESSAO: Record<string, AssinaturaContrato[]> = {}

// ─── Auditoria ────────────────────────────────────────────────────────────────
export const MOCK_AUDITORIA_CESSAO: Record<string, EventoAuditoria[]> = {}

// ─── Aditivos ────────────────────────────────────────────────────────────────
export const MOCK_ADITIVOS: Record<string, AditivoContrato[]> = {}

// ─── Recebimentos simulados ───────────────────────────────────────────────────
export const MOCK_RECEBIMENTOS: Record<string, RecebimentoCessao[]> = {}


// ============================================================
// mock-contratos-v2.ts — 6 contratos exemplo M2
// Sync Mood Gestao Inteligente — Dados realistas usando titulares M1
// ============================================================

import type {
  ContratoV2,
  ParteContratoV2,
  DireitoContratoV2,
  ObraContratoV2,
  AssinaturaContratoV2,
  RecoupmentV2,
  AditivoContratoV2,
  HistoricoContratoV2,
  ModeloJuridicoV2,
} from './types-contratos-v2'
import { getDireitosDefault, TODOS_DIREITOS_BR, TODOS_DIREITOS_EXT } from './types-contratos-v2'

// ── Helpers ──────────────────────────────────────────────────────────────────

let _dirIdx = 0
function dirId() { return `dir-${++_dirIdx}` }

function makeDireitos(contratoId: string, tipo: ContratoV2['tipo']): DireitoContratoV2[] {
  return getDireitosDefault(tipo).map(s => ({
    id: dirId(),
    contrato_id: contratoId,
    codigo: s.codigo,
    ativo: s.ativo,
    pct_titular: s.pct_titular,
    pct_editora: s.pct_editora,
  }))
}

// ============================================================
// CONTRATO 1 — Nauilan x Top Show Music — Cessao Parcial
// TSM-2025-001 | em_vigor | exclusividade | PF | BR
// ============================================================
const C1_ID = 'ctr-v2-001'

export const CONTRATO_NAUILAN_CESSAO: ContratoV2 = {
  id: C1_ID,
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music Edicoes Musicais Ltda',
  modelo_juridico_id: 'mj-cessao-parcial',
  numero: 'CTR-00001',
  tipo: 'cessao_parcial',
  status: 'em_vigor',
  vigencia_inicio: '2025-01-15',
  vigencia_fim: '2028-01-15',
  prazo_indeterminado: false,
  renovacao_automatica: true,
  territorio_principal: 'BR',
  exclusividade: true,
  clausula_reversao: true,
  prazo_reversao_anos: 3,
  observacoes: 'Contrato principal de Nauilan com Top Show Music. Inclui clausula de exclusividade autoral.',
  created_at: '2025-01-15T10:00:00Z',
  updated_at: '2025-01-15T10:00:00Z',
  titular_principal: 'Nauilan Barbosa Silva',
  titular_tipo_pessoa: 'PF',
  _obras_count: 3,
  _assinaturas_pendentes: 0,
  _recoupment_aberto: 15000,
  _valor_total: 45000,
  _dias_para_vencer: null,
  _partes: [
    {
      id: 'parte-c1-1',
      contrato_id: C1_ID,
      titular_id: 'tit-pf-1',
      nome_titular: 'Nauilan Barbosa Silva',
      tipo_pessoa: 'PF',
      papel: 'cedente',
      percentual: 75,
      irpf_incide: true,
    },
    {
      id: 'parte-c1-2',
      contrato_id: C1_ID,
      titular_id: 'tit-pj-1',
      nome_titular: 'Top Show Music Edicoes Musicais Ltda',
      tipo_pessoa: 'PJ',
      papel: 'cessionario',
      percentual: 25,
      irpf_incide: false,
    },
  ],
  _direitos: makeDireitos(C1_ID, 'cessao_parcial'),
  _obras: [
    {
      id: 'obra-c1-1',
      contrato_id: C1_ID,
      titulo_obra: 'Amo Noite e Dia',
      codigo_obra: 'TSM-OBR-001',
      iswc: null,
      percentual_autor: 50,
      vigencia_inicio: '2025-01-15',
      vigencia_fim: '2028-01-15',
    },
    {
      id: 'obra-c1-2',
      contrato_id: C1_ID,
      titulo_obra: 'Saudade do Interior',
      codigo_obra: 'TSM-OBR-002',
      iswc: null,
      percentual_autor: 100,
      vigencia_inicio: '2025-01-15',
      vigencia_fim: '2028-01-15',
    },
    {
      id: 'obra-c1-3',
      contrato_id: C1_ID,
      titulo_obra: 'Passarinho do Norte',
      codigo_obra: 'TSM-OBR-003',
      iswc: null,
      percentual_autor: 100,
      vigencia_inicio: '2025-01-15',
      vigencia_fim: '2028-01-15',
    },
  ],
  _assinaturas: [
    {
      id: 'assin-c1-1',
      contrato_id: C1_ID,
      parte_id: 'parte-c1-1',
      nome_parte: 'Nauilan Barbosa Silva',
      tipo_parte: 'cedente',
      provedor: 'd4sign',
      status: 'assinado',
      data_envio: '2025-01-14T10:00:00Z',
      data_assinatura: '2025-01-15T14:30:00Z',
      observacao: null,
    },
    {
      id: 'assin-c1-2',
      contrato_id: C1_ID,
      parte_id: 'parte-c1-2',
      nome_parte: 'Top Show Music Edicoes Musicais Ltda',
      tipo_parte: 'cessionario',
      provedor: 'd4sign',
      status: 'assinado',
      data_envio: '2025-01-14T10:00:00Z',
      data_assinatura: '2025-01-15T16:00:00Z',
      observacao: null,
    },
  ],
  _recoupment: [
    {
      id: 'req-c1-1',
      contrato_id: C1_ID,
      titular_id: 'tit-pf-1',
      nome_titular: 'Nauilan Barbosa Silva',
      descricao: 'Adiantamento de royalties — Jan/2025',
      valor_adiantamento: 30000,
      valor_abatido: 15000,
      saldo_aberto: 15000,
      data_adiantamento: '2025-01-15',
      quitado: false,
      quitado_em: null,
    },
  ],
  _aditivos: [],
  _historico: [
    { id: 'hist-c1-1', contrato_id: C1_ID, tipo_evento: 'criacao', descricao: 'Contrato criado via sistema.', usuario_nome: 'admin@topshowmusic.com', created_at: '2025-01-14T09:00:00Z' },
    { id: 'hist-c1-2', contrato_id: C1_ID, tipo_evento: 'assinatura', descricao: 'Cedente assinou via D4Sign.', usuario_nome: null, created_at: '2025-01-15T14:30:00Z' },
    { id: 'hist-c1-3', contrato_id: C1_ID, tipo_evento: 'assinatura', descricao: 'Cessionaria assinou via D4Sign.', usuario_nome: null, created_at: '2025-01-15T16:00:00Z' },
    { id: 'hist-c1-4', contrato_id: C1_ID, tipo_evento: 'vigencia', descricao: 'Contrato entrou em vigor.', usuario_nome: 'admin@topshowmusic.com', created_at: '2025-01-15T16:01:00Z' },
    { id: 'hist-c1-5', contrato_id: C1_ID, tipo_evento: 'recoupment', descricao: 'Adiantamento de R$ 30.000 registrado.', usuario_nome: 'admin@topshowmusic.com', created_at: '2025-01-16T09:00:00Z' },
  ],
}

// ============================================================
// CONTRATO 2 — Giovani x Edi Music — Administracao Editorial
// EDI-2024-001 | em_vigor | multiplas editoras | PF
// ============================================================
const C2_ID = 'ctr-v2-002'

export const CONTRATO_GIOVANI_ADMIN: ContratoV2 = {
  id: C2_ID,
  editora_id: 'ed-edi',
  editora_nome: 'Edi Music Edicoes Musicais Ltda',
  modelo_juridico_id: 'mj-administracao-editorial',
  numero: 'CTR-00002',
  tipo: 'administracao_editorial',
  status: 'em_vigor',
  vigencia_inicio: '2024-03-01',
  vigencia_fim: '2027-03-01',
  prazo_indeterminado: false,
  renovacao_automatica: false,
  territorio_principal: 'BR',
  exclusividade: false,
  clausula_reversao: false,
  prazo_reversao_anos: null,
  observacoes: 'Edi Music administra obras de Giovani. Top Show Music atua como administradora simultaneamente (link editorial duplo).',
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
  titular_principal: 'Giovani Alves Rodrigues',
  titular_tipo_pessoa: 'PF',
  _obras_count: 2,
  _assinaturas_pendentes: 0,
  _recoupment_aberto: 0,
  _valor_total: 12000,
  _dias_para_vencer: null,
  _partes: [
    { id: 'parte-c2-1', contrato_id: C2_ID, titular_id: 'tit-pf-2', nome_titular: 'Giovani Alves Rodrigues', tipo_pessoa: 'PF', papel: 'cedente', percentual: 85, irpf_incide: true },
    { id: 'parte-c2-2', contrato_id: C2_ID, titular_id: 'tit-pj-1', nome_titular: 'Edi Music Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'administrador', percentual: 10, irpf_incide: false },
    { id: 'parte-c2-3', contrato_id: C2_ID, titular_id: 'ed-tsm' as unknown as string, nome_titular: 'Top Show Music Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'administrador', percentual: 5, irpf_incide: false },
  ],
  _direitos: makeDireitos(C2_ID, 'administracao_editorial'),
  _obras: [
    { id: 'obra-c2-1', contrato_id: C2_ID, titulo_obra: 'Amo Noite e Dia', codigo_obra: 'EDI-OBR-001', iswc: null, percentual_autor: 50, vigencia_inicio: '2024-03-01', vigencia_fim: '2027-03-01' },
    { id: 'obra-c2-2', contrato_id: C2_ID, titulo_obra: 'Tempo de Amar', codigo_obra: 'EDI-OBR-002', iswc: null, percentual_autor: 100, vigencia_inicio: '2024-03-01', vigencia_fim: '2027-03-01' },
  ],
  _assinaturas: [
    { id: 'assin-c2-1', contrato_id: C2_ID, parte_id: 'parte-c2-1', nome_parte: 'Giovani Alves Rodrigues', tipo_parte: 'cedente', provedor: 'docusign', status: 'assinado', data_envio: '2024-02-28T10:00:00Z', data_assinatura: '2024-03-01T11:00:00Z', observacao: null },
    { id: 'assin-c2-2', contrato_id: C2_ID, parte_id: 'parte-c2-2', nome_parte: 'Edi Music Edicoes Musicais Ltda', tipo_parte: 'administrador', provedor: 'docusign', status: 'assinado', data_envio: '2024-02-28T10:00:00Z', data_assinatura: '2024-03-01T12:00:00Z', observacao: null },
  ],
  _recoupment: [],
  _aditivos: [
    { id: 'adt-c2-1', contrato_id: C2_ID, numero_aditivo: 'EDI-2024-001-A1', descricao: 'Adicao de obra "Sol da Manha" ao contrato de administracao.', tipo: 'adicao_obras', status: 'em_vigor', data_criacao: '2024-09-15', data_vigencia: '2024-10-01', assinado_em: '2024-09-20' },
  ],
  _historico: [
    { id: 'hist-c2-1', contrato_id: C2_ID, tipo_evento: 'criacao', descricao: 'Contrato de administracao editorial criado.', usuario_nome: 'admin@edimusic.com', created_at: '2024-02-28T09:00:00Z' },
    { id: 'hist-c2-2', contrato_id: C2_ID, tipo_evento: 'vigencia', descricao: 'Contrato entrou em vigor.', usuario_nome: 'admin@topshowmusic.com', created_at: '2024-03-01T12:01:00Z' },
  ],
}

// ============================================================
// CONTRATO 3 — Marcelo x LR — Co-edicao (vencendo em 85 dias)
// LR-2022-003 | vencendo | co-editoras | PF
// ============================================================
const C3_ID = 'ctr-v2-003'
const hoje = new Date()
const vencimentoCoedicao = new Date(hoje.getTime() + 85 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

export const CONTRATO_MARCELO_COEDICAO: ContratoV2 = {
  id: C3_ID,
  editora_id: 'ed-lr',
  editora_nome: 'LR Edicoes Musicais Ltda',
  modelo_juridico_id: 'mj-coedicao',
  numero: 'CTR-00003',
  tipo: 'coedicao',
  status: 'vencendo',
  vigencia_inicio: '2022-06-01',
  vigencia_fim: vencimentoCoedicao,
  prazo_indeterminado: false,
  renovacao_automatica: false,
  territorio_principal: 'BR',
  exclusividade: false,
  clausula_reversao: true,
  prazo_reversao_anos: 2,
  observacoes: 'Co-edicao entre Marcelo Costa e LR Edicoes. Vencendo em breve — necessita renovacao.',
  created_at: '2022-06-01T10:00:00Z',
  updated_at: '2022-06-01T10:00:00Z',
  titular_principal: 'Marcelo Costa Ferreira',
  titular_tipo_pessoa: 'PF',
  _obras_count: 2,
  _assinaturas_pendentes: 0,
  _recoupment_aberto: 0,
  _valor_total: 8500,
  _dias_para_vencer: 85,
  _partes: [
    { id: 'parte-c3-1', contrato_id: C3_ID, titular_id: 'tit-pf-3', nome_titular: 'Marcelo Costa Ferreira', tipo_pessoa: 'PF', papel: 'cedente', percentual: 50, irpf_incide: true },
    { id: 'parte-c3-2', contrato_id: C3_ID, titular_id: 'tit-pj-2', nome_titular: 'LR Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'co_editora', percentual: 30, irpf_incide: false },
    { id: 'parte-c3-3', contrato_id: C3_ID, titular_id: 'tit-pj-1', nome_titular: 'Edi Music Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'co_editora', percentual: 20, irpf_incide: false },
  ],
  _direitos: makeDireitos(C3_ID, 'coedicao'),
  _obras: [
    { id: 'obra-c3-1', contrato_id: C3_ID, titulo_obra: 'Chuva Fina', codigo_obra: 'LR-OBR-001', iswc: null, percentual_autor: 75, vigencia_inicio: '2022-06-01', vigencia_fim: vencimentoCoedicao },
    { id: 'obra-c3-2', contrato_id: C3_ID, titulo_obra: 'Sol da Tarde', codigo_obra: 'LR-OBR-002', iswc: null, percentual_autor: 50, vigencia_inicio: '2022-06-01', vigencia_fim: vencimentoCoedicao },
  ],
  _assinaturas: [
    { id: 'assin-c3-1', contrato_id: C3_ID, parte_id: 'parte-c3-1', nome_parte: 'Marcelo Costa Ferreira', tipo_parte: 'cedente', provedor: 'manual', status: 'assinado', data_envio: null, data_assinatura: '2022-06-01T10:00:00Z', observacao: 'Assinatura manual digitalizada.' },
    { id: 'assin-c3-2', contrato_id: C3_ID, parte_id: 'parte-c3-2', nome_parte: 'LR Edicoes Musicais Ltda', tipo_parte: 'co_editora', provedor: 'manual', status: 'assinado', data_envio: null, data_assinatura: '2022-06-01T10:00:00Z', observacao: null },
  ],
  _recoupment: [],
  _aditivos: [],
  _historico: [
    { id: 'hist-c3-1', contrato_id: C3_ID, tipo_evento: 'criacao', descricao: 'Contrato de co-edicao criado.', usuario_nome: 'admin@lredicoes.com', created_at: '2022-05-31T09:00:00Z' },
    { id: 'hist-c3-2', contrato_id: C3_ID, tipo_evento: 'alerta', descricao: 'Alerta: contrato vence em menos de 90 dias.', usuario_nome: 'sistema', created_at: new Date().toISOString() },
  ],
}

// ============================================================
// CONTRATO 4 — Joao Pedro x P3 — Cessionario PJ (SEM IRPF)
// P3-2025-002 | aguardando_assinatura | PF->PJ
// ============================================================
const C4_ID = 'ctr-v2-004'

export const CONTRATO_JOAOPEDRO_CESSIONARIOPJ: ContratoV2 = {
  id: C4_ID,
  editora_id: 'ed-p3',
  editora_nome: 'P3 Editora Musical Ltda',
  modelo_juridico_id: 'mj-cessionario-pj',
  numero: 'CTR-00004',
  tipo: 'cessionario_pj',
  status: 'aguardando_assinatura',
  vigencia_inicio: '2025-03-01',
  vigencia_fim: '2030-03-01',
  prazo_indeterminado: false,
  renovacao_automatica: false,
  territorio_principal: 'BR',
  exclusividade: false,
  clausula_reversao: false,
  prazo_reversao_anos: null,
  observacoes: 'JP Lima transfere recebimentos para sua empresa JP Musicas Ltda. NAO incide IRPF. Aguardando assinatura do cessionario.',
  created_at: '2025-02-20T10:00:00Z',
  updated_at: '2025-02-20T10:00:00Z',
  titular_principal: 'Joao Pedro Moraes Lima',
  titular_tipo_pessoa: 'PF',
  _obras_count: 1,
  _assinaturas_pendentes: 1,
  _recoupment_aberto: 0,
  _valor_total: 0,
  _dias_para_vencer: null,
  _partes: [
    { id: 'parte-c4-1', contrato_id: C4_ID, titular_id: 'tit-pf-4', nome_titular: 'Joao Pedro Moraes Lima', tipo_pessoa: 'PF', papel: 'cedente', percentual: 100, irpf_incide: false },
    { id: 'parte-c4-2', contrato_id: C4_ID, titular_id: 'tit-pj-1', nome_titular: 'JP Musicas Ltda (CNPJ: 88.888.888/0001-88)', tipo_pessoa: 'PJ', papel: 'cessionario', percentual: 100, irpf_incide: false },
  ],
  _direitos: makeDireitos(C4_ID, 'cessionario_pj'),
  _obras: [
    { id: 'obra-c4-1', contrato_id: C4_ID, titulo_obra: 'Madrugada em Belo Horizonte', codigo_obra: 'P3-OBR-001', iswc: null, percentual_autor: 100, vigencia_inicio: '2025-03-01', vigencia_fim: '2030-03-01' },
  ],
  _assinaturas: [
    { id: 'assin-c4-1', contrato_id: C4_ID, parte_id: 'parte-c4-1', nome_parte: 'Joao Pedro Moraes Lima', tipo_parte: 'cedente', provedor: 'icp_brasil', status: 'assinado', data_envio: '2025-02-20T10:00:00Z', data_assinatura: '2025-02-22T09:00:00Z', observacao: null },
    { id: 'assin-c4-2', contrato_id: C4_ID, parte_id: 'parte-c4-2', nome_parte: 'JP Musicas Ltda', tipo_parte: 'cessionario', provedor: 'icp_brasil', status: 'pendente', data_envio: '2025-02-22T10:00:00Z', data_assinatura: null, observacao: 'Aguardando representante legal.' },
  ],
  _recoupment: [],
  _aditivos: [],
  _historico: [
    { id: 'hist-c4-1', contrato_id: C4_ID, tipo_evento: 'criacao', descricao: 'Contrato cessionario PJ criado.', usuario_nome: 'admin@p3editora.com', created_at: '2025-02-20T09:00:00Z' },
    { id: 'hist-c4-2', contrato_id: C4_ID, tipo_evento: 'assinatura', descricao: 'Cedente JP Lima assinou via ICP-Brasil.', usuario_nome: null, created_at: '2025-02-22T09:00:00Z' },
  ],
}

// ============================================================
// CONTRATO 5 — Daniel x Lamu — Licenciamento por Periodo
// LAMU-2025-003 | em_vigor | PF | vencimento 2026
// ============================================================
const C5_ID = 'ctr-v2-005'

export const CONTRATO_DANIEL_LICENCIAMENTO: ContratoV2 = {
  id: C5_ID,
  editora_id: 'ed-lamu',
  editora_nome: 'Editora Lamu Edicoes Musicais Ltda',
  modelo_juridico_id: 'mj-licenciamento',
  numero: 'CTR-00005',
  tipo: 'licenciamento',
  status: 'em_vigor',
  vigencia_inicio: '2025-02-01',
  vigencia_fim: '2026-02-01',
  prazo_indeterminado: false,
  renovacao_automatica: true,
  territorio_principal: 'BR',
  exclusividade: false,
  clausula_reversao: false,
  prazo_reversao_anos: null,
  observacoes: 'Licenciamento de versoes para producoes audiovisuais nacionais.',
  created_at: '2025-02-01T10:00:00Z',
  updated_at: '2025-02-01T10:00:00Z',
  titular_principal: 'Daniel Souza Mendes',
  titular_tipo_pessoa: 'PF',
  _obras_count: 2,
  _assinaturas_pendentes: 0,
  _recoupment_aberto: 5000,
  _valor_total: 7200,
  _dias_para_vencer: null,
  _partes: [
    { id: 'parte-c5-1', contrato_id: C5_ID, titular_id: 'tit-pf-5', nome_titular: 'Daniel Souza Mendes', tipo_pessoa: 'PF', papel: 'cedente', percentual: 75, irpf_incide: true },
    { id: 'parte-c5-2', contrato_id: C5_ID, titular_id: 'ed-lamu' as unknown as string, nome_titular: 'Editora Lamu Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'cessionario', percentual: 25, irpf_incide: false },
  ],
  _direitos: makeDireitos(C5_ID, 'licenciamento'),
  _obras: [
    { id: 'obra-c5-1', contrato_id: C5_ID, titulo_obra: 'Versao Latina — Passarinho', codigo_obra: 'LAMU-OBR-001', iswc: null, percentual_autor: 100, vigencia_inicio: '2025-02-01', vigencia_fim: '2026-02-01' },
    { id: 'obra-c5-2', contrato_id: C5_ID, titulo_obra: 'Versao Latina — Sol da Manha', codigo_obra: 'LAMU-OBR-002', iswc: null, percentual_autor: 100, vigencia_inicio: '2025-02-01', vigencia_fim: '2026-02-01' },
  ],
  _assinaturas: [
    { id: 'assin-c5-1', contrato_id: C5_ID, parte_id: 'parte-c5-1', nome_parte: 'Daniel Souza Mendes', tipo_parte: 'cedente', provedor: 'd4sign', status: 'assinado', data_envio: '2025-01-30T10:00:00Z', data_assinatura: '2025-02-01T09:00:00Z', observacao: null },
    { id: 'assin-c5-2', contrato_id: C5_ID, parte_id: 'parte-c5-2', nome_parte: 'Editora Lamu Edicoes Musicais Ltda', tipo_parte: 'cessionario', provedor: 'd4sign', status: 'assinado', data_envio: '2025-01-30T10:00:00Z', data_assinatura: '2025-02-01T10:00:00Z', observacao: null },
  ],
  _recoupment: [
    { id: 'req-c5-1', contrato_id: C5_ID, titular_id: 'tit-pf-5', nome_titular: 'Daniel Souza Mendes', descricao: 'Adiantamento producao audiovisual', valor_adiantamento: 5000, valor_abatido: 0, saldo_aberto: 5000, data_adiantamento: '2025-02-01', quitado: false, quitado_em: null },
  ],
  _aditivos: [],
  _historico: [
    { id: 'hist-c5-1', contrato_id: C5_ID, tipo_evento: 'criacao', descricao: 'Contrato de licenciamento criado.', usuario_nome: 'admin@editoralamu.com', created_at: '2025-01-30T09:00:00Z' },
    { id: 'hist-c5-2', contrato_id: C5_ID, tipo_evento: 'vigencia', descricao: 'Contrato entrou em vigor.', usuario_nome: 'admin@topshowmusic.com', created_at: '2025-02-01T10:01:00Z' },
  ],
}

// ============================================================
// CONTRATO 6 — Pedro Carvalho x Top Show — Cessao Internacional
// TSM-2024-INT-001 | em_vigor | BR+EXT | exclusividade | recoupment aberto
// ============================================================
const C6_ID = 'ctr-v2-006'

export const CONTRATO_PEDRO_CESSAO_INTL: ContratoV2 = {
  id: C6_ID,
  editora_id: 'ed-tsm',
  editora_nome: 'Top Show Music Edicoes Musicais Ltda',
  modelo_juridico_id: 'mj-cessao-internacional',
  numero: 'CTR-00006',
  tipo: 'cessao_internacional',
  status: 'em_vigor',
  vigencia_inicio: '2024-06-01',
  vigencia_fim: '2029-06-01',
  prazo_indeterminado: false,
  renovacao_automatica: false,
  territorio_principal: 'MUNDIAL',
  exclusividade: true,
  clausula_reversao: true,
  prazo_reversao_anos: 5,
  observacoes: 'Cessao internacional para distribuicao em plataformas digitais mundiais. BR 75/25, EXT 50/50.',
  created_at: '2024-06-01T10:00:00Z',
  updated_at: '2024-06-01T10:00:00Z',
  titular_principal: 'Pedro Augusto Carvalho',
  titular_tipo_pessoa: 'PF',
  _obras_count: 4,
  _assinaturas_pendentes: 0,
  _recoupment_aberto: 20000,
  _valor_total: 65000,
  _dias_para_vencer: null,
  _partes: [
    { id: 'parte-c6-1', contrato_id: C6_ID, titular_id: 'tit-pf-6', nome_titular: 'Pedro Augusto Carvalho', tipo_pessoa: 'PF', papel: 'cedente', percentual: 75, irpf_incide: true },
    { id: 'parte-c6-2', contrato_id: C6_ID, titular_id: 'tit-pj-1', nome_titular: 'Top Show Music Edicoes Musicais Ltda', tipo_pessoa: 'PJ', papel: 'cessionario', percentual: 25, irpf_incide: false },
  ],
  _direitos: makeDireitos(C6_ID, 'cessao_internacional'),
  _obras: [
    { id: 'obra-c6-1', contrato_id: C6_ID, titulo_obra: 'Amor de Bar', codigo_obra: 'TSM-OBR-INT-001', iswc: null, percentual_autor: 60, vigencia_inicio: '2024-06-01', vigencia_fim: '2029-06-01' },
    { id: 'obra-c6-2', contrato_id: C6_ID, titulo_obra: 'Noite de Fortaleza', codigo_obra: 'TSM-OBR-INT-002', iswc: null, percentual_autor: 100, vigencia_inicio: '2024-06-01', vigencia_fim: '2029-06-01' },
    { id: 'obra-c6-3', contrato_id: C6_ID, titulo_obra: 'Arranjo Moderno', codigo_obra: 'TSM-OBR-INT-003', iswc: null, percentual_autor: 100, vigencia_inicio: '2024-06-01', vigencia_fim: '2029-06-01' },
    { id: 'obra-c6-4', contrato_id: C6_ID, titulo_obra: 'Instrumental Sul', codigo_obra: 'TSM-OBR-INT-004', iswc: null, percentual_autor: 50, vigencia_inicio: '2024-06-01', vigencia_fim: '2029-06-01' },
  ],
  _assinaturas: [
    { id: 'assin-c6-1', contrato_id: C6_ID, parte_id: 'parte-c6-1', nome_parte: 'Pedro Augusto Carvalho', tipo_parte: 'cedente', provedor: 'icp_brasil', status: 'assinado', data_envio: '2024-05-30T10:00:00Z', data_assinatura: '2024-06-01T10:00:00Z', observacao: null },
    { id: 'assin-c6-2', contrato_id: C6_ID, parte_id: 'parte-c6-2', nome_parte: 'Top Show Music Edicoes Musicais Ltda', tipo_parte: 'cessionario', provedor: 'icp_brasil', status: 'assinado', data_envio: '2024-05-30T10:00:00Z', data_assinatura: '2024-06-01T11:00:00Z', observacao: null },
  ],
  _recoupment: [
    { id: 'req-c6-1', contrato_id: C6_ID, titular_id: 'tit-pf-6', nome_titular: 'Pedro Augusto Carvalho', descricao: 'Adiantamento producao e distribuicao internacional', valor_adiantamento: 50000, valor_abatido: 30000, saldo_aberto: 20000, data_adiantamento: '2024-06-01', quitado: false, quitado_em: null },
  ],
  _aditivos: [
    { id: 'adt-c6-1', contrato_id: C6_ID, numero_aditivo: 'TSM-2024-INT-001-A1', descricao: 'Inclusao de 2 obras instrumentais no contrato internacional.', tipo: 'adicao_obras', status: 'em_vigor', data_criacao: '2024-10-01', data_vigencia: '2024-10-15', assinado_em: '2024-10-10' },
  ],
  _historico: [
    { id: 'hist-c6-1', contrato_id: C6_ID, tipo_evento: 'criacao', descricao: 'Contrato de cessao internacional criado.', usuario_nome: 'admin@topshowmusic.com', created_at: '2024-05-30T09:00:00Z' },
    { id: 'hist-c6-2', contrato_id: C6_ID, tipo_evento: 'vigencia', descricao: 'Contrato entrou em vigor.', usuario_nome: 'admin@topshowmusic.com', created_at: '2024-06-01T11:01:00Z' },
    { id: 'hist-c6-3', contrato_id: C6_ID, tipo_evento: 'aditivo', descricao: 'Aditivo 1 assinado: adicao de obras instrumentais.', usuario_nome: 'admin@topshowmusic.com', created_at: '2024-10-10T10:00:00Z' },
  ],
}

// ============================================================
// LISTA COMPLETA E MAPS
// ============================================================

export const MOCK_CONTRATOS_V2: ContratoV2[] = []

export const CONTRATOS_V2_MAP: Record<string, ContratoV2> = Object.fromEntries(
  MOCK_CONTRATOS_V2.map(c => [c.id, c])
)

// ── KPIs globais ─────────────────────────────────────────────────────────────

export const KPI_CONTRATOS_V2 = {
  total: MOCK_CONTRATOS_V2.length,
  ativos: MOCK_CONTRATOS_V2.filter(c => c.status === 'em_vigor').length,
  vencendo_90d: MOCK_CONTRATOS_V2.filter(c => c.status === 'vencendo').length,
  aguardando_assinatura: MOCK_CONTRATOS_V2.filter(c => c.status === 'aguardando_assinatura').length,
  recoupment_aberto: MOCK_CONTRATOS_V2.filter(c => (c._recoupment_aberto ?? 0) > 0).length,
  valor_total: MOCK_CONTRATOS_V2.reduce((s, c) => s + (c._valor_total ?? 0), 0),
}

// ── Alertas de exclusividade ──────────────────────────────────────────────────

export const ALERTAS_EXCLUSIVIDADE = MOCK_CONTRATOS_V2.filter(
  c => c.exclusividade && c.status === 'vencendo'
)

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getContratoV2ById(id: string): ContratoV2 | undefined {
  return CONTRATOS_V2_MAP[id]
}

export function getContratosByEditora(editoraId: string): ContratoV2[] {
  return MOCK_CONTRATOS_V2.filter(c => c.editora_id === editoraId)
}

export function getContratosByTitular(titularId: string): ContratoV2[] {
  return MOCK_CONTRATOS_V2.filter(c =>
    c._partes?.some(p => p.titular_id === titularId)
  )
}


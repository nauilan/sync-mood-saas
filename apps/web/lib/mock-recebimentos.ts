// ============================================================
// lib/mock-recebimentos.ts — Módulo 6: 10 recebimentos realistas
// Fontes: ECAD/SOCINPRO(2 inf), BackOffice/DSP(3 op), Sync(2 op),
//         Internacional(2 op), Acordo Direto(1 op)
// Sync Mood Gestão Inteligente
// ============================================================

import type {
  Recebimento, RecebimentoDivergencia, RecebimentoLog,
  RecebimentoEcad, RecebimentoBackoffice, RecebimentoSync,
  RecebimentoInternacional, RecebimentoAcordoDireto,
  RecebimentoImportacao, RecebimentoFonte, KpiRecebimentos,
} from './types-recebimentos'

// ─────────────────────────────────────────────────────────────────────────────
// REC-001 — ECAD SOCINPRO Informativo Q1/2025
// ─────────────────────────────────────────────────────────────────────────────

const REC001_ECAD: RecebimentoEcad[] = []

const REC001_LOGS: RecebimentoLog[] = []

export const REC_ECAD_Q1: Recebimento = {
  id: 'rec-001', codigo: 'REC-2025-001',
  fonte: 'ecad_socinpro', categoria: 'informativo',
  periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
  valor_bruto: 5536.80, valor_liquido: 5536.80, moeda: 'BRL',
  cotacao: null, valor_brl: 5536.80, status: 'auditado',
  data_importacao: '2025-04-15T10:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Demonstrativo ECAD Q1-2025. Apenas informativo — ECAD paga titulares diretamente.',
  _ecad: REC001_ECAD, _logs: REC001_LOGS, _divergencias: [
    { id: 'div-001-1', recebimento_id: 'rec-001', tipo: 'obra_nao_encontrada', descricao: 'VEM DANCAR: titulo importado não localizado no catálogo interno.', dados_json: { titulo_importado: 'VEM DANCAR', valor: 420.00 }, status: 'resolvida', resolucao_observacao: 'Mapeado como Vem Dançar (TSM-OBR-005). Dado atualizado.' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-002 — ECAD SOCINPRO Informativo Q2/2025
// ─────────────────────────────────────────────────────────────────────────────

const REC002_ECAD: RecebimentoEcad[] = []

const REC002_LOGS: RecebimentoLog[] = []

export const REC_ECAD_Q2: Recebimento = {
  id: 'rec-002', codigo: 'REC-2025-002',
  fonte: 'ecad_socinpro', categoria: 'informativo',
  periodo_inicio: '2025-04-01', periodo_fim: '2025-06-30',
  valor_bruto: 5012.75, valor_liquido: 5012.75, moeda: 'BRL',
  cotacao: null, valor_brl: 5012.75, status: 'pendente_matching',
  data_importacao: '2025-07-10T09:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Demonstrativo ECAD Q2-2025. Apenas informativo.',
  _ecad: REC002_ECAD, _logs: REC002_LOGS, _divergencias: [],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-003 — BackOffice Music Services — Spotify Q1/2025
// ─────────────────────────────────────────────────────────────────────────────

const REC003_BMS: RecebimentoBackoffice[] = []

const REC003_DIVERG: RecebimentoDivergencia[] = []

const REC003_IMP: RecebimentoImportacao[] = []

const REC003_LOGS: RecebimentoLog[] = []

export const REC_BMS_SPOTIFY: Recebimento = {
  id: 'rec-003', codigo: 'REC-2025-003',
  fonte: 'backoffice_music_services', categoria: 'operacional',
  periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
  valor_bruto: 8621.45, valor_liquido: 6897.16, moeda: 'USD',
  cotacao: 5.12, valor_brl: 35309.46, status: 'em_conciliacao',
  data_importacao: '2025-04-20T11:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'BackOffice Music Services — Spotify Global Q1 2025. Cotação USD: R$ 5,12.',
  _backoffice: REC003_BMS, _divergencias: REC003_DIVERG, _importacoes: REC003_IMP, _logs: REC003_LOGS,
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-004 — BackOffice Music Services — YouTube Q1/2025
// ─────────────────────────────────────────────────────────────────────────────

const REC004_BMS: RecebimentoBackoffice[] = []

export const REC_BMS_YOUTUBE: Recebimento = {
  id: 'rec-004', codigo: 'REC-2025-004',
  fonte: 'backoffice_music_services', categoria: 'operacional',
  periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
  valor_bruto: 1475.30, valor_liquido: 1180.04, moeda: 'USD',
  cotacao: 5.12, valor_brl: 6041.80, status: 'conciliado',
  data_importacao: '2025-04-20T12:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'BackOffice Music Services — YouTube Music Global Q1 2025.',
  _backoffice: REC004_BMS, _divergencias: [], _logs: [
    { id: 'rlog-004-1', recebimento_id: 'rec-004', evento: 'importado',   mensagem: 'Planilha YouTube Music Q1-2025 importada e conciliada.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-20T12:00:00Z' },
    { id: 'rlog-004-2', recebimento_id: 'rec-004', evento: 'conciliado',  mensagem: '2 obras conciliadas com sucesso. Pronto para distribuição.', usuario: 'sistema', timestamp: '2025-04-20T12:05:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-005 — BackOffice Music Services — Deezer Q1/2025
// ─────────────────────────────────────────────────────────────────────────────

const REC005_BMS: RecebimentoBackoffice[] = []

export const REC_BMS_DEEZER: Recebimento = {
  id: 'rec-005', codigo: 'REC-2025-005',
  fonte: 'backoffice_music_services', categoria: 'operacional',
  periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
  valor_bruto: 879.60, valor_liquido: 703.68, moeda: 'USD',
  cotacao: 5.12, valor_brl: 3602.84, status: 'conciliado',
  data_importacao: '2025-04-21T09:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'BackOffice Music Services — Deezer Q1 2025. Mercado France/Global.',
  _backoffice: REC005_BMS, _divergencias: [], _logs: [
    { id: 'rlog-005-1', recebimento_id: 'rec-005', evento: 'importado',  mensagem: 'Planilha Deezer Q1-2025 importada.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-21T09:00:00Z' },
    { id: 'rlog-005-2', recebimento_id: 'rec-005', evento: 'conciliado', mensagem: '2 obras conciliadas.', usuario: 'sistema', timestamp: '2025-04-21T09:04:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-006 — Sync de Autorização AUTH-2025-00003 (Sincronização novela)
// ─────────────────────────────────────────────────────────────────────────────

const REC006_SYNC: RecebimentoSync[] = []

export const REC_SYNC_NOVELA: Recebimento = {
  id: 'rec-006', codigo: 'REC-2025-006',
  fonte: 'sync', categoria: 'operacional',
  periodo_inicio: '2025-02-01', periodo_fim: '2025-02-28',
  valor_bruto: 45000.00, valor_liquido: 42300.00, moeda: 'BRL',
  cotacao: null, valor_brl: 42300.00, status: 'distribuido',
  data_importacao: '2025-03-05T10:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Recebimento Sync: "Amo Noite e Dia" — novela Globo. Auth AUTH-2025-00003. Distribuído em 2025-03-20.',
  _sync: REC006_SYNC, _divergencias: [], _logs: [
    { id: 'rlog-006-1', recebimento_id: 'rec-006', evento: 'importado',  mensagem: 'Recebimento Sync registrado. Referência autorização AUTH-2025-00003.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-03-05T10:00:00Z' },
    { id: 'rlog-006-2', recebimento_id: 'rec-006', evento: 'conciliado', mensagem: 'Conciliado com obra TSM-OBR-001. Percentual controlado: 62,5%.', usuario: 'sistema', timestamp: '2025-03-05T10:02:00Z' },
    { id: 'rlog-006-3', recebimento_id: 'rec-006', evento: 'distribuido', mensagem: 'Distribuição realizada aos titulares dos links controlados.', usuario: 'financeiro@topshowmusic.com.br', timestamp: '2025-03-20T16:00:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-007 — Sync Publicidade (Autorização AUTH-2025-00006)
// ─────────────────────────────────────────────────────────────────────────────

const REC007_SYNC: RecebimentoSync[] = []

export const REC_SYNC_PUBLICIDADE: Recebimento = {
  id: 'rec-007', codigo: 'REC-2025-007',
  fonte: 'sync', categoria: 'operacional',
  periodo_inicio: '2025-04-01', periodo_fim: '2025-04-30',
  valor_bruto: 28000.00, valor_liquido: 26320.00, moeda: 'BRL',
  cotacao: null, valor_brl: 26320.00, status: 'conciliado',
  data_importacao: '2025-04-18T14:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Recebimento Sync: "Coração Partido" — campanha publicitária. Auth AUTH-2025-00006.',
  _sync: REC007_SYNC, _divergencias: [], _logs: [
    { id: 'rlog-007-1', recebimento_id: 'rec-007', evento: 'importado',  mensagem: 'Recebimento Sync publicidade registrado.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-18T14:00:00Z' },
    { id: 'rlog-007-2', recebimento_id: 'rec-007', evento: 'conciliado', mensagem: 'Conciliado. Obra: TSM-OBR-003. Percentual: 50%.', usuario: 'sistema', timestamp: '2025-04-18T14:03:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-008 — Internacional USD (subeditora EUA)
// ─────────────────────────────────────────────────────────────────────────────

const REC008_INTL: RecebimentoInternacional[] = []

export const REC_INTERNACIONAL_USD: Recebimento = {
  id: 'rec-008', codigo: 'REC-2025-008',
  fonte: 'internacional', categoria: 'operacional',
  periodo_inicio: '2024-10-01', periodo_fim: '2024-12-31',
  valor_bruto: 10572.50, valor_liquido: 9515.25, moeda: 'USD',
  cotacao: 5.08, valor_brl: 48334.67, status: 'conciliado',
  data_importacao: '2025-04-05T11:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Royalties internacionais Q4/2024 via UMP North America (BMI). Câmbio USD/BRL: 5,08.',
  _internacionais: REC008_INTL, _divergencias: [], _logs: [
    { id: 'rlog-008-1', recebimento_id: 'rec-008', evento: 'importado',  mensagem: 'Demonstrativo internacional BMI/UMP importado. 2 obras.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-05T11:00:00Z' },
    { id: 'rlog-008-2', recebimento_id: 'rec-008', evento: 'conciliado', mensagem: 'Ambas as obras conciliadas. Cotação USD 5,08 aplicada.', usuario: 'sistema', timestamp: '2025-04-05T11:05:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-009 — Internacional EUR (subeditora Europa)
// ─────────────────────────────────────────────────────────────────────────────

const REC009_INTL: RecebimentoInternacional[] = []

const REC009_DIVERG: RecebimentoDivergencia[] = []

export const REC_INTERNACIONAL_EUR: Recebimento = {
  id: 'rec-009', codigo: 'REC-2025-009',
  fonte: 'internacional', categoria: 'operacional',
  periodo_inicio: '2024-10-01', periodo_fim: '2024-12-31',
  valor_bruto: 6082.00, valor_liquido: 5473.80, moeda: 'EUR',
  cotacao: 5.52, valor_brl: 30205.06, status: 'pendente_matching',
  data_importacao: '2025-04-08T10:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Royalties internacionais Q4/2024 via Warner Chappell France (SACEM). Câmbio EUR/BRL: 5,52.',
  _internacionais: REC009_INTL, _divergencias: REC009_DIVERG, _logs: [
    { id: 'rlog-009-1', recebimento_id: 'rec-009', evento: 'importado', mensagem: 'Demonstrativo SACEM/Warner Chappell importado. 3 linhas.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-08T10:00:00Z' },
    { id: 'rlog-009-2', recebimento_id: 'rec-009', evento: 'divergencia', mensagem: '1 ISWC não localizado. Divergência aberta para revisão manual.', usuario: 'sistema', timestamp: '2025-04-08T10:03:00Z' },
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// REC-010 — Acordo Direto (Plataforma Regional)
// ─────────────────────────────────────────────────────────────────────────────

const REC010_ACORDO: RecebimentoAcordoDireto[] = []

export const REC_ACORDO_DIRETO: Recebimento = {
  id: 'rec-010', codigo: 'REC-2025-010',
  fonte: 'acordo_direto', categoria: 'operacional',
  periodo_inicio: '2025-01-01', periodo_fim: '2025-03-31',
  valor_bruto: 20500.00, valor_liquido: 19475.00, moeda: 'BRL',
  cotacao: null, valor_brl: 19475.00, status: 'conciliado',
  data_importacao: '2025-04-02T09:00:00Z', editora_id: 'ed-tsm',
  observacoes: 'Acordo direto PlayBR Streaming — 2 obras em licenciamento exclusivo Q1/2025.',
  _acordos: REC010_ACORDO, _divergencias: [], _logs: [
    { id: 'rlog-010-1', recebimento_id: 'rec-010', evento: 'importado',  mensagem: 'Acordo direto PlayBR registrado manualmente.', usuario: 'admin@topshowmusic.com.br', timestamp: '2025-04-02T09:00:00Z' },
    { id: 'rlog-010-2', recebimento_id: 'rec-010', evento: 'conciliado', mensagem: '2 obras conciliadas. Pronto para distribuição.', usuario: 'sistema', timestamp: '2025-04-02T09:06:00Z' },
  ],
}

// ── Array geral ───────────────────────────────────────────────────────────────

export const MOCK_RECEBIMENTOS: Recebimento[] = []

// ── KPIs ──────────────────────────────────────────────────────────────────────

export const KPI_RECEBIMENTOS: KpiRecebimentos = {
  total:               0,
  valor_total_brl:     0,
  operacional:         0,
  informativo:         0,
  divergencias_abertas:0,
  conciliados:         0,
}

// ── Fontes da tabela de configuração ─────────────────────────────────────────

export const MOCK_FONTES: RecebimentoFonte[] = [
  { codigo: 'socinpro',      nome: 'SOCINPRO',                    tipo: 'sociedade',     ativo: true },
  { codigo: 'ubc',           nome: 'UBC',                          tipo: 'sociedade',     ativo: true },
  { codigo: 'abramus',       nome: 'ABRAMUS',                      tipo: 'sociedade',     ativo: true },
  { codigo: 'sicam',         nome: 'SICAM',                        tipo: 'sociedade',     ativo: true },
  { codigo: 'amar',          nome: 'AMAR',                         tipo: 'sociedade',     ativo: true },
  { codigo: 'ecad',          nome: 'ECAD',                         tipo: 'sociedade',     ativo: true },
  { codigo: 'backoffice_ms', nome: 'BackOffice Music Services',    tipo: 'dsp',           ativo: true },
  { codigo: 'spotify',       nome: 'Spotify',                      tipo: 'dsp',           ativo: true },
  { codigo: 'youtube',       nome: 'YouTube Music',                tipo: 'dsp',           ativo: true },
  { codigo: 'deezer',        nome: 'Deezer',                       tipo: 'dsp',           ativo: true },
  { codigo: 'apple_music',   nome: 'Apple Music',                  tipo: 'dsp',           ativo: true },
  { codigo: 'amazon',        nome: 'Amazon Music',                 tipo: 'dsp',           ativo: false },
  { codigo: 'tiktok',        nome: 'TikTok',                       tipo: 'dsp',           ativo: true },
  { codigo: 'meta',          nome: 'Meta (Instagram/Facebook)',    tipo: 'dsp',           ativo: true },
]


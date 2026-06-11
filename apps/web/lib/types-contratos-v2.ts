// ============================================================
// types-contratos-v2.ts — Modulo 2 Contratos (Motor Completo)
// Sync Mood Gestao Inteligente
// Spec: 9 tipos, 15 direitos (BR_a-h + EXT_a-g), defaults 75/25 BR e 50/50 EXT
// ============================================================

// ── Tipo de Contrato (12 valores) ────────────────────────────────────────────

export type TipoContratoV2 =
  | 'cessao_parcial'               //  1. Titular cede PARTE dos direitos patrimoniais
  | 'cessao_total'                 //  2. Transfere integralmente (compra de catalogo)
  | 'licenciamento'                //  3. Transfere parcial/integral por PERIODO
  | 'administracao_editorial'      //  4. Administradora opera/exporta/cobra, NAO e proprietaria
  | 'coedicao'                     //  5. Duas editoras dividem controle
  | 'subedicao'                    //  6. Editora representa outra em territorio especifico
  | 'cessao_internacional'         //  7. Separa BR e EXTERIOR
  | 'cessionario_pj'               //  8. Autor transfere recebimentos para PJ propria — SEM IRPF
  | 'cessionario_pf'               //  9. Autor transfere recebimentos para outra PF — COM IRPF
  | 'licenciamento_licenciante_pj' // 10. Licencia por prazo a PJ — SEM IRPF, PRAZO OBRIGATORIO
  | 'licenciamento_licenciante_pf' // 11. Licencia por prazo a PF — COM IRPF, PRAZO OBRIGATORIO
  | 'exclusividade_autor_editora'  // 12. Autor SO pode editar pela editora contratante no periodo

// ── Codigo do Direito (15 valores: BR_a-h + EXT_a-g) ──────────────────────────

export type CodigoDireito =
  // Direitos BR (8 direitos)
  | 'BR_a'   // Reproducao grafica (Edicao)
  | 'BR_b'   // Reproducao fonomecanica
  | 'BR_c'   // Inclusao/adaptacao audiovisual
  | 'BR_d'   // Inclusao/adaptacao publicitaria
  | 'BR_e'   // Distribuicao por meios oticos/cabo/satelite/redes
  | 'BR_f'   // Inclusao em base de dados
  | 'BR_g'   // Comunicacao ao publico
  | 'BR_h'   // Autorizacoes com onus
  // Direitos EXTERIOR (7 direitos — igual a BR sem o item h)
  | 'EXT_a'  // Reproducao grafica (Exterior)
  | 'EXT_b'  // Reproducao fonomecanica (Exterior)
  | 'EXT_c'  // Inclusao/adaptacao audiovisual (Exterior)
  | 'EXT_d'  // Inclusao/adaptacao publicitaria (Exterior)
  | 'EXT_e'  // Distribuicao por meios oticos/cabo/satelite/redes (Exterior)
  | 'EXT_f'  // Inclusao em base de dados (Exterior)
  | 'EXT_g'  // Comunicacao ao publico (Exterior)

// ── Splits de Percentual ─────────────────────────────────────────────────────

export interface SplitDireito {
  codigo: CodigoDireito
  pct_titular: number   // % para o titular/autor
  pct_editora: number   // % para a editora/cessionaria
  ativo: boolean
}

// Defaults FLEXIBILIZAVEIS
export const DEFAULT_SPLITS_BR: Record<string, { pct_titular: number; pct_editora: number }> = {
  BR_a: { pct_titular: 75, pct_editora: 25 },
  BR_b: { pct_titular: 75, pct_editora: 25 },
  BR_c: { pct_titular: 75, pct_editora: 25 },
  BR_d: { pct_titular: 75, pct_editora: 25 },
  BR_e: { pct_titular: 75, pct_editora: 25 },
  BR_f: { pct_titular: 75, pct_editora: 25 },
  BR_g: { pct_titular: 75, pct_editora: 25 },
  BR_h: { pct_titular: 75, pct_editora: 25 },
}

export const DEFAULT_SPLITS_EXT: Record<string, { pct_titular: number; pct_editora: number }> = {
  EXT_a: { pct_titular: 50, pct_editora: 50 },
  EXT_b: { pct_titular: 50, pct_editora: 50 },
  EXT_c: { pct_titular: 50, pct_editora: 50 },
  EXT_d: { pct_titular: 50, pct_editora: 50 },
  EXT_e: { pct_titular: 50, pct_editora: 50 },
  EXT_f: { pct_titular: 50, pct_editora: 50 },
  EXT_g: { pct_titular: 50, pct_editora: 50 },
}

// ── Helper: getDireitosDefault ───────────────────────────────────────────────

export function getDireitosDefault(tipo: TipoContratoV2): SplitDireito[] {
  const direitos: SplitDireito[] = []

  const brCodes: CodigoDireito[] = ['BR_a', 'BR_b', 'BR_c', 'BR_d', 'BR_e', 'BR_f', 'BR_g', 'BR_h']
  const extCodes: CodigoDireito[] = ['EXT_a', 'EXT_b', 'EXT_c', 'EXT_d', 'EXT_e', 'EXT_f', 'EXT_g']

  // Todos os tipos incluem direitos BR por padrao
  for (const cod of brCodes) {
    const split = DEFAULT_SPLITS_BR[cod]
    direitos.push({ codigo: cod, pct_titular: split.pct_titular, pct_editora: split.pct_editora, ativo: true })
  }

  // Tipos que incluem direitos do Exterior
  const incluiExt: TipoContratoV2[] = [
    'cessao_total',
    'cessao_internacional',
    'subedicao',
    'coedicao',
    'licenciamento',
    'licenciamento_licenciante_pj',
    'licenciamento_licenciante_pf',
    'cessionario_pj',
    'cessionario_pf',
  ]

  if (incluiExt.includes(tipo)) {
    for (const cod of extCodes) {
      const split = DEFAULT_SPLITS_EXT[cod]
      direitos.push({ codigo: cod, pct_titular: split.pct_titular, pct_editora: split.pct_editora, ativo: true })
    }
  }

  // Cessionario_pj: autor continua criador, recebedor muda para PJ — sem IRPF
  // Cessionario_pf: recebedor muda para PF — COM IRPF
  // Administracao: editora NAO e proprietaria — pct_editora e apenas comissao
  if (tipo === 'administracao_editorial') {
    return direitos.map(d => ({ ...d, pct_titular: 85, pct_editora: 15 }))
  }

  if (tipo === 'cessionario_pj' || tipo === 'cessionario_pf') {
    return direitos.map(d => ({ ...d, pct_titular: 100, pct_editora: 0 }))
  }

  return direitos
}

// ── Status do Contrato ───────────────────────────────────────────────────────

export type StatusContratoV2 =
  | 'rascunho'
  | 'aguardando_assinatura'
  | 'assinado'
  | 'validado'
  | 'em_vigor'
  | 'suspenso'
  | 'vencendo'          // <= 90 dias para vencer
  | 'vencido'
  | 'rescindido'
  | 'revogado'
  | 'arquivado'
  | 'validado_administrada'
  | 'aguardando_validacao_admin'
  | 'aprovado_admin'
  | 'rejeitado_admin'

// ── Provedor de Assinatura ───────────────────────────────────────────────────

export type ProvedorAssinatura = 'd4sign' | 'docusign' | 'icp_brasil' | 'manual'

// ── Papel da Parte ───────────────────────────────────────────────────────────

// Siglas oficiais:
// CA = Compositor/Autor | AD = Adaptador | AR = Arranjador
// V  = Versionista      | E  = Editora   | SE = Subeditora
// AM = Editora Administradora
export type PapelParte =
  | 'compositor'    // CA — Compositor/Autor
  | 'autor_ca'      // CA — Autor (Compositor/Autor)
  | 'arranjador'    // AR — Arranjador
  | 'versionista'   // V  — Versionista
  | 'adaptador'     // AD — Adaptador
  | 'editora'       // E  — Editora
  | 'subeditora'    // SE — Subeditora
  | 'administradora'// AM — Editora Administradora
  // papéis usados em outros tipos de contrato
  | 'cedente'
  | 'cessionario'
  | 'administrador'
  | 'co_editora'
  | 'testemunha'
  | 'interveniente'

// ── Interfaces principais ────────────────────────────────────────────────────

export interface ParteContratoV2 {
  id: string
  contrato_id: string
  titular_id: string
  nome_titular: string
  tipo_pessoa: 'PF' | 'PJ'
  papel: PapelParte
  percentual: number | null
  irpf_incide: boolean   // true se PF em cessionario_pf
}

export interface DireitoContratoV2 {
  id: string
  contrato_id: string
  codigo: CodigoDireito
  ativo: boolean
  pct_titular: number
  pct_editora: number
}

export interface ObraContratoV2 {
  id: string
  contrato_id: string
  titulo_obra: string
  codigo_obra: string
  iswc: string | null
  percentual_autor: number
  vigencia_inicio: string | null
  vigencia_fim: string | null
  _links?: LinkObraContratoV2[]
}

export interface LinkObraContratoV2 {
  id: string
  contrato_obra_id: string
  editora_original_id: string | null
  administradora_id: string | null
  percentual_editora: number | null
  territorio: string
  _titulares?: LinkTitularV2[]
}

export interface LinkTitularV2 {
  id: string
  link_id: string
  titular_id: string
  nome_titular: string
  percentual: number
  papel: string
  controlado: boolean
}

export interface AssinaturaContratoV2 {
  id: string
  contrato_id: string
  parte_id: string | null
  nome_parte: string
  tipo_parte: PapelParte
  provedor: ProvedorAssinatura
  status: 'pendente' | 'enviado' | 'assinado' | 'recusado' | 'cancelado'
  data_envio: string | null
  data_assinatura: string | null
  observacao: string | null
}

export interface RecoupmentV2 {
  id: string
  contrato_id: string
  titular_id: string
  nome_titular: string
  descricao: string
  valor_adiantamento: number
  valor_abatido: number
  saldo_aberto: number
  data_adiantamento: string
  quitado: boolean
  quitado_em: string | null
}

export interface AditivoContratoV2 {
  id: string
  contrato_id: string
  numero_aditivo: string
  descricao: string
  tipo: 'alteracao_percentual' | 'adicao_obras' | 'alteracao_vigencia' | 'alteracao_territorio' | 'misto'
  status: StatusContratoV2
  data_criacao: string
  data_vigencia: string | null
  assinado_em: string | null
}

export interface HistoricoContratoV2 {
  id: string
  contrato_id: string
  tipo_evento: string
  descricao: string
  usuario_nome: string | null
  created_at: string
}

// ── Payload D4Sign (migration 045) ───────────────────────────────────────────

export interface AssinanteD4Sign {
  papel: string          // 'cedente' | 'responsavel_editora' | 'testemunha_1' | 'testemunha_2'
  nome: string
  cpf?: string
  email?: string
  titular_id?: string | null
}

export interface ObraJson {
  titulo: string
  titulo_alternativo?: string | null
  subtitulo?: string | null
  texto_poetico?: string | null
  pct_autor: number
  papel_autor: string
  co_autores: Array<{
    titular_id?: string | null
    nome: string
    pct: number
    papel: string
  }>
}

export interface ContratoV2 {
  id: string
  editora_id: string
  editora_nome: string
  modelo_juridico_id: string | null
  numero: string
  tipo: TipoContratoV2
  status: StatusContratoV2
  vigencia_inicio: string
  vigencia_fim: string | null
  prazo_indeterminado: boolean
  renovacao_automatica: boolean
  territorio_principal: string
  exclusividade: boolean
  clausula_reversao: boolean
  prazo_reversao_anos: number | null
  observacoes: string | null
  created_at: string
  updated_at: string
  // campos migration 045
  titular_id?: string | null
  assinantes_d4sign?: AssinanteD4Sign[] | null
  obras_json?: ObraJson[] | null
  provedor_assinatura?: string | null
  // campos migration 048 — D4Sign
  d4sign_uuid?: string | null
  d4sign_status?: string | null
  // joins opcionais
  _partes?: ParteContratoV2[]
  _direitos?: DireitoContratoV2[]
  _obras?: ObraContratoV2[]
  _assinaturas?: AssinaturaContratoV2[]
  _recoupment?: RecoupmentV2[]
  _aditivos?: AditivoContratoV2[]
  _historico?: HistoricoContratoV2[]
  // KPIs calculados
  _obras_count?: number
  _assinaturas_pendentes?: number
  _recoupment_aberto?: number
  _valor_total?: number
  // Dados denormalizados para lista
  titular_principal?: string
  titular_tipo_pessoa?: 'PF' | 'PJ'
  titular_pseudonimo?: string | null
  editora_razao_social?: string | null
  _dias_para_vencer?: number | null
}

// ── Modelo Juridico ──────────────────────────────────────────────────────────

export interface ModeloJuridicoV2 {
  id: string
  editora_id: string
  tipo_contrato: TipoContratoV2
  nome: string
  descricao: string | null
  template_texto: string
  ativo: boolean
  contagem_uso: number
  created_at: string
  updated_at: string
}

// ── Labels & Colors ───────────────────────────────────────────────────────────

export const TIPO_CONTRATO_V2_LABELS: Record<TipoContratoV2, string> = {
  cessao_parcial:               'Cessao de Direitos (Parcial)',
  cessao_total:                 'Cessao de Direitos (Total)',
  licenciamento:                'Contrato de Licenciamento',
  administracao_editorial:      'Administracao Editorial',
  coedicao:                     'Coedicao',
  subedicao:                    'Subedicao',
  cessao_internacional:         'Cessao Internacional',
  cessionario_pj:               'Cessao para Cessionario PJ',
  cessionario_pf:               'Cessao para Cessionario PF',
  licenciamento_licenciante_pj: 'Licenciamento — Licenciante PJ',
  licenciamento_licenciante_pf: 'Licenciamento — Licenciante PF',
  exclusividade_autor_editora:  'Exclusividade Autor x Editora',
}

export const TIPO_CONTRATO_V2_COLORS: Record<TipoContratoV2, string> = {
  cessao_parcial:               'bg-violet-500/20 text-violet-300',
  cessao_total:                 'bg-indigo-500/20 text-indigo-300',
  licenciamento:                'bg-amber-500/15 text-amber-400',
  administracao_editorial:      'bg-sky-500/15 text-sky-400',
  coedicao:                     'bg-teal-500/15 text-teal-400',
  subedicao:                    'bg-cyan-500/15 text-cyan-400',
  cessao_internacional:         'bg-emerald-500/15 text-emerald-400',
  cessionario_pj:               'bg-pink-500/15 text-pink-400',
  cessionario_pf:               'bg-orange-500/15 text-orange-400',
  licenciamento_licenciante_pj: 'bg-rose-500/15 text-rose-400',
  licenciamento_licenciante_pf: 'bg-red-500/15 text-red-400',
  exclusividade_autor_editora:  'bg-yellow-500/15 text-yellow-400',
}

export const STATUS_CONTRATO_V2_LABELS: Record<StatusContratoV2, string> = {
  rascunho:                   'Rascunho',
  aguardando_assinatura:      'Ag. Assinatura',
  assinado:                   'Assinado',
  validado:                   'Validado',
  em_vigor:                   'Em Vigor',
  suspenso:                   'Suspenso',
  vencendo:                   'Vencendo',
  vencido:                    'Vencido',
  rescindido:                 'Rescindido',
  revogado:                   'Revogado',
  arquivado:                  'Arquivado',
  validado_administrada:      'Validado (Administrada)',
  aguardando_validacao_admin: 'Aguardando Validação Admin',
  aprovado_admin:             'Aprovado (Admin)',
  rejeitado_admin:            'Rejeitado (Admin)',
}

export const STATUS_CONTRATO_V2_COLORS: Record<StatusContratoV2, string> = {
  rascunho:                   'bg-slate-500/15 text-slate-400',
  aguardando_assinatura:      'bg-amber-500/15 text-amber-400',
  assinado:                   'bg-blue-500/20 text-blue-300 border-blue-500/30',
  validado:                   'bg-teal-500/20 text-teal-300 border-teal-500/30',
  em_vigor:                   'bg-emerald-500/20 text-emerald-300',
  suspenso:                   'bg-orange-500/15 text-orange-400',
  vencendo:                   'bg-yellow-500/15 text-yellow-400',
  vencido:                    'bg-rose-500/15 text-rose-400',
  rescindido:                 'bg-rose-500/20 text-rose-300',
  revogado:                   'bg-slate-600/20 text-slate-400',
  arquivado:                  'bg-slate-700/20 text-slate-500',
  validado_administrada:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  aguardando_validacao_admin: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  aprovado_admin:             'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  rejeitado_admin:            'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

export const CODIGO_DIREITO_LABELS: Record<CodigoDireito, string> = {
  BR_a:   'BR-a) Reproducao grafica (Edicao)',
  BR_b:   'BR-b) Reproducao fonomecanica',
  BR_c:   'BR-c) Inclusao/adaptacao audiovisual',
  BR_d:   'BR-d) Inclusao/adaptacao publicitaria',
  BR_e:   'BR-e) Distribuicao por meios oticos/cabo/satelite/redes',
  BR_f:   'BR-f) Inclusao em base de dados',
  BR_g:   'BR-g) Comunicacao ao publico',
  BR_h:   'BR-h) Autorizacoes com onus',
  EXT_a:  'EXT-a) Reproducao grafica (Exterior)',
  EXT_b:  'EXT-b) Reproducao fonomecanica (Exterior)',
  EXT_c:  'EXT-c) Inclusao/adaptacao audiovisual (Exterior)',
  EXT_d:  'EXT-d) Inclusao/adaptacao publicitaria (Exterior)',
  EXT_e:  'EXT-e) Distribuicao por meios oticos/cabo/satelite/redes (Exterior)',
  EXT_f:  'EXT-f) Inclusao em base de dados (Exterior)',
  EXT_g:  'EXT-g) Comunicacao ao publico (Exterior)',
}

export const CODIGO_DIREITO_SIGLA: Record<CodigoDireito, string> = {
  BR_a: 'BR-a', BR_b: 'BR-b', BR_c: 'BR-c', BR_d: 'BR-d',
  BR_e: 'BR-e', BR_f: 'BR-f', BR_g: 'BR-g', BR_h: 'BR-h',
  EXT_a: 'EXT-a', EXT_b: 'EXT-b', EXT_c: 'EXT-c', EXT_d: 'EXT-d',
  EXT_e: 'EXT-e', EXT_f: 'EXT-f', EXT_g: 'EXT-g',
}

export const TODOS_DIREITOS_BR: CodigoDireito[] = ['BR_a','BR_b','BR_c','BR_d','BR_e','BR_f','BR_g','BR_h']
export const TODOS_DIREITOS_EXT: CodigoDireito[] = ['EXT_a','EXT_b','EXT_c','EXT_d','EXT_e','EXT_f','EXT_g']
export const TODOS_DIREITOS: CodigoDireito[] = [...TODOS_DIREITOS_BR, ...TODOS_DIREITOS_EXT]

export const PAPEL_PARTE_LABELS: Record<PapelParte, string> = {
  // Papéis musicais com siglas oficiais
  compositor:     'Compositor (CA)',
  autor_ca:       'Autor (CA)',
  arranjador:     'Arranjador (AR)',
  versionista:    'Versionista (V)',
  adaptador:      'Adaptador (AD)',
  editora:        'Editora (E)',
  subeditora:     'Subeditora (SE)',
  administradora: 'Editora Administradora (AM)',
  // Papéis complementares (outros tipos de contrato)
  cedente:        'Cedente',
  cessionario:    'Cessionário',
  administrador:  'Administrador',
  co_editora:     'Co-editora',
  testemunha:     'Testemunha',
  interveniente:  'Interveniente',
}

// Siglas de referência rápida (para CWR, distribuição, relatórios)
export const SIGLA_PAPEL: Partial<Record<PapelParte, string>> = {
  compositor:     'CA',
  autor_ca:       'CA',
  arranjador:     'AR',
  versionista:    'V',
  adaptador:      'AD',
  editora:        'E',
  subeditora:     'SE',
  administradora: 'AM',
}

export const PROVEDOR_ASSINATURA_LABELS: Record<ProvedorAssinatura, string> = {
  d4sign:     'D4Sign',
  docusign:   'DocuSign',
  icp_brasil: 'ICP-Brasil',
  manual:     'Manual / Upload',
}

// ── Validacoes criticas ──────────────────────────────────────────────────────

/** cessionario_pj / licenciante_pj NAO incide IRPF */
export function incideIRPF(tipo: TipoContratoV2, tipoPessoa: 'PF' | 'PJ'): boolean {
  if (tipo === 'cessionario_pj' || tipo === 'licenciamento_licenciante_pj') return false
  if (tipo === 'cessionario_pf' || tipo === 'licenciamento_licenciante_pf') return true
  // Regra geral: PF paga IRPF, PJ nao
  return tipoPessoa === 'PF'
}

/** Tipos que exigem data_termino OBRIGATORIO */
export function dataTerminoObrigatorio(tipo: TipoContratoV2): boolean {
  return tipo === 'licenciamento' ||
    tipo === 'licenciamento_licenciante_pj' ||
    tipo === 'licenciamento_licenciante_pf'
}

/** Tipos que tem renovacao automatica disponivel */
export function permiteRenovacaoAutomatica(tipo: TipoContratoV2): boolean {
  return tipo === 'cessao_parcial' ||
    tipo === 'cessao_total' ||
    tipo === 'administracao_editorial' ||
    tipo === 'coedicao' ||
    tipo === 'subedicao' ||
    tipo === 'cessao_internacional' ||
    tipo === 'cessionario_pj' ||
    tipo === 'cessionario_pf' ||
    tipo === 'exclusividade_autor_editora'
}

/** Exclusividade — alerta multiplos niveis: 90d, 30d, 10d + diario */
export function isExclusividade(tipo: TipoContratoV2): boolean {
  return tipo === 'exclusividade_autor_editora'
}

/** coedicao aceita multiplas editoras simultaneas */
export function aceitaMultiplasEditoras(tipo: TipoContratoV2): boolean {
  return tipo === 'coedicao' || tipo === 'administracao_editorial'
}

/** administracao_editorial permite editora_original + administradora simultaneos */
export function permiteAdministradoraSimultanea(tipo: TipoContratoV2): boolean {
  return tipo === 'administracao_editorial' || tipo === 'cessao_internacional'
}

// ============================================================
// lib/types-obras.ts — Modulo 3: Obras e Catalogo (expanded)
// Sync Mood Gestao Inteligente
// ============================================================

// ── Status & enums ────────────────────────────────────────────────────────────

export type StatusObra =
  | 'pre_cadastro'
  | 'validada'
  | 'ativa'
  | 'bloqueada'
  | 'divergente'

// BackOffice status: SONG = passiva (validada, sem uso detectado),
// WORK = ativa (uso detectado, validacoes concluidas)
export type StatusBO = 'SONG' | 'WORK'

export type BackofficeStatus =
  | 'nao_enviada'
  | 'enviada'
  | 'song_passiva'
  | 'work_ativa'
  | 'rejeitada'
  | 'divergente'

export type OrigemImportacao =
  | 'manual'
  | 'cwr'
  | 'swi'
  | 'backoffice'
  | 'migracao_legado'

export type FonteControle =
  | 'contrato'
  | 'cwr'
  | 'editora_administrada'
  | 'manual'
  | 'sistema_antigo'

export type StatusIswc = 'pendente' | 'aguardando_retorno' | 'recebido'
export type OrigemCadastro = 'contrato_sistema' | 'manual' | 'migracao'

export type PapelTitularLink =
  | 'autor'
  | 'compositor'
  | 'versionista'
  | 'adaptador'
  | 'editora_original'
  | 'administradora'
  | 'subeditora'
  | 'interprete_referencia'

// Legacy alias (used in older pages)
export type FuncaoLink = 'CA' | 'V' | 'SA' | 'E' | 'AM' | 'SE' | 'C' | 'CE' | 'A' | 'I' | 'M' | 'T' | 'AD' | 'H'

export type TipoLink =
  | 'controlado'
  | 'parcialmente_controlado'
  | 'direto_sem_editora'
  | 'editora_administrada'
  | 'cessionario'

export type StatusControle =
  | 'controlado'
  | 'nao_controlado'
  | 'contrato_pendente'
  | 'contrato_validado'
  | 'direto_pela_sociedade'
  | 'administrado_por_terceiro'
  | 'bloqueado'

export type StatusExportacao = 'enviado' | 'confirmado' | 'erro' | 'aguardando_retorno'
export type StatusDivergencia = 'aberta' | 'em_analise' | 'resolvida' | 'ignorada'

// ── Core entities ─────────────────────────────────────────────────────────────

export interface Obra {
  id: string
  tenant_id?: string
  codigo: string
  titulo: string
  titulo_original?: string | null
  iswc?: string | null        // NULL pos-sociedade
  idioma: string
  genero?: string | null
  duracao?: number | null     // segundos
  ano_criacao?: number | null
  status: StatusObra
  editora_id?: string | null
  contrato_origem_id?: string | null
  observacoes?: string | null
  created_at: string
  updated_at: string
  // ── Rastreabilidade CWR / Legado / BackOffice ──────────────────
  /** Código interno da obra no sistema antigo. Ex: AFW2 */
  codigo_interno_legado?: string | null
  /** Código da obra conforme veio no CWR importado */
  codigo_obra_cwr_original?: string | null
  /** Código para cruzar com relatórios BackOffice/B-55 */
  codigo_publisher_song?: string | null
  /** ID retornado pela BackOffice quando obra entra como SONG passiva */
  backoffice_song_id?: string | null
  /** ID retornado pela BackOffice quando obra é validada como WORK */
  backoffice_work_id?: string | null
  /** Status da obra na BackOffice */
  backoffice_status?: BackofficeStatus | null
  /** Última sincronização com BackOffice */
  backoffice_last_sync_at?: string | null
  /** Origem da criação desta obra */
  origem_importacao?: OrigemImportacao | null
  // virtual
  _links?: ObraLink[]
  _fonogramas?: Fonograma[]
  _fonogramas_count?: number
  _links_count?: number
  _percentual_controlado?: number  // soma dos links controlados
}

/** Mapeamento de obra com BackOffice — tabela separada para histórico completo */
export interface BackofficeObraStatus {
  id: string
  tenant_id: string
  obra_id: string
  codigo_interno_legado?: string | null
  codigo_obra_sync_mood?: string | null
  codigo_obra_cwr_original?: string | null
  backoffice_song_id?: string | null
  backoffice_work_id?: string | null
  backoffice_status: BackofficeStatus
  statement_song_code?: string | null
  data_envio?: string | null
  data_retorno?: string | null
  mensagem_retorno?: string | null
  erros?: unknown[]
  avisos?: unknown[]
  arquivo_exportacao_id?: string | null
  arquivo_retorno_id?: string | null
  created_at: string
  updated_at: string
}

/**
 * Representa UMA cadeia editorial completa da obra.
 * Todos os participantes dessa cadeia ficam dentro de `titulares`:
 *   autor(es) + editora_original + administradora
 *
 * REGRA: a soma de `percentual` de todos os titulares do link DEVE ser 100%.
 *
 * Exemplo:
 *   HENRIQUE ALVES DOS REIS  (autor)          75%
 *   EDI MUSIC EDITORA LTDA   (editora_orig)   20%
 *   TOP SHOW MUSIC LIMITADA  (administradora)  5%
 *   ─────────────────────────────────────────────
 *                                            100%
 */
export interface ObraLink {
  id: string
  obra_id: string
  ordem: number
  descricao?: string | null
  controlado: boolean               // TRUE = editora administra este link
  percentual_controlado: number     // % que a admin controla nesta cadeia
  titulares?: ObraLinkTitular[]
}

export interface ObraLinkTitular {
  id: string
  link_id: string
  titular_id?: string | null
  nome: string
  papel: PapelTitularLink
  /**
   * Percentual geral (legado / fallback).
   */
  percentual: number
  percentual_exec_publica?: number | null
  percentual_fonomecanico?: number | null
  percentual_sincronizacao?: number | null
  sociedade?: string | null
  cae?: string | null
  ipi?: string | null
  controlado: boolean
  // ── Rastreabilidade CWR: sequências e vínculos PWR ─────────────
  /** Sequência do autor/compositor no SWR (ex: "01", "02") */
  writer_sequence_code?: string | null
  /** Sequência da editora no SPU (ex: "01", "02") */
  publisher_sequence_code?: string | null
  /** Código do autor no registro PWR */
  pwr_writer_code?: string | null
  /** Código da editora no registro PWR */
  pwr_publisher_code?: string | null
  /** Código do vínculo como veio no CWR original */
  codigo_vinculo_cwr_original?: string | null
  /** Código interno legado do titular (ex: HR01) */
  codigo_interno_legado_titular?: string | null
  /** Código interno legado da editora */
  codigo_interno_legado_editora?: string | null
  /** Origem do controle deste vínculo */
  fonte_controle?: FonteControle | null
  /** CPF (PF) ou CNPJ (PJ) do titular */
  cpf_cnpj?: string | null
  /** Tipo de pessoa para formatação de CPF/CNPJ */
  tipo_pessoa?: 'PF' | 'PJ' | null
  /** Pseudônimo (autor) ou nome fantasia (editora) */
  pseudonimo_fantasia?: string | null
  /** País de filiação do titular */
  pais?: string | null
}

export interface Fonograma {
  id: string
  obra_id: string
  isrc?: string | null
  titulo_fonograma: string
  interprete: string
  gravadora_id?: string | null
  produtor?: string | null
  data_lancamento?: string | null
  plataformas_json?: string[]
  duracao?: number | null
}

export interface ObraExportacaoLog {
  id: string
  obra_id: string
  destino: string
  data: string
  status: StatusExportacao
}

export interface ObraDivergencia {
  id: string
  obra_id: string
  tipo: string
  descricao: string
  status: StatusDivergencia
  created_at: string
  updated_at: string
}

// ── Legacy interface (backward compat with older pages) ───────────────────────

export interface ObraLinkLegacy {
  id: string
  tenant_id: string
  obra_id: string
  numero_link: number
  descricao?: string
  percentual_link: number
  tipo_link: TipoLink
  status: 'ativo' | 'inativo'
  titulares?: ObraLinkTitularLegacy[]
}

export interface ObraLinkTitularLegacy {
  id: string
  tenant_id: string
  obra_link_id: string
  obra_id: string
  titular_id?: string
  editora_id?: string
  nome_participante: string
  ipi?: string
  funcao_no_link: FuncaoLink
  percentual_exec_publica: number
  percentual_fonomecanico: number
  percentual_sincronizacao: number
  editora_original_id?: string
  editora_administradora_id?: string
  contrato_id?: string
  status_controle: StatusControle
}

export interface ObraComLinks extends Obra {
  links: ObraLinkLegacy[]
  controle_exec_publica: number
  controle_fonomecanico: number
  controle_sincronizacao: number
  total_participantes: number
}

export interface ObraIntegrante {
  obra_id: string
  numero_link: number
  tipo_link: TipoLink
  percentual_link: number
  nome_participante: string
  ipi?: string
  funcao_no_link: FuncaoLink
  percentual_exec_publica: number
  percentual_fonomecanico: number
  percentual_sincronizacao: number
  status_controle: StatusControle
  pais?: string
}

// ── Labels & helpers ──────────────────────────────────────────────────────────

export const PAPEL_TITULAR_LABELS: Record<PapelTitularLink, string> = {
  autor:                  'Autor',
  compositor:             'Compositor',
  versionista:            'Versionista',
  adaptador:              'Adaptador',
  editora_original:       'Editora Original',
  administradora:         'Administradora',
  subeditora:             'Subeditora',
  interprete_referencia:  'Interprete Ref.',
}

export const PAPEL_TITULAR_COLORS: Record<PapelTitularLink, string> = {
  autor:                  'bg-violet-500/20 text-violet-300',
  compositor:             'bg-violet-500/20 text-violet-300',
  versionista:            'bg-violet-500/15 text-violet-400',
  adaptador:              'bg-slate-500/15 text-slate-400',
  editora_original:       'bg-emerald-500/20 text-emerald-300',
  administradora:         'bg-amber-500/20 text-amber-300',
  subeditora:             'bg-emerald-500/15 text-emerald-400',
  interprete_referencia:  'bg-rose-500/15 text-rose-400',
}

export const FUNCAO_LINK_LABELS: Record<FuncaoLink, string> = {
  CA: 'Compositor Autor',
  V:  'Versionista',
  SA: 'Subautor',
  E:  'Editora Original',
  AM: 'Ed. Administradora',
  SE: 'Subeditora',
  C:  'Cessionario',
  CE: 'Cess. Editorial',
  A:  'Autor',
  I:  'Interprete',
  M:  'Musico Executante',
  T:  'Tradutor',
  AD: 'Arranjador',
  H:  'Herdeiro',
}

export const FUNCAO_LINK_COLORS: Record<FuncaoLink, string> = {
  CA: 'bg-violet-500/20 text-violet-300',
  V:  'bg-violet-500/15 text-violet-400',
  SA: 'bg-violet-500/10 text-violet-500',
  E:  'bg-emerald-500/20 text-emerald-300',
  AM: 'bg-amber-500/20 text-amber-300',
  SE: 'bg-emerald-500/15 text-emerald-400',
  C:  'bg-sky-500/20 text-sky-300',
  CE: 'bg-sky-500/15 text-sky-400',
  A:  'bg-violet-500/20 text-violet-300',
  I:  'bg-rose-500/15 text-rose-400',
  M:  'bg-rose-500/10 text-rose-500',
  T:  'bg-slate-500/15 text-slate-400',
  AD: 'bg-slate-500/10 text-slate-400',
  H:  'bg-orange-500/15 text-orange-400',
}

export const STATUS_OBRA_LABELS: Record<StatusObra, string> = {
  pre_cadastro: 'Pre-cadastro',
  validada:     'Validada',
  ativa:        'Ativa',
  bloqueada:    'Bloqueada',
  divergente:   'Divergente',
}

export const STATUS_OBRA_COLORS: Record<StatusObra, string> = {
  pre_cadastro: 'bg-violet-500/15 text-violet-400',
  validada:     'bg-sky-500/15 text-sky-400',
  ativa:        'bg-emerald-500/20 text-emerald-300',
  bloqueada:    'bg-rose-500/15 text-rose-400',
  divergente:   'bg-amber-500/15 text-amber-400',
}

export const GENEROS_MUSICAIS = [
  'Sertanejo', 'Forro', 'Pagode', 'Samba', 'MPB', 'Pop', 'Rock', 'Gospel',
  'Funk', 'Axe', 'Baiao', 'Bossa Nova', 'Electronic', 'Jazz', 'Blues',
  'Country', 'Reggae', 'Hip-Hop', 'R&B', 'Outro',
]

// ── Validação de link ─────────────────────────────────────────────────────────

/**
 * Valida se a soma dos percentuais dos titulares de um link fecha em 100%.
 * Tolerância: 0.01 (arredondamentos como 33,33 + 33,33 + 33,34).
 */
export function validarSomaTitularesLink(link: ObraLink): {
  valido: boolean
  soma: number
  diferenca: number
} {
  const soma = (link.titulares ?? []).reduce((s, t) => s + t.percentual, 0)
  const diferenca = Math.abs(soma - 100)
  return { valido: diferenca < 0.02, soma: parseFloat(soma.toFixed(4)), diferenca }
}

// ── Normalização de links legados ─────────────────────────────────────────────

const PAPEIS_AUTOR = ['autor', 'compositor', 'versionista', 'adaptador'] as const
const PAPEIS_EDITORA = ['editora_original', 'subeditora'] as const
const PAPEIS_ADMIN  = ['administradora'] as const

type PapelAutor  = typeof PAPEIS_AUTOR[number]
type PapelEditora = typeof PAPEIS_EDITORA[number]
type PapelAdmin  = typeof PAPEIS_ADMIN[number]

/**
 * Normaliza links no formato legado (1 titular por link) para o formato
 * correto: 1 link por cadeia editorial com N titulares, soma = 100%.
 *
 * Regra de agrupamento:
 *   - Todos os autores/compositores da obra
 *   - + todas as editoras originais/subeditoras
 *   - + todos os administradores
 *   → formam UM único ObraLink cujos percentuais somam 100%.
 *
 * Se já existir algum link com mais de 1 titular, assume que o dado já está
 * no formato correto e retorna sem alterar.
 */
export function normalizarLinksObra(links: ObraLink[]): ObraLink[] {
  if (!links || links.length === 0) return links

  // Já normalizado se qualquer link tem >1 titular
  if (links.some(l => (l.titulares?.length ?? 0) > 1)) return links

  const todos = links.flatMap(l => l.titulares ?? [])
  const autores  = todos.filter(t => (PAPEIS_AUTOR  as readonly string[]).includes(t.papel))
  const editoras = todos.filter(t => (PAPEIS_EDITORA as readonly string[]).includes(t.papel))
  const admins   = todos.filter(t => (PAPEIS_ADMIN  as readonly string[]).includes(t.papel))
  const outros   = todos.filter(t =>
    !(PAPEIS_AUTOR  as readonly string[]).includes(t.papel) &&
    !(PAPEIS_EDITORA as readonly string[]).includes(t.papel) &&
    !(PAPEIS_ADMIN  as readonly string[]).includes(t.papel)
  )

  const titulares = [...autores, ...editoras, ...admins, ...outros]
  const somaControlado = titulares
    .filter(t => t.controlado)
    .reduce((s, t) => s + t.percentual, 0)

  const mergedLink: ObraLink = {
    id:                    links[0].id,
    obra_id:               links[0].obra_id,
    ordem:                 1,
    controlado:            links.some(l => l.controlado),
    percentual_controlado: parseFloat(somaControlado.toFixed(4)),
    titulares,
  }

  return [mergedLink]
}

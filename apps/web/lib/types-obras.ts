// lib/types-obras.ts
// Módulo 3 — Cadastro de Obras com Links

export type StatusObra =
  | 'rascunho'
  | 'pre_cadastro'
  | 'pendente_contrato'
  | 'pendente_percentual'
  | 'pendente_validacao'
  | 'validada'
  | 'enviada_sociedade'
  | 'aguardando_retorno'
  | 'ativa'
  | 'bloqueada'
  | 'inativa'

export type StatusIswc = 'pendente' | 'aguardando_retorno' | 'recebido'
export type OrigemCadastro = 'contrato_sistema' | 'manual' | 'migracao'
export type TipoLink =
  | 'controlado'
  | 'parcialmente_controlado'
  | 'direto_sem_editora'
  | 'editora_administrada'
  | 'cessionario'

export type FuncaoLink = 'CA' | 'V' | 'SA' | 'E' | 'AM' | 'SE' | 'C' | 'CE' | 'A' | 'I' | 'M' | 'T' | 'AD' | 'H'

export type StatusControle =
  | 'controlado'
  | 'nao_controlado'
  | 'contrato_pendente'
  | 'contrato_validado'
  | 'direto_pela_sociedade'
  | 'administrado_por_terceiro'
  | 'bloqueado'

export interface Obra {
  id: string
  tenant_id: string
  codigo_obra?: string
  titulo: string
  subtitulo?: string
  titulo_alternativo?: string
  idioma?: string
  letra?: string
  observacoes?: string
  status: StatusObra
  status_iswc: StatusIswc
  iswc?: string
  origem_cadastro: OrigemCadastro
  contrato_origem_id?: string
  created_at: string
  updated_at: string
}

export interface ObraLink {
  id: string
  tenant_id: string
  obra_id: string
  numero_link: number
  descricao?: string
  percentual_link: number
  tipo_link: TipoLink
  status: 'ativo' | 'inativo'
  titulares?: ObraLinkTitular[]
}

export interface ObraLinkTitular {
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
  links: ObraLink[]
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

// Labels & helpers
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
  rascunho:           'Rascunho',
  pre_cadastro:       'Pre-cadastro',
  pendente_contrato:  'Pend. Contrato',
  pendente_percentual:'Pend. Percentual',
  pendente_validacao: 'Pend. Validacao',
  validada:           'Validada',
  enviada_sociedade:  'Enviada Sociedade',
  aguardando_retorno: 'Ag. Retorno',
  ativa:              'Ativa',
  bloqueada:          'Bloqueada',
  inativa:            'Inativa',
}

export const STATUS_OBRA_COLORS: Record<StatusObra, string> = {
  rascunho:           'bg-slate-500/15 text-slate-400',
  pre_cadastro:       'bg-violet-500/15 text-violet-400',
  pendente_contrato:  'bg-amber-500/15 text-amber-400',
  pendente_percentual:'bg-amber-500/15 text-amber-400',
  pendente_validacao: 'bg-amber-500/15 text-amber-400',
  validada:           'bg-sky-500/15 text-sky-400',
  enviada_sociedade:  'bg-sky-500/20 text-sky-300',
  aguardando_retorno: 'bg-sky-500/15 text-sky-400',
  ativa:              'bg-emerald-500/20 text-emerald-300',
  bloqueada:          'bg-rose-500/15 text-rose-400',
  inativa:            'bg-slate-500/10 text-slate-500',
}
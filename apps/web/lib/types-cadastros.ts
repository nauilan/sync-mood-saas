// ============================================================
// types-cadastros.ts — Modulo 1 Cadastros
// Sync Mood Gestao Inteligente
// ============================================================

// ---- Enums ------------------------------------------------

export type TipoPessoa = 'PF' | 'PJ'

export type EscopoPerfil = 'master' | 'administrada' | 'autor' | 'financeiro' | 'juridico' | 'operacional'

export type FuncaoTitular =
  | 'CA'                   // autor/compositor
  | 'V'                    // versionista
  | 'AD'                   // adaptador
  | 'cessionario_pf'       // cessionario PF
  | 'CI'                   // herdeiro
  | 'I'                    // interprete
  | 'E'                    // editora original
  | 'AM'                   // editora administradora
  | 'SE'                   // subeditora
  | 'cessionario_pj'       // cessionario PJ
  | 'gravadora'
  | 'produtora_fono'       // produtora fonografica
  | 'emissora_tv'
  | 'plataforma_digital'
  | 'produtora_audiovisual'
  | 'cliente'
  | 'agencia'

export type TipoContato = 'telefone' | 'whatsapp' | 'email'

export type TipoContaBancariaM1 = 'corrente' | 'poupanca' | 'pagamento' | 'salario'

export type TipoPix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

export type TipoDocumentoM1 = 'rg' | 'cpf' | 'cnpj' | 'passaporte' | 'cnh' | 'contrato_social' | 'outro'

// ---- Funcao labels/siglas ---------------------------------

export const FUNCAO_LABEL: Record<FuncaoTitular, string> = {
  CA: 'Autor / Compositor',
  V: 'Versionista',
  AD: 'Adaptador',
  cessionario_pf: 'Cessionario PF',
  CI: 'Herdeiro',
  I: 'Interprete',
  E: 'Editora Original',
  AM: 'Editora Administradora',
  SE: 'Subeditora',
  cessionario_pj: 'Cessionario PJ',
  gravadora: 'Gravadora',
  produtora_fono: 'Produtora Fonografica',
  emissora_tv: 'Emissora de TV',
  plataforma_digital: 'Plataforma Digital',
  produtora_audiovisual: 'Produtora Audiovisual',
  cliente: 'Cliente',
  agencia: 'Agencia',
}

export const FUNCAO_SIGLA: Record<FuncaoTitular, string> = {
  CA: 'CA', V: 'V', AD: 'AD', cessionario_pf: 'CES-PF', CI: 'CI', I: 'I',
  E: 'E', AM: 'AM', SE: 'SE', cessionario_pj: 'CES-PJ',
  gravadora: 'GR', produtora_fono: 'PF', emissora_tv: 'TV', plataforma_digital: 'PD',
  produtora_audiovisual: 'PA', cliente: 'CLI', agencia: 'AG',
}

// Funcoes exclusivamente PF
export const FUNCOES_PF: FuncaoTitular[] = ['CA', 'V', 'AD', 'cessionario_pf', 'CI', 'I', 'produtora_fono']

// Funcoes exclusivamente PJ
export const FUNCOES_PJ: FuncaoTitular[] = [
  'E', 'AM', 'SE', 'cessionario_pj', 'gravadora', 'produtora_fono',
  'emissora_tv', 'plataforma_digital', 'produtora_audiovisual', 'cliente', 'agencia',
]

// ---- Editoras Administradas -------------------------------

export interface EditoraAdministrada {
  id: string
  codigo: string
  razao_social: string
  nome_fantasia: string
  cnpj: string | null
  logo_url: string | null
  ativa: boolean
  administradora_id: string | null
  created_at: string
  // KPIs calculados (mock / view)
  _titulares?: number
  _obras?: number
  _contratos?: number
  _cwr_ip?: string   // IP number no CWR (para matching com SPU/SPT)
}

// ---- Perfis de Acesso -------------------------------------

export interface PerfilAcesso {
  id: string
  codigo: string
  nome: string
  escopo: EscopoPerfil
  permissoes_json: Record<string, unknown>
}

// ---- Usuario Editora --------------------------------------

export interface UsuarioEditora {
  usuario_id: string
  editora_id: string
  perfil_id: string
}

// ---- Titular (nucleo) -------------------------------------

export interface Titular {
  id: string
  codigo_titular: string    // EDITAVEL
  id_interno: string        // gerado
  tipo_pessoa: TipoPessoa
  editora_id: string
  ativo: boolean
  observacoes: string | null
  created_at: string
  updated_at: string
  // joins opcionais
  _pf?: TitularPessoaFisica
  _pj?: TitularPessoaJuridica
  _funcoes?: TitularFuncao[]
  _pseudonimos?: TitularPseudonimo[]
  _enderecos?: TitularEndereco[]
  _contatos?: TitularContato[]
  _documentos?: TitularDocumento[]
  _dados_bancarios?: TitularDadosBancarios[]
  // KPIs
  _obras?: number
  _contratos?: number
}

// ---- Titular PF -------------------------------------------

export interface TitularPessoaFisica {
  titular_id: string
  nome_completo: string
  cpf: string | null
  rg: string | null
  data_nasc: string | null
  nacionalidade: string | null
  estado_civil: string | null
  profissao: string | null
  nome_artistico_principal: string | null
  sociedade_autoral: string | null
  cae: string | null
  ipi: string | null
}

// ---- Titular PJ -------------------------------------------

export interface TitularPessoaJuridica {
  titular_id: string
  razao_social: string
  nome_fantasia: string | null
  cnpj: string | null
  ie: string | null
  im: string | null
  responsavel_legal: string | null
  sociedade_autoral: string | null
  cae: string | null
  ipi: string | null
  site: string | null
}

// ---- Funcoes -----------------------------------------------

export interface TitularFuncao {
  id: string
  titular_id: string
  funcao: FuncaoTitular
  sigla: string
  ativa: boolean
  created_at: string
}

// ---- Pseudonimos (so PF) -----------------------------------

export interface TitularPseudonimo {
  id: string
  titular_id: string
  pseudonimo: string
  principal: boolean
  ativo: boolean
  data_inicio: string | null
  data_fim: string | null
}

// ---- Enderecos ---------------------------------------------

export interface TitularEndereco {
  id: string
  titular_id: string
  cep: string | null
  endereco: string | null
  numero: string | null
  compl: string | null
  bairro: string | null
  cidade: string | null
  estado: string | null
  pais: string
  principal: boolean
}

// ---- Contatos ----------------------------------------------

export interface TitularContato {
  id: string
  titular_id: string
  tipo: TipoContato
  valor: string
  principal: boolean
}

// ---- Documentos --------------------------------------------

export interface TitularDocumento {
  id: string
  titular_id: string
  tipo: TipoDocumentoM1
  numero: string | null
  url_arquivo: string | null
  validade: string | null
}

// ---- Dados Bancarios ---------------------------------------

export interface TitularDadosBancarios {
  id: string
  titular_id: string
  banco: string
  agencia: string | null
  conta: string | null
  tipo_conta: TipoContaBancariaM1 | null
  titular_conta: string | null
  cpf_cnpj_titular: string | null
  pix_chave: string | null
  pix_tipo: TipoPix | null
  principal: boolean
}

// ---- Tipos compostos para telas ---------------------------

export type TitularComDados = Omit<Titular, '_pf' | '_pj'> & {
  _pf: TitularPessoaFisica | null
  _pj: TitularPessoaJuridica | null
  _funcoes: TitularFuncao[]
  _pseudonimos: TitularPseudonimo[]
  _enderecos: TitularEndereco[]
  _contatos: TitularContato[]
  _documentos: TitularDocumento[]
  _dados_bancarios: TitularDadosBancarios[]
  _editora?: EditoraAdministrada
}

// Helper: nome de exibicao do titular
export function nomeTitular(t: TitularComDados): string {
  if (t.tipo_pessoa === 'PF') {
    return t._pf?.nome_completo ?? t.codigo_titular
  }
  return t._pj?.razao_social ?? t.codigo_titular
}

// Helper: CPF ou CNPJ
export function cpfCnpjTitular(t: TitularComDados): string | null {
  if (t.tipo_pessoa === 'PF') return t._pf?.cpf ?? null
  return t._pj?.cnpj ?? null
}

// Helper: nome artistico / fantasia
export function nomeArtistico(t: TitularComDados): string | null {
  if (t.tipo_pessoa === 'PF') {
    const principal = t._pseudonimos.find(p => p.principal && p.ativo)
    return principal?.pseudonimo ?? t._pf?.nome_artistico_principal ?? null
  }
  return t._pj?.nome_fantasia ?? null
}

// Helper: email principal
export function emailPrincipal(t: TitularComDados): string | null {
  const c = t._contatos.find(x => x.tipo === 'email' && x.principal)
    ?? t._contatos.find(x => x.tipo === 'email')
  return c?.valor ?? null
}

// Helper: verificacao de duplicidade
export interface AlertaDuplicidade {
  campo: string
  valor: string
  titular_id: string
  nome: string
}

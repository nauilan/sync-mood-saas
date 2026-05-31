// ============================================================
// types-config.ts — Módulo 14: Configurações, Usuários, Perfis
// Sync Mood Gestão Inteligente — Onda 7
// ============================================================

export type PerfilCodigo = 'master' | 'administrada' | 'autor' | 'financeiro' | 'juridico' | 'operacional'

export type IntegracaoTipo =
  | 'd4sign' | 'docusign' | 'icp_brasil' | 'socinpro' | 'backoffice_ms'
  | 'whatsapp_api' | 'email_api' | 'pix_api' | 'banco_api'

export type IntegracaoStatus = 'ativa' | 'inativa' | 'erro'

export type Territorio = 'BR' | 'EXT' | 'GLOBAL'

export interface UsuarioSistema {
  id: string
  email: string
  nome: string
  telefone?: string
  ativo: boolean
  ultimo_login?: string
  created_at: string
  _perfis?: UsuarioPerfil[]
}

export interface UsuarioPerfil {
  id: string
  usuario_id: string
  editora_id: string
  editora_nome?: string
  perfil_codigo: PerfilCodigo
  ativo: boolean
  criado_em: string
}

export interface Permissao {
  id: string
  codigo: string
  modulo: string
  descricao: string
  perfil_padrao_codigos: PerfilCodigo[]
}

export interface PerfilPermissao {
  perfil_codigo: PerfilCodigo
  permissao_id: string
  concedida: boolean
  permissao?: Permissao
}

export interface PerfilCompleto {
  codigo: PerfilCodigo
  nome: string
  descricao: string
  cor: string
  icone: string
  permissoes: PerfilPermissao[]
}

export interface ModeloContratoConfig {
  id: string
  codigo: string
  nome: string
  tipo_contrato: string
  conteudo_template: string
  variaveis_json: Record<string, string>
  ativo: boolean
  editora_id: string
  created_at: string
}

export interface ModeloAutorizacaoConfig {
  id: string
  codigo: string
  nome: string
  tipo_autorizacao: string
  template_text: string
  variaveis_json: Record<string, string>
  ativo: boolean
  editora_id: string
  created_at: string
}

export interface ParametroFinanceiro {
  id: string
  chave: string
  valor: string
  descricao: string
  editora_id: string
  updated_at: string
}

export interface TipoDireitoConfig {
  id: string
  codigo: string
  nome: string
  territorio: Territorio
  categoria: string
  ativo: boolean
}

export interface IntegracaoExterna {
  id: string
  nome: string
  tipo: IntegracaoTipo
  status: IntegracaoStatus
  config_json: Record<string, unknown>
  ultimo_teste?: string
  last_error?: string
  editora_id: string
  created_at: string
}

export interface AuditLog {
  id: string
  usuario_id?: string
  usuario_nome?: string
  editora_id: string
  modulo: string
  acao: string
  entidade_tipo: string
  entidade_id?: string
  dados_antes_json?: Record<string, unknown> | null
  dados_depois_json?: Record<string, unknown> | null
  ip?: string
  user_agent?: string
  timestamp: string
}

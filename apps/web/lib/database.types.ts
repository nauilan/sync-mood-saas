// ============================================================
// database.types.ts - Gerado manualmente a partir das 41 migrations
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type PessoaTipo = 'PF' | 'PJ'
export type StatusGeral = 'ativo' | 'inativo'
export type TipoTitular = 'autor' | 'compositor' | 'interprete' | 'produtor' | 'editora' | 'gravadora' | 'cessionario'
export type TipoContaBancaria = 'corrente' | 'poupanca' | 'pagamento'
export type TipoContrato = 'cessao' | 'administracao' | 'coedicao' | 'subedicao' | 'licenciamento' | 'autorizacao'
export type StatusContrato = 'ativo' | 'encerrado' | 'suspenso' | 'em_analise'
export type DireitoTipo = 'execucao_publica' | 'reproducao' | 'sincronizacao' | 'digital' | 'internacional'
export type StatusObra = 'ativa' | 'inativa' | 'em_analise' | 'rascunho' | 'pre_cadastro' | 'pendente_contrato' | 'pendente_percentual' | 'pendente_validacao' | 'validada' | 'enviada_sociedade' | 'aguardando_retorno' | 'bloqueada'
export type VersaoFonograma = 'original' | 'ao_vivo' | 'remix' | 'acustico' | 'outro'
export type FuncaoAutor = 'autor' | 'compositor' | 'versionista' | 'adaptador'
export type RoleUsuario = 'master' | 'editora' | 'compositor' | 'cessionario'
export type PlanoTenant = 'free' | 'starter' | 'pro' | 'enterprise'
export type TipoLink = 'controlado' | 'parcialmente_controlado' | 'direto_sem_editora' | 'editora_administrada' | 'cessionario'
export type FuncaoLink = 'CA' | 'V' | 'SA' | 'E' | 'AM' | 'SE' | 'C' | 'CE' | 'A' | 'I' | 'M' | 'T' | 'AD' | 'H'
export type StatusControle = 'controlado' | 'nao_controlado' | 'contrato_pendente' | 'contrato_validado' | 'direto_pela_sociedade' | 'administrado_por_terceiro' | 'bloqueado'
export type OrigemCadastroObra = 'contrato_sistema' | 'manual' | 'migracao'
export type StatusIswc = 'pendente' | 'aguardando_retorno' | 'recebido'

export interface Tenant { id: string; nome: string; editora_master_id: string | null; plano: PlanoTenant; ativo: boolean; created_at: string; updated_at: string }
export interface Usuario { id: string; tenant_id: string; auth_user_id: string | null; email: string; nome: string; role: RoleUsuario; titular_id: string | null; editora_id: string | null; ativo: boolean; created_at: string; updated_at: string }
export interface Editora { id: string; tenant_id: string; razao_social: string; nome_fantasia: string; cnpj: string; endereco: string; bairro: string; cep: string; cidade: string; estado: string; telefone: string; email: string; site: string | null; codigo_cae: string | null; codigo_ipi: string | null; ipi_socinpro: string | null; sociedade_autoral_vinculada: string | null; logo_url: string | null; dados_bancarios: Json; status: StatusGeral; created_at: string; updated_at: string; deleted_at: string | null }
export interface Titular { id: string; tenant_id: string; tipo: TipoTitular; nome_completo: string; pessoa: PessoaTipo; cpf_cnpj: string; rg: string | null; data_nascimento: string | null; endereco: string | null; bairro: string | null; cep: string | null; cidade: string | null; estado: string | null; telefone: string | null; email: string | null; sociedade_autoral: string | null; codigo_cae: string | null; codigo_ipi: string | null; ipi: string | null; banco: string | null; agencia: string | null; conta: string | null; tipo_conta: TipoContaBancaria | null; pix: string | null; usuario_id: string | null; status: StatusGeral; observacoes: string | null; created_at: string; updated_at: string; deleted_at: string | null }
export interface TitularPseudonimo { id: string; tenant_id: string; titular_id: string; pseudonimo: string; is_principal: boolean; ativo: boolean; created_at: string; updated_at: string }
export interface Contrato { id: string; tenant_id: string; numero: string; tipo: TipoContrato; titular_id: string; editora_id: string; data_inicio: string; data_fim: string | null; prazo_indeterminado: boolean; percentual_editora: number | null; percentual_autor: number | null; territorio: string | null; direitos: DireitoTipo[] | null; arquivo_pdf_url: string | null; arquivo_assinado_url: string | null; status: StatusContrato; observacoes: string | null; created_at: string; updated_at: string; deleted_at: string | null }
export interface Obra { id: string; tenant_id: string; titulo: string; titulo_normalizado: string; subtitulo: string | null; titulo_alternativo: string | null; iswc: string | null; genero_musical: string | null; idioma: string | null; data_criacao: string | null; data_cadastro: string; status: StatusObra; letra: string | null; interprete_referencia: string | null; observacoes: string | null; codigo_obra: string | null; origem_cadastro: OrigemCadastroObra; contrato_origem_id: string | null; status_iswc: StatusIswc; created_at: string; updated_at: string; deleted_at: string | null }
export interface ObrasLink { id: string; tenant_id: string; obra_id: string; numero_link: number; descricao: string | null; percentual_link: number; tipo_link: TipoLink; status: StatusGeral; created_at: string; updated_at: string }
export interface ObrasLinkTitular { id: string; tenant_id: string; obra_link_id: string; obra_id: string; titular_id: string | null; editora_id: string | null; funcao_no_link: FuncaoLink; percentual_exec_publica: number; percentual_fonomecanico: number; percentual_sincronizacao: number; editora_original_id: string | null; editora_administradora_id: string | null; contrato_id: string | null; ipi: string | null; status_controle: StatusControle; created_at: string; updated_at: string }

export interface Database {
  public: {
    Tables: {
      tenants: { Row: Tenant; Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>> }
      usuarios: { Row: Usuario; Insert: Omit<Usuario, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Usuario, 'id' | 'created_at' | 'updated_at'>> }
      editoras: { Row: Editora; Insert: Omit<Editora, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Editora, 'id' | 'created_at' | 'updated_at'>> }
      titulares: { Row: Titular; Insert: Omit<Titular, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Titular, 'id' | 'created_at' | 'updated_at'>> }
      titular_pseudonimos: { Row: TitularPseudonimo; Insert: Omit<TitularPseudonimo, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<TitularPseudonimo, 'id' | 'created_at' | 'updated_at'>> }
      contratos: { Row: Contrato; Insert: Omit<Contrato, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Contrato, 'id' | 'created_at' | 'updated_at'>> }
      obras: { Row: Obra; Insert: Omit<Obra, 'id' | 'titulo_normalizado' | 'data_cadastro' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Obra, 'id' | 'titulo_normalizado' | 'data_cadastro' | 'created_at' | 'updated_at'>> }
      obras_links: { Row: ObrasLink; Insert: Omit<ObrasLink, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ObrasLink, 'id' | 'created_at' | 'updated_at'>> }
      obras_links_titulares: { Row: ObrasLinkTitular; Insert: Omit<ObrasLinkTitular, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<ObrasLinkTitular, 'id' | 'created_at' | 'updated_at'>> }
    }
    Views: {
      v_obra_integrantes: { Row: { obra_id: string; numero_link: number; tipo_link: TipoLink; percentual_link: number; nome_participante: string | null; ipi: string | null; funcao_no_link: FuncaoLink; percentual_exec_publica: number; percentual_fonomecanico: number; percentual_sincronizacao: number; status_controle: StatusControle; editora_original_id: string | null; editora_administradora_id: string | null; tenant_id: string } }
    }
    Functions: {
      fn_controle_editora: { Args: { p_obra_id: string; p_editora_id: string }; Returns: { controle_exec_publica: number; controle_fonomecanico: number; controle_sincronizacao: number }[] }
      fn_validar_percentual_obra: { Args: { p_obra_id: string }; Returns: Json }
    }
    Enums: {
      pessoa_tipo: PessoaTipo; status_geral: StatusGeral; tipo_titular: TipoTitular; tipo_conta_bancaria: TipoContaBancaria; tipo_contrato: TipoContrato; status_contrato: StatusContrato; direito_tipo: DireitoTipo; status_obra: StatusObra; versao_fonograma: VersaoFonograma; funcao_autor: FuncaoAutor; role_usuario: RoleUsuario; plano_tenant: PlanoTenant; tipo_link: TipoLink; funcao_link: FuncaoLink; status_controle: StatusControle; origem_cadastro_obra: OrigemCadastroObra
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type UserRole = 'master' | 'editora' | 'titular'

export interface JWTClaims {
  sub: string
  email: string
  tenant_id: string
  editora_id?: string
  titular_id?: string
  user_role: UserRole
  org_status: 'ativo' | 'suspenso' | 'pendente'
}

export interface Editora {
  id: string
  tenant_id: string
  nome_fantasia: string
  razao_social: string
  cnpj: string
  ipi_socinpro?: string
  ipi_ecad?: string
  ipi_backoffice?: string
  regime_tributario?: string
  created_at: string
}

export interface Titular {
  id: string
  tenant_id: string
  nome: string
  tipo: 'PF' | 'PJ'
  cpf_cnpj?: string
  ipi?: string
  ativo: boolean
  created_at: string
}

export interface Obra {
  id: string
  tenant_id: string
  titulo: string
  titulo_alternativo?: string
  iswc?: string
  status_envio?: string
  created_at: string
}

export interface KPIDashboard {
  total_obras: number
  receita_mes: number
  titulares_ativos: number
  demonstrativos_pendentes: number
  variacao_obras_pct?: number
  variacao_receita_pct?: number
}
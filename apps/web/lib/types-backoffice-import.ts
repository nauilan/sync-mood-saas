// Types para importação de extratos BackOffice (B-55 Royalty Statement Layout)

export type TipoImportacaoBO =
  | 'b55_royalty'      // B-55: extrato de royalties
  | 'b8_songs_auth'    // B-8: songs authorization
  | 'b9_performers'    // B-9: performers
  | 'cwr_lookup'       // CWR lookup tables
  | 'xlsx_generico'    // Excel genérico

export type StatusImportacaoBO =
  | 'aguardando'
  | 'processando'
  | 'concluido'
  | 'erro'
  | 'parcial'

export type StatusMatchingBO =
  | 'identificado'
  | 'possivel'
  | 'nao_identificado'
  | 'validado'
  | 'rejeitado'

export type TipoDireito = 'MEC' | 'PER' | 'SYN' | 'SYNC' | 'OTHER'

export interface ImportacaoBO {
  id: string
  codigo: string
  filename: string
  tipo: TipoImportacaoBO
  status: StatusImportacaoBO
  dsp?: string
  periodo_referencia?: string   // "2025-01" ou "Jan/2025"
  total_linhas: number
  linhas_identificadas: number
  linhas_possivel: number
  linhas_nao_identificadas: number
  valor_total: number
  valor_identificado: number
  valor_pendente: number
  criado_em: string
  processado_em?: string | null
  usuario_upload: string
  notas?: string
}

export interface LinhaRoyaltyBO {
  id: string
  importacao_id: string
  // Campos do layout B-55
  songcode_bo?: string        // código da obra no BO
  iswc?: string
  isrc?: string
  titulo_bo: string
  autores_bo: string
  interprete?: string
  tipo_direito: TipoDireito
  dsp?: string
  territorio?: string
  periodo: string
  unidades: number
  share_pct: number
  royalty_bruto: number
  taxa_admin: number
  royalty_liquido: number
  moeda: string
  // Matching
  status_matching: StatusMatchingBO
  obra_id_match?: string       // ID da obra no sistema se identificada
  obra_titulo_match?: string
  score_matching?: number      // 0-100
  validado_por?: string
  validado_em?: string
  observacao?: string
}

export interface ResumoImportacaoBO {
  total_importacoes: number
  total_valor: number
  total_identificado: number
  total_pendente: number
  total_nao_identificado: number
  por_dsp: Array<{ dsp: string; valor: number; linhas: number }>
  por_tipo_direito: Array<{ tipo: TipoDireito; valor: number; linhas: number }>
  por_status: Array<{ status: StatusMatchingBO; valor: number; linhas: number }>
}

export const STATUS_IMPORTACAO_BO_LABELS: Record<StatusImportacaoBO, string> = {
  aguardando: 'Aguardando',
  processando: 'Processando',
  concluido: 'Concluído',
  erro: 'Erro',
  parcial: 'Parcial',
}

export const STATUS_IMPORTACAO_BO_COLORS: Record<StatusImportacaoBO, string> = {
  aguardando: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  processando: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
  concluido: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  erro: 'text-red-400 border-red-500/30 bg-red-500/10',
  parcial: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
}

export const STATUS_MATCHING_LABELS: Record<StatusMatchingBO, string> = {
  identificado: 'Identificado',
  possivel: 'Possível',
  nao_identificado: 'Não Identificado',
  validado: 'Validado',
  rejeitado: 'Rejeitado',
}

export const STATUS_MATCHING_COLORS: Record<StatusMatchingBO, string> = {
  identificado: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  possivel: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  nao_identificado: 'text-red-400 border-red-500/30 bg-red-500/10',
  validado: 'text-violet-400 border-violet-500/30 bg-violet-500/10',
  rejeitado: 'text-white/30 border-white/10 bg-white/5',
}

export const TIPO_DIREITO_LABELS: Record<TipoDireito, string> = {
  MEC: 'Mecânico',
  PER: 'Performance',
  SYN: 'Sincronia',
  SYNC: 'Sync',
  OTHER: 'Outro',
}

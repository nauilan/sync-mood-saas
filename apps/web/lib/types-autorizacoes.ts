// ============================================================
// lib/types-autorizacoes.ts — Modulo 4: Autorizacoes
// Sync Mood Gestao Inteligente
// ============================================================

// ── Tipos de Autorizacao (7 modalidades) ─────────────────────────────────────
// Fonograma e Videofonograma sao tratados como uma unica modalidade

export type TipoAutorizacao =
  | 'fonograma'
  | 'sincronizacao'
  | 'publicidade'
  | 'tv'
  | 'edicao_grafica'
  | 'incidental'
  | 'versao'

// ── Status ────────────────────────────────────────────────────────────────────

export type StatusAutorizacao =
  | 'rascunho'
  | 'em_analise'
  | 'em_negociacao'
  | 'aprovado'
  | 'emitido'
  | 'enviado'
  | 'assinado'
  | 'faturado'
  | 'pago'
  | 'vencido'
  | 'cancelado'
  | 'bloqueado'

// ── Modelo de Negocio — quem paga ─────────────────────────────────────────────
// Cada modalidade gera um tipo de documento diferente

export type ModeloNegocio =
  | 'pago_editora'    // Pago a Editora  → Contrato de Licenca com Cessao de Direitos
  | 'pago_autor'      // Pago ao Autor   → Contrato Direto com o Autor
  | 'sem_onus'        // Sem Onus        → Declaracao de Autorizacao Gratuita

/** @deprecated use ModeloNegocio — mantido para compatibilidade com dados antigos */
export type TipoNegocioAutorizacao =
  | 'recebido_editora'
  | 'sem_onus'
  | 'recebido_autor'
  | 'outros'
  | ModeloNegocio

// ── Tipos de Uso ──────────────────────────────────────────────────────────────

export type CodigoTipoUso =
  | 'abertura'
  | 'encerramento'
  | 'tema'
  | 'fundo'
  | 'performance'
  | 'trailer'
  | 'teaser'
  | 'chamada'
  | 'vinheta'
  | 'publicidade'
  | 'incidental'
  | 'letra'
  | 'cifra'
  | 'songbook'
  | 'versao_idioma'
  | 'versao_adaptacao'

// ── Exclusividade ─────────────────────────────────────────────────────────────

export interface ExclusividadeRenovacao {
  id: string
  data_renovacao: string
  periodo_meses: number
  data_fim_nova: string
  observacoes?: string
}

// ── Tipo de documento gerado por modalidade ───────────────────────────────────

export type TipoDocumentoAutorizacao =
  | 'minuta'
  | 'contrato_licenca_editora'    // pago_editora
  | 'contrato_direto_autor'       // pago_autor
  | 'declaracao_gratuita'         // sem_onus
  | 'contrato_assinado'
  | 'comprovante_pagamento'
  | 'nota_fiscal'

// ── Core entities ─────────────────────────────────────────────────────────────

export interface TipoUso {
  codigo: CodigoTipoUso
  nome: string
  categoria: TipoAutorizacao
}

export interface AutorizacaoPrecificacao {
  id: string
  tipo_autorizacao: TipoAutorizacao
  tipo_uso?: CodigoTipoUso | null
  emissora?: string | null
  canal?: string | null
  ano?: number | null
  territorio: string
  valor_base: number
  moeda: string
}

export interface AutorizacaoLinkItem {
  id: string
  autorizacao_obra_id: string
  obra_link_id: string
  link_descricao?: string
  link_ordem: number
  percentual_link: number
  percentual_autorizado: number
  valor_link?: number | null
  status: 'incluido' | 'excluido' | 'bloqueado'
}

export interface AutorizacaoObra {
  id: string
  autorizacao_id: string
  obra_id: string
  obra_titulo: string
  obra_codigo: string
  percentual_controlado: number
  percentual_autorizado: number
  tipo_uso?: CodigoTipoUso | null
  tempo_utilizacao?: string | null
  valor?: number | null
  _links?: AutorizacaoLinkItem[]
}

export interface AutorizacaoDocumento {
  id: string
  autorizacao_id: string
  tipo: TipoDocumentoAutorizacao
  url: string
  hash?: string | null
  assinado: boolean
  token_assinatura?: string | null
  data_assinatura?: string | null
  assinado_por?: string | null
  created_at: string
}

// ── Pagamento ─────────────────────────────────────────────────────────────────

export type FormaPagamento =
  | 'dinheiro'
  | 'pix'
  | 'transferencia'
  | 'cartao_credito'
  | 'cartao_debito'

export type CondicaoPagamento =
  | 'a_vista'
  | 'parcelado'

export interface PagamentoConfig {
  forma: FormaPagamento
  condicao: CondicaoPagamento
  parcelas?: number          // 1..48
  entrada?: number           // valor da entrada
  valor_parcela?: number     // calculado: (total - entrada) / parcelas
}

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  dinheiro:      'Dinheiro',
  pix:           'PIX',
  transferencia: 'Transferencia Bancaria',
  cartao_credito:'Cartao de Credito',
  cartao_debito: 'Cartao de Debito',
}

// ── Campos tipo-especificos ───────────────────────────────────────────────────

export interface CamposFonograma {
  produtor_nome?: string
  produtor_cpf_cnpj?: string
  produtor_endereco?: string
  produtor_cidade_uf?: string
  produtor_cep?: string
  produtor_contato?: string
  produtor_email?: string
  distribuidora?: string
  plataformas?: string[]
}

export interface CamposSincronizacao {
  agencia_produtora?: string
  cliente?: string
  razao_social?: string
  cnpj?: string
  endereco?: string
  cidade_uf?: string
  cep?: string
  meio_utilizacao?: string    // Filme / Serie / Novela / Documentario / Programa de TV / Publicidade
  territorio?: string[]
  tipo_sincronizacao?: string // Abertura / Encerramento / Tema / Fundo
  tempo_utilizacao?: string   // minutagem
  previsao_lancamento?: string
  periodo_licenca_dias?: number
  qtd_utilizacoes?: number
  descricao_uso?: string
  exclusividade_segmento?: boolean
  alteracao_letra?: boolean
  remix_adaptacao?: boolean
  participacao_festivais?: boolean
  fonograma_original?: boolean // true=original, false=regravacao
}

export interface CamposPublicidade extends CamposSincronizacao {
  cliente_anunciante?: string
  meio_veiculacao?: string[]  // TV aberta, fechada, internet, radio
  qtd_pecas?: number
  duracao_peca?: string
  data_inicio_campanha?: string
}

export interface CamposTV {
  canal?: string
  tipo_uso_tv?: string        // Abertura, Tema, Fundo, Performance...
  subtipo?: string            // Novelas e series, curta temporada...
  periodo_licenca_dias?: number
  territorio?: string[]
}

export interface CamposEdicaoGrafica {
  licenciante_nome?: string
  licenciante_cpf_cnpj?: string
  licenciante_endereco?: string
  licenciante_cidade_uf?: string
  licenciante_email?: string
  tipos_direito?: string[]    // Letra / Cifra / Partitura / Tablatura / Songbook / Coletanea
  tiragem?: number
  editora_publicadora?: string
}

export interface CamposIncidental {
  produtora?: string
  nome_producao?: string
  tipo_producao?: string[]    // Filme / Serie / Documentario / Programa de TV / Conteudo digital...
  descricao_cena?: string
  tempo_utilizacao?: string
  qtd_utilizacoes?: number
  destaque_percetivel?: boolean
  sincronismo_intencional?: boolean
  territorio?: string[]
  plataformas_exibicao?: string[]
  prazo_utilizacao?: string
}

export interface CamposVersao {
  titulo_original?: string
  autores_originais?: string
  editora_original?: string
  iswc?: string
  pais_origem?: string
  versionista_nome?: string
  versionista_cpf?: string
  versionista_sociedade?: string
  versionista_cae?: string
  novo_titulo?: string
  idioma_versao?: string
  letra_adaptada?: string
  percentual_versionista?: number
  tipo_versao?: 'traducao' | 'adaptacao' | 'versao_parcial' | 'versao_integral'
  exploracoes?: string[]      // Fonograma / Streaming / Shows / TV / Publicidade...
  aprovacao_previa_letra?: boolean
}

// ── Core entity ───────────────────────────────────────────────────────────────

export interface Autorizacao {
  id: string
  tenant_id?: string
  numero_autorizacao: string
  tipo: TipoAutorizacao
  status: StatusAutorizacao
  modelo_negocio: ModeloNegocio
  /** @deprecated use modelo_negocio */
  tipo_negocio?: TipoNegocioAutorizacao
  editora_administrada_id?: string | null
  editora_administrada_nome?: string | null
  solicitante_id?: string | null
  solicitante_nome?: string | null
  licenciado_id?: string | null
  licenciado_nome?: string | null
  data_solicitacao: string
  data_emissao?: string | null
  data_inicio?: string | null
  data_fim?: string | null
  territorio: string
  exclusividade: boolean
  exclusividade_periodo_meses?: number | null
  exclusividade_data_fim?: string | null
  exclusividade_renovacoes?: ExclusividadeRenovacao[]
  valor_total?: number | null
  moeda: string
  pagamento?: PagamentoConfig | null
  observacoes?: string | null
  pdf_url?: string | null
  pdf_assinado_url?: string | null
  token_assinatura?: string | null
  status_assinatura?: 'pendente' | 'enviado' | 'assinado' | null
  created_at: string
  updated_at: string
  // campos tipo-especificos
  campos_fonograma?: CamposFonograma
  campos_sincronizacao?: CamposSincronizacao
  campos_publicidade?: CamposPublicidade
  campos_tv?: CamposTV
  campos_edicao_grafica?: CamposEdicaoGrafica
  campos_incidental?: CamposIncidental
  campos_versao?: CamposVersao
  _obras?: AutorizacaoObra[]
  _documentos?: AutorizacaoDocumento[]
}

// ── Labels & helpers ──────────────────────────────────────────────────────────

export const TIPO_AUTORIZACAO_LABELS: Record<TipoAutorizacao, string> = {
  fonograma:      'Fonograma / Videofonograma',
  sincronizacao:  'Sincronizacao Audiovisual',
  publicidade:    'Publicidade',
  tv:             'Uso em TV',
  edicao_grafica: 'Edicao Grafica',
  incidental:     'Uso Incidental',
  versao:         'Versao',
}

export const TIPO_AUTORIZACAO_DESCRICAO: Record<TipoAutorizacao, string> = {
  fonograma:      'Gravacao fonografica, videofonograma, clipes e distribuicao',
  sincronizacao:  'Series, filmes e obras audiovisuais',
  publicidade:    'Comerciais, campanhas e anuncios',
  tv:             'Veiculacao em emissoras de TV abertas e fechadas',
  edicao_grafica: 'Publicacao de letra, cifra, songbook e partituras',
  incidental:     'Uso incidental em producoes e conteudo',
  versao:         'Versao em outro idioma ou adaptacao da obra',
}

export const TIPO_AUTORIZACAO_COLORS: Record<TipoAutorizacao, string> = {
  fonograma:      'bg-violet-500/20 text-violet-300',
  sincronizacao:  'bg-emerald-500/20 text-emerald-300',
  publicidade:    'bg-amber-500/20 text-amber-300',
  tv:             'bg-rose-500/20 text-rose-300',
  edicao_grafica: 'bg-orange-500/20 text-orange-300',
  incidental:     'bg-slate-500/20 text-slate-300',
  versao:         'bg-teal-500/20 text-teal-300',
}

export const STATUS_AUTORIZACAO_LABELS: Record<StatusAutorizacao, string> = {
  rascunho:       'Rascunho',
  em_analise:     'Em Analise',
  em_negociacao:  'Em Negociacao',
  aprovado:       'Aprovado',
  emitido:        'Emitido',
  enviado:        'Enviado',
  assinado:       'Assinado',
  faturado:       'Faturado',
  pago:           'Pago',
  vencido:        'Vencido',
  cancelado:      'Cancelado',
  bloqueado:      'Bloqueado',
}

export const STATUS_AUTORIZACAO_COLORS: Record<StatusAutorizacao, string> = {
  rascunho:       'bg-slate-500/20 text-slate-400',
  em_analise:     'bg-sky-500/15 text-sky-400',
  em_negociacao:  'bg-amber-500/15 text-amber-400',
  aprovado:       'bg-sky-500/20 text-sky-300',
  emitido:        'bg-violet-500/20 text-violet-300',
  enviado:        'bg-violet-500/15 text-violet-400',
  assinado:       'bg-emerald-500/15 text-emerald-400',
  faturado:       'bg-emerald-500/20 text-emerald-300',
  pago:           'bg-emerald-600/30 text-emerald-200',
  vencido:        'bg-orange-500/15 text-orange-400',
  cancelado:      'bg-rose-500/15 text-rose-400',
  bloqueado:      'bg-rose-600/20 text-rose-300',
}

export const MODELO_NEGOCIO_LABELS: Record<ModeloNegocio, string> = {
  pago_editora: 'Pago a Editora',
  pago_autor:   'Pago ao Autor',
  sem_onus:     'Sem Onus',
}

export const MODELO_NEGOCIO_DESCRICAO: Record<ModeloNegocio, string> = {
  pago_editora: 'O licenciado paga a editora pelos direitos de uso',
  pago_autor:   'O licenciado paga diretamente ao autor/titular',
  sem_onus:     'Autorizacao gratuita, sem custo ao licenciado',
}

export const MODELO_NEGOCIO_DOCUMENTO: Record<ModeloNegocio, TipoDocumentoAutorizacao> = {
  pago_editora: 'contrato_licenca_editora',
  pago_autor:   'contrato_direto_autor',
  sem_onus:     'declaracao_gratuita',
}

export const MODELO_NEGOCIO_DOCUMENTO_NOME: Record<ModeloNegocio, string> = {
  pago_editora: 'Contrato de Licenca com Cessao de Direitos',
  pago_autor:   'Contrato Direto com o Autor/Titular',
  sem_onus:     'Declaracao de Autorizacao Gratuita',
}

export const MODELO_NEGOCIO_COLORS: Record<ModeloNegocio, string> = {
  pago_editora: 'bg-emerald-500/15 text-emerald-300',
  pago_autor:   'bg-sky-500/15 text-sky-300',
  sem_onus:     'bg-slate-500/15 text-slate-300',
}

/** @deprecated use MODELO_NEGOCIO_LABELS */
export const TIPO_NEGOCIO_LABELS: Record<string, string> = {
  recebido_editora: 'Recebido pela Editora',
  sem_onus:         'Sem Onus',
  recebido_autor:   'Recebido pelo Autor',
  outros:           'Outros',
  pago_editora:     'Pago a Editora',
  pago_autor:       'Pago ao Autor',
}

export const TIPO_USO_LABELS: Record<CodigoTipoUso, string> = {
  abertura:          'Abertura',
  encerramento:      'Encerramento',
  tema:              'Tema',
  fundo:             'Fundo Musical',
  performance:       'Performance',
  trailer:           'Trailer',
  teaser:            'Teaser',
  chamada:           'Chamada',
  vinheta:           'Vinheta',
  publicidade:       'Publicidade',
  incidental:        'Incidental',
  letra:             'Letra / Lirica',
  cifra:             'Cifra',
  songbook:          'Songbook / Partitura',
  versao_idioma:     'Versao em outro idioma',
  versao_adaptacao:  'Versao / Adaptacao',
}

export const TODOS_TIPOS_USO: TipoUso[] = [
  { codigo: 'abertura',         nome: 'Abertura',               categoria: 'sincronizacao' },
  { codigo: 'encerramento',     nome: 'Encerramento',           categoria: 'sincronizacao' },
  { codigo: 'tema',             nome: 'Tema',                   categoria: 'sincronizacao' },
  { codigo: 'fundo',            nome: 'Fundo Musical',          categoria: 'sincronizacao' },
  { codigo: 'performance',      nome: 'Performance',            categoria: 'sincronizacao' },
  { codigo: 'trailer',          nome: 'Trailer',                categoria: 'sincronizacao' },
  { codigo: 'teaser',           nome: 'Teaser',                 categoria: 'sincronizacao' },
  { codigo: 'chamada',          nome: 'Chamada',                categoria: 'tv' },
  { codigo: 'vinheta',          nome: 'Vinheta',                categoria: 'tv' },
  { codigo: 'publicidade',      nome: 'Publicidade',            categoria: 'publicidade' },
  { codigo: 'incidental',       nome: 'Incidental',             categoria: 'incidental' },
  { codigo: 'letra',            nome: 'Letra / Lirica',         categoria: 'edicao_grafica' },
  { codigo: 'cifra',            nome: 'Cifra',                  categoria: 'edicao_grafica' },
  { codigo: 'songbook',         nome: 'Songbook / Partitura',   categoria: 'edicao_grafica' },
  { codigo: 'versao_idioma',    nome: 'Versao em outro idioma', categoria: 'versao' },
  { codigo: 'versao_adaptacao', nome: 'Versao / Adaptacao',     categoria: 'versao' },
]

export const TIPOS_USO_POR_TIPO_AUTORIZACAO: Record<TipoAutorizacao, CodigoTipoUso[]> = {
  fonograma:      [],
  sincronizacao:  ['abertura','encerramento','tema','fundo','performance','trailer','teaser'],
  publicidade:    ['publicidade'],
  tv:             ['abertura','encerramento','tema','fundo','chamada','vinheta'],
  edicao_grafica: ['letra','cifra','songbook'],
  incidental:     ['incidental','fundo','vinheta'],
  versao:         ['versao_idioma','versao_adaptacao'],
}

export const TERRITORIOS = [
  { codigo: 'BR',      nome: 'Brasil' },
  { codigo: 'LA',      nome: 'America Latina' },
  { codigo: 'MUNDIAL', nome: 'Mundial' },
  { codigo: 'US',      nome: 'Estados Unidos' },
  { codigo: 'EU',      nome: 'Europa' },
  { codigo: 'PT',      nome: 'Portugal' },
]

// ── Helpers de exclusividade ──────────────────────────────────────────────────

/** Dias restantes de exclusividade (negativo = vencida) */
export function diasRestantesExclusividade(dataFim: string): number {
  const fim = new Date(dataFim)
  const hoje = new Date()
  return Math.floor((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
}

/** true se dentro do periodo de alerta (30 dias) */
export function exclusividadeEmAlerta(dataFim: string, diasAlerta = 30): boolean {
  const dias = diasRestantesExclusividade(dataFim)
  return dias >= 0 && dias <= diasAlerta
}

/** true se exclusividade ainda vigente */
export function exclusividadeVigente(dataFim: string): boolean {
  return diasRestantesExclusividade(dataFim) > 0
}

/** Verifica se uma obra tem exclusividade vigente — bloqueia novas autorizacoes */
export function obraBloqueadaPorExclusividade(
  obraId: string,
  autorizacoes: Autorizacao[]
): { bloqueada: boolean; autorizacao?: Autorizacao; diasRestantes?: number } {
  const exclusivas = autorizacoes.filter(a =>
    a.exclusividade &&
    a.exclusividade_data_fim &&
    a._obras?.some(o => o.obra_id === obraId) &&
    exclusividadeVigente(a.exclusividade_data_fim) &&
    !['cancelado', 'bloqueado'].includes(a.status)
  )
  if (exclusivas.length === 0) return { bloqueada: false }
  const aut = exclusivas[0]
  return {
    bloqueada: true,
    autorizacao: aut,
    diasRestantes: diasRestantesExclusividade(aut.exclusividade_data_fim!),
  }
}

// ── Mock precificacao ─────────────────────────────────────────────────────────

export const MOCK_PRECIFICACAO: AutorizacaoPrecificacao[] = [
  { id: 'prec-001', tipo_autorizacao: 'sincronizacao',  tipo_uso: 'tema',           emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 85000,  moeda: 'BRL' },
  { id: 'prec-002', tipo_autorizacao: 'sincronizacao',  tipo_uso: 'abertura',       emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 55000,  moeda: 'BRL' },
  { id: 'prec-003', tipo_autorizacao: 'sincronizacao',  tipo_uso: 'encerramento',   emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 45000,  moeda: 'BRL' },
  { id: 'prec-004', tipo_autorizacao: 'sincronizacao',  tipo_uso: 'fundo',          emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 25000,  moeda: 'BRL' },
  { id: 'prec-005', tipo_autorizacao: 'tv',             tipo_uso: 'vinheta',        emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 8500,   moeda: 'BRL' },
  { id: 'prec-006', tipo_autorizacao: 'tv',             tipo_uso: 'chamada',        emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 6000,   moeda: 'BRL' },
  { id: 'prec-007', tipo_autorizacao: 'publicidade',    tipo_uso: 'publicidade',    emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 120000, moeda: 'BRL' },
  { id: 'prec-008', tipo_autorizacao: 'publicidade',    tipo_uso: 'publicidade',    emissora: 'Globo',     canal: 'Streaming',  ano: 2026, territorio: 'BR', valor_base: 65000,  moeda: 'BRL' },
  { id: 'prec-009', tipo_autorizacao: 'fonograma',      tipo_uso: null,             emissora: null,        canal: null,         ano: 2026, territorio: 'BR', valor_base: 5000,   moeda: 'BRL' },
  { id: 'prec-010', tipo_autorizacao: 'fonograma',      tipo_uso: null,             emissora: null,        canal: null,         ano: 2026, territorio: 'BR', valor_base: 8000,   moeda: 'BRL' },
  { id: 'prec-011', tipo_autorizacao: 'incidental',     tipo_uso: 'incidental',     emissora: 'Globo',     canal: 'TV Aberta',  ano: 2026, territorio: 'BR', valor_base: 3500,   moeda: 'BRL' },
  { id: 'prec-012', tipo_autorizacao: 'edicao_grafica', tipo_uso: 'songbook',       emissora: null,        canal: null,         ano: 2026, territorio: 'BR', valor_base: 2000,   moeda: 'BRL' },
  { id: 'prec-013', tipo_autorizacao: 'versao',         tipo_uso: 'versao_idioma',  emissora: null,        canal: null,         ano: 2026, territorio: 'BR', valor_base: 15000,  moeda: 'BRL' },
]
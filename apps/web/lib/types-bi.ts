// ============================================================
// types-bi.ts — Módulo 12/13: BI e Relatórios
// Sync Mood Gestão Inteligente — Onda 7
// ============================================================

export type CategoriaRelatorio =
  | 'obras'
  | 'obras_gravadas'
  | 'titulares'
  | 'contratos'
  | 'autorizacoes'
  | 'recebimentos'
  | 'cc_obra'
  | 'cc_titular'
  | 'financeiro'
  | 'royalties_futuros'
  | 'bi_estrategico'
  | 'auditoria'

export type FormatoExport = 'pdf' | 'excel' | 'csv'

export interface RelatorioFiltros {
  periodo_inicio?: string
  periodo_fim?: string
  obra_id?: string
  titular_id?: string
  editora_id?: string
  fonte?: string
  sociedade?: string
  status?: string
  tipo_direito?: string
  territorio?: string
  moeda?: string
  usuario_responsavel?: string
}

export interface RelatorioCategoria {
  id: CategoriaRelatorio
  titulo: string
  subtitulo: string
  icone: string
  cor: string
  contagem: number
  href: string
  sub_relatorios: SubRelatorio[]
}

export interface SubRelatorio {
  id: string
  titulo: string
  descricao: string
  href: string
}

// ── Obras ──
export interface BiObras {
  total_cadastradas: number
  total_ativas: number
  total_pendentes: number
  total_bloqueadas: number
  total_sem_iswc: number
  total_sem_contrato: number
  por_editora: { editora: string; count: number }[]
  por_autor: { autor: string; count: number }[]
  por_percentual: { faixa: string; count: number }[]
  por_sociedade: { sociedade: string; count: number }[]
  com_divergencia: number
}

// ── Obras Gravadas ──
export interface BiObrasGravadas {
  total_fonogramas: number
  total_com_isrc: number
  total_sem_isrc: number
  total_interpretes: number
  total_gravadoras: number
  total_distribuidoras: number
  total_sem_autorizacao: number
  total_sem_vinculo: number
  por_artista: { artista: string; count: number }[]
  por_gravadora: { gravadora: string; count: number }[]
}

// ── Titulares ──
export interface BiTitulares {
  total: number
  total_autores: number
  total_editoras: number
  total_cessionarios: number
  total_ativos: number
  total_pendentes: number
  total_sem_banco: number
  total_sem_cpf_cnpj: number
  total_sem_cae_ipi: number
  total_pseudonimo_duplicado: number
  total_com_contrato_ativo: number
}

// ── Contratos ──
export interface BiContratos {
  total: number
  total_ativos: number
  total_pendentes: number
  total_vencidos: number
  total_a_vencer_30d: number
  total_assinados: number
  total_aguardando_assinatura: number
  por_editora: { editora: string; count: number }[]
  por_autor: { autor: string; count: number }[]
  por_obra: { obra: string; count: number }[]
  total_com_adiantamento: number
  total_com_recoupment: number
  valor_total_adiantamentos: number
  valor_total_recoupment_aberto: number
}

// ── Autorizações ──
export interface BiAutorizacoes {
  total: number
  total_ativas: number
  total_pendentes: number
  total_vencidas: number
  total_canceladas: number
  total_emitidas: number
  total_assinadas: number
  total_faturadas: number
  total_pagas: number
  receita_total: number
  por_tipo: { tipo: string; count: number; valor: number }[]
}

// ── Recebimentos ──
export interface BiRecebimentos {
  total_registros: number
  valor_total: number
  backoffice_dsp: number
  sync: number
  internacional: number
  acordos_diretos: number
  ecad_informativo: number
  por_obra: { obra: string; valor: number }[]
  por_fonte: { fonte: string; valor: number }[]
  por_periodo: { periodo: string; valor: number }[]
  divergencias_abertas: number
}

// ── CC Obra ──
export interface BiCcObra {
  total_obras_com_cc: number
  saldo_total: number
  entradas_total: number
  distribuidos_total: number
  recoupment_aberto: number
  por_obra: { obra: string; saldo: number; entradas: number; distribuido: number }[]
  top5_saldo: { obra: string; saldo: number }[]
}

// ── CC Titular ──
export interface BiCcTitular {
  total_titulares_com_cc: number
  saldo_total: number
  saldo_disponivel: number
  saldo_bloqueado: number
  creditos_total: number
  debitos_total: number
  retencoes_total: number
  futuros_previstos: number
  por_titular: { titular: string; saldo: number; disponivel: number; bloqueado: number }[]
  top5_saldo: { titular: string; saldo: number }[]
}

// ── Financeiro ──
export interface BiFinanceiro {
  a_pagar_total: number
  a_receber_total: number
  fluxo_caixa_mes: number
  programados_semana: number
  impostos_retidos_mes: number
  inadimplencia: number
  saldo_total_contas: number
  por_conta: { banco: string; saldo: number }[]
  por_mes: { mes: string; entradas: number; saidas: number; saldo: number }[]
}

// ── Royalties Futuros ──
export interface BiRoyaltiesFuturos {
  total_apurados: number
  total_conciliados: number
  previsto_q2: number
  previsto_q3: number
  pendente_liberacao: number
  em_contestacao: number
  bloqueados: number
  por_trimestre: { trimestre: string; valor: number; status: string }[]
}

// ── BI Estratégico ──
export interface BiBiEstrategico {
  obras_mais_rentaveis: { obra: string; valor: number; crescimento: number }[]
  autores_mais_rentaveis: { autor: string; valor: number }[]
  editoras_mais_rentaveis: { editora: string; valor: number }[]
  fontes_mais_relevantes: { fonte: string; valor: number; percentual: number }[]
  dsps_mais_relevantes: { dsp: string; valor: number; percentual: number }[]
  clientes_que_geram_receita: { cliente: string; valor: number }[]
  emissoras_que_mais_usam: { emissora: string; execucoes: number; valor: number }[]
  crescimento_por_periodo: { periodo: string; valor: number; percentual_variacao: number }[]
  comparacao_trimestres: { trimestre: string; valor: number }[]
  ranking_catalogo: { posicao: number; obra: string; valor: number }[]
  curva_receita_obra: { mes: string; obra: string; valor: number }[]
}

// ── Auditoria ──
export interface BiAuditoria {
  total_logs: number
  alteracoes_cadastro: number
  alteracoes_bancarias: number
  alteracoes_contratuais: number
  alteracoes_percentuais: number
  alteracoes_obras: number
  exportacoes: number
  importacoes: number
  por_usuario: { usuario: string; count: number }[]
  logs_recentes: BiAuditoriaLog[]
}

export interface BiAuditoriaLog {
  id: string
  usuario: string
  modulo: string
  acao: string
  entidade: string
  timestamp: string
  ip?: string
}

// ── Agregado completo de BI ──
export interface BiAgregado {
  obras: BiObras
  obras_gravadas: BiObrasGravadas
  titulares: BiTitulares
  contratos: BiContratos
  autorizacoes: BiAutorizacoes
  recebimentos: BiRecebimentos
  cc_obra: BiCcObra
  cc_titular: BiCcTitular
  financeiro: BiFinanceiro
  royalties_futuros: BiRoyaltiesFuturos
  bi_estrategico: BiBiEstrategico
  auditoria: BiAuditoria
}

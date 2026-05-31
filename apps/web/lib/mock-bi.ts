// ============================================================
// mock-bi.ts — Módulo 12/13: BI e Relatórios
// Dados pré-calculados para demo
// Sync Mood Gestão Inteligente — Onda 7
// ============================================================

import type {
  BiAgregado,
  BiObras, BiObrasGravadas, BiTitulares, BiContratos,
  BiAutorizacoes, BiRecebimentos, BiCcObra, BiCcTitular,
  BiFinanceiro, BiRoyaltiesFuturos, BiBiEstrategico, BiAuditoria,
} from './types-bi'

const BI_OBRAS: BiObras = {
  total_cadastradas: 0,
  total_ativas: 0,
  total_pendentes: 0,
  total_bloqueadas: 0,
  total_sem_iswc: 0,
  total_sem_contrato: 0,
  por_editora: [],
  por_autor: [],
  por_percentual: [],
  por_sociedade: [],
  com_divergencia: 0,
}

const BI_OBRAS_GRAVADAS: BiObrasGravadas = {
  total_fonogramas: 0,
  total_com_isrc: 0,
  total_sem_isrc: 0,
  total_interpretes: 0,
  total_gravadoras: 0,
  total_distribuidoras: 0,
  total_sem_autorizacao: 0,
  total_sem_vinculo: 0,
  por_artista: [],
  por_gravadora: [],
}

const BI_TITULARES: BiTitulares = {
  total: 0,
  total_autores: 0,
  total_editoras: 0,
  total_cessionarios: 0,
  total_ativos: 0,
  total_pendentes: 0,
  total_sem_banco: 0,
  total_sem_cpf_cnpj: 0,
  total_sem_cae_ipi: 0,
  total_pseudonimo_duplicado: 0,
  total_com_contrato_ativo: 0,
}

const BI_CONTRATOS: BiContratos = {
  total: 0,
  total_ativos: 0,
  total_pendentes: 0,
  total_vencidos: 0,
  total_a_vencer_30d: 0,
  total_assinados: 0,
  total_aguardando_assinatura: 0,
  por_editora: [],
  por_autor: [],
  por_obra: [],
  total_com_adiantamento: 0,
  total_com_recoupment: 0,
  valor_total_adiantamentos: 0,
  valor_total_recoupment_aberto: 0,
}

const BI_AUTORIZACOES: BiAutorizacoes = {
  total: 0,
  total_ativas: 0,
  total_pendentes: 0,
  total_vencidas: 0,
  total_canceladas: 0,
  total_emitidas: 0,
  total_assinadas: 0,
  total_faturadas: 0,
  total_pagas: 0,
  receita_total: 0,
  por_tipo: [],
}

const BI_RECEBIMENTOS: BiRecebimentos = {
  total_registros: 0,
  valor_total: 0,
  backoffice_dsp: 0,
  sync: 0,
  internacional: 0,
  acordos_diretos: 0,
  ecad_informativo: 0,
  por_obra: [],
  por_fonte: [],
  por_periodo: [],
  divergencias_abertas: 0,
}

const BI_CC_OBRA: BiCcObra = {
  total_obras_com_cc: 0,
  saldo_total: 0,
  entradas_total: 0,
  distribuidos_total: 0,
  recoupment_aberto: 0,
  por_obra: [],
  top5_saldo: [],
}

const BI_CC_TITULAR: BiCcTitular = {
  total_titulares_com_cc: 0,
  saldo_total: 0,
  saldo_disponivel: 0,
  saldo_bloqueado: 0,
  creditos_total: 0,
  debitos_total: 0,
  retencoes_total: 0,
  futuros_previstos: 0,
  por_titular: [],
  top5_saldo: [],
}

const BI_FINANCEIRO: BiFinanceiro = {
  a_pagar_total: 0,
  a_receber_total: 0,
  fluxo_caixa_mes: 0,
  programados_semana: 0,
  impostos_retidos_mes: 0,
  inadimplencia: 0,
  saldo_total_contas: 0,
  por_conta: [],
  por_mes: [],
}

const BI_ROYALTIES_FUTUROS: BiRoyaltiesFuturos = {
  total_apurados: 0,
  total_conciliados: 0,
  previsto_q2: 0,
  previsto_q3: 0,
  pendente_liberacao: 0,
  em_contestacao: 0,
  bloqueados: 0,
  por_trimestre: [],
}

const BI_ESTRATEGICO: BiBiEstrategico = {
  obras_mais_rentaveis: [],
  autores_mais_rentaveis: [],
  editoras_mais_rentaveis: [],
  fontes_mais_relevantes: [],
  dsps_mais_relevantes: [],
  clientes_que_geram_receita: [],
  emissoras_que_mais_usam: [],
  crescimento_por_periodo: [],
  comparacao_trimestres: [],
  ranking_catalogo: [],
  curva_receita_obra: [],
}

const BI_AUDITORIA: BiAuditoria = {
  total_logs: 0,
  alteracoes_cadastro: 0,
  alteracoes_bancarias: 0,
  alteracoes_contratuais: 0,
  alteracoes_percentuais: 0,
  alteracoes_obras: 0,
  exportacoes: 0,
  importacoes: 0,
  por_usuario: [],
  logs_recentes: [],
}

export const BI_AGREGADO: BiAgregado = {
  obras: BI_OBRAS,
  obras_gravadas: BI_OBRAS_GRAVADAS,
  titulares: BI_TITULARES,
  contratos: BI_CONTRATOS,
  autorizacoes: BI_AUTORIZACOES,
  recebimentos: BI_RECEBIMENTOS,
  cc_obra: BI_CC_OBRA,
  cc_titular: BI_CC_TITULAR,
  financeiro: BI_FINANCEIRO,
  royalties_futuros: BI_ROYALTIES_FUTUROS,
  bi_estrategico: BI_ESTRATEGICO,
  auditoria: BI_AUDITORIA,
}

export {
  BI_OBRAS, BI_OBRAS_GRAVADAS, BI_TITULARES, BI_CONTRATOS,
  BI_AUTORIZACOES, BI_RECEBIMENTOS, BI_CC_OBRA, BI_CC_TITULAR,
  BI_FINANCEIRO, BI_ROYALTIES_FUTUROS, BI_ESTRATEGICO, BI_AUDITORIA,
}

export function fmtBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

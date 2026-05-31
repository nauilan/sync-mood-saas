// ============================================================
// types-portal-autor.ts — Portal / App do Autor
// Sync Mood Gestão Inteligente — Onda 7
// ============================================================

export interface PortalAutorPerfil {
  id: string
  nome: string
  nome_artistico: string
  cpf: string
  email: string
  telefone?: string
  editora_id: string
  editora_nome: string
  cae?: string
  ipi?: string
  dados_bancarios?: PortalDadosBancarios
  pendencias: PortalPendencia[]
}

export interface PortalDadosBancarios {
  banco: string
  agencia: string
  conta: string
  tipo: 'corrente' | 'poupanca' | 'pix'
  pix_chave?: string
  validado: boolean
}

export interface PortalPendencia {
  tipo: 'dados_bancarios' | 'cessao_vencendo' | 'documento_pendente' | 'contrato_assinatura'
  mensagem: string
  urgente: boolean
  data?: string
}

export interface PortalObraAutor {
  id: string
  titulo: string
  titulo_alternativo?: string
  iswc?: string
  percentual_proprio: number
  coautores: PortalCoautor[]
  editora_nome: string
  editora_id: string
  status: 'ativa' | 'pendente' | 'bloqueada' | 'em_analise'
  fonogramas_count: number
  fonogramas?: PortalFonograma[]
  autorizacoes_count: number
  created_at: string
}

export interface PortalCoautor {
  nome: string
  nome_artistico?: string
  percentual: number
  editora?: string
}

export interface PortalFonograma {
  id: string
  isrc?: string
  interprete: string
  gravadora?: string
  distribuidoras: string[]
  plataformas: string[]
  data_lancamento?: string
  autorizacao_vinculada?: boolean
}

export interface PortalRecebimento {
  id: string
  obra_id: string
  obra_titulo: string
  fonte: string
  fonte_tipo: 'ecad_socinpro' | 'backoffice_dsp' | 'sync' | 'internacional' | 'acordo_direto'
  periodo: string
  valor_bruto: number
  valor_liquido: number
  moeda: string
  status: 'pago' | 'pendente' | 'bloqueado' | 'em_analise'
  data_pagamento?: string
  is_ecad_informativo: boolean
}

export interface PortalDemonstrativo {
  id: string
  periodo: string
  periodo_label: string
  valor_bruto: number
  descontos: number
  recoupment: number
  retencoes_irpf: number
  retencoes_iss: number
  valor_liquido: number
  saldo_anterior: number
  saldo_atual: number
  status: 'disponivel' | 'processando' | 'pago'
  data_geracao: string
  pdf_url?: string
  obras: PortalDemonstrativoObra[]
}

export interface PortalDemonstrativoObra {
  obra_id: string
  titulo: string
  valor_bruto: number
  percentual_autor: number
  valor_autor: number
  deducoes: number
  valor_liquido: number
}

export interface PortalRecibo {
  id: string
  numero: string
  demonstrativo_id: string
  periodo: string
  data_emissao: string
  data_pagamento: string
  valor: number
  retencao_irpf: number
  valor_liquido: number
  fonte_pagadora: string
  cnpj_fonte: string
  cpf_beneficiario: string
  status: 'emitido' | 'pago' | 'cancelado'
  pdf_url?: string
}

export interface PortalRoyaltyFuturo {
  trimestre: string
  label: string
  tipo: 'apurado' | 'conciliado' | 'previsto' | 'pendente_liberacao' | 'em_contestacao' | 'bloqueado'
  valor: number
  descricao?: string
  obras_count: number
  data_prevista_pagamento?: string
}

export interface PortalKpis {
  saldo_disponivel: number
  saldo_bloqueado: number
  recebimentos_12m: number
  royalties_futuros_previstos: number
  obras_ativas: number
  pendencias_count: number
}

export interface PortalInformeRendimentos {
  ano: number
  titular_nome: string
  titular_cpf: string
  fonte_pagadora_nome: string
  fonte_pagadora_cnpj: string
  total_pago: number
  total_irpf_retido: number
  total_iss_retido: number
  competencias: PortalInformeCompetencia[]
}

export interface PortalInformeCompetencia {
  mes: number
  mes_label: string
  valor_bruto: number
  irpf_retido: number
  iss_retido: number
  valor_liquido: number
}

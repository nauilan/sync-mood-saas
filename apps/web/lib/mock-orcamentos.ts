import type { Orcamento } from './types-orcamentos'

export const MOCK_ORCAMENTOS: Orcamento[] = []

export const KPI_ORCAMENTOS = {
  total:         MOCK_ORCAMENTOS.length,
  enviados:      MOCK_ORCAMENTOS.filter(o => o.status === 'enviado').length,
  aprovados:     MOCK_ORCAMENTOS.filter(o => o.status === 'aprovado').length,
  convertidos:   MOCK_ORCAMENTOS.filter(o => o.status === 'convertido').length,
  recusados:     MOCK_ORCAMENTOS.filter(o => o.status === 'recusado').length,
  valor_pipeline: MOCK_ORCAMENTOS
    .filter(o => ['enviado','em_negociacao','aprovado'].includes(o.status))
    .reduce((s, o) => s + (o.valor_negociado ?? o.valor_sugerido ?? 0), 0),
}


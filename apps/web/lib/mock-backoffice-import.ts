import type { ImportacaoBO, LinhaRoyaltyBO, ResumoImportacaoBO } from './types-backoffice-import'

export const MOCK_IMPORTACOES_BO: ImportacaoBO[] = []

export const MOCK_LINHAS_ROYALTY: LinhaRoyaltyBO[] = []

export const RESUMO_BO: ResumoImportacaoBO = {
  total_importacoes: 0,
  total_valor: 0,
  total_identificado: 0,
  total_pendente: 0,
  total_nao_identificado: 0,
  por_dsp: [],
  por_tipo_direito: [],
  por_status: [],
}


/**
 * validar-direito-administrado.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MOTOR DE AUTORIZAÇÃO CENTRAL DO SYNC MOOD
 *
 * REGRA MÁXIMA: O contrato manda. O sistema se adapta ao contrato.
 * FONTE OFICIAL: contratos de cessão, administração, coedição e subedição.
 *
 * Antes de gerar, importar, cobrar ou distribuir qualquer receita,
 * TODOS os módulos devem chamar esta validação.
 *
 * Módulos obrigados a usar esta função:
 *   - Importação de receitas BackOffice / UBEM
 *   - Recebimentos manuais
 *   - Contratos confeccionados no sistema
 *   - Inclusão de obras em fonogramas
 *   - Emissão de licenças (sync, audiovisual, publicidade)
 *   - Conta corrente da obra
 *   - Distribuição para titulares
 *   - Geração / validação de CWR
 *   - Painel Analítico
 *
 * HIERARQUIA FINANCEIRA (não confundir):
 *   1. Percentual autoral da obra          → ex.: autor 50% / editora 50%
 *   2. Percentual editorial da editora     → dentro dos 50% da editora
 *   3. Percentual de administração         → editora original vs. administradora
 *   Esta função opera APENAS sobre o nível 3.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Catálogo oficial de direitos — 8 códigos jurídicos canônicos ─────────────
// REGRA: usar apenas estes códigos em todo o sistema (Migration 039+).
// Baseados nos contratos de cessão, administração, coedição e subedição.
// "Direitos Internacionais" NÃO existe aqui — é território, não direito.
//
// codigo           nome_juridico (texto exato do contrato)
// ─────────────────────────────────────────────────────────────────────────────
// repr_grafica       DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO)
// repr_fonomecanica  DIREITOS DE REPRODUÇÃO FONOMECÂNICOS (VENDA E LOCAÇÃO DE GRAVAÇÕES SONORAS)
// inclusao_audiovisual DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS
// inclusao_publicitaria DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS, GRÁFICAS, SONORAS OU AUDIOVISUAIS
// distribuicao_meios DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS, CABO, SATÉLITES, REDES DE INFORMAÇÃO E DE COMPUTADORES...
// inclusao_base_dados DIREITOS DE INCLUSÃO EM BASE DE DADOS OU QUALQUER FORMA DE ARMAZENAMENTO
// comunicacao_publico DIREITOS DE COMUNICAÇÃO AO PÚBLICO
// autorizacoes_onus  AUTORIZAÇÕES COM ÔNUS

export const DIREITOS_JURIDICOS_CODIGOS = [
  'repr_grafica',
  'repr_fonomecanica',
  'inclusao_audiovisual',
  'inclusao_publicitaria',
  'distribuicao_meios',
  'inclusao_base_dados',
  'comunicacao_publico',
  'autorizacoes_onus',
] as const

/** @deprecated Use DIREITOS_JURIDICOS_CODIGOS — os 11 códigos operacionais antigos foram migrados em 041 */
export const DIREITOS_MASTER_CODIGOS = DIREITOS_JURIDICOS_CODIGOS

export type DireitoCodigo = typeof DIREITOS_JURIDICOS_CODIGOS[number]

export type TerritorioDireito = 'brasil' | 'exterior'

// ─── Metadados dos 8 direitos para interface ──────────────────────────────────
export const DIREITOS_JURIDICOS_META: Record<DireitoCodigo, { nome_curto: string; nome_juridico: string }> = {
  repr_grafica: {
    nome_curto:    'Reprodução Gráfica',
    nome_juridico: 'DIREITOS DE REPRODUÇÃO GRÁFICA (EDIÇÃO)',
  },
  repr_fonomecanica: {
    nome_curto:    'Reprodução Fonomecânica',
    nome_juridico: 'DIREITOS DE REPRODUÇÃO FONOMECÂNICOS (VENDA E LOCAÇÃO DE GRAVAÇÕES SONORAS)',
  },
  inclusao_audiovisual: {
    nome_curto:    'Inclusão Audiovisual',
    nome_juridico: 'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES AUDIOVISUAIS',
  },
  inclusao_publicitaria: {
    nome_curto:    'Inclusão Publicitária',
    nome_juridico: 'DIREITOS DE INCLUSÃO E ADAPTAÇÃO EM PRODUÇÕES PUBLICITÁRIAS, GRÁFICAS, SONORAS OU AUDIOVISUAIS',
  },
  distribuicao_meios: {
    nome_curto:    'Distribuição por Meios',
    nome_juridico: 'DIREITOS DE DISTRIBUIÇÃO MEDIANTE MEIOS ÓTICOS, CABO, SATÉLITES, REDES DE INFORMAÇÃO E DE COMPUTADORES, QUE PERMITAM AO USUÁRIO A SELEÇÃO DA OBRA OU QUE IMPORTE EM PAGAMENTO PELO USUÁRIO',
  },
  inclusao_base_dados: {
    nome_curto:    'Inclusão em Base de Dados',
    nome_juridico: 'DIREITOS DE INCLUSÃO EM BASE DE DADOS OU QUALQUER FORMA DE ARMAZENAMENTO',
  },
  comunicacao_publico: {
    nome_curto:    'Comunicação ao Público',
    nome_juridico: 'DIREITOS DE COMUNICAÇÃO AO PÚBLICO',
  },
  autorizacoes_onus: {
    nome_curto:    'Autorizações com Ônus',
    nome_juridico: 'AUTORIZAÇÕES COM ÔNUS',
  },
}

// ─── Tipos de retorno ─────────────────────────────────────────────────────────
export interface ValidacaoDireitoResult {
  /** Se a administradora pode representar este direito neste território */
  permitido: boolean
  /** Descrição do motivo — exibir em logs, alertas ou fila de pendências */
  motivo: string
  /** % da parte editorial que fica com a editora original (0–100) */
  pct_editora_original: number | null
  /** % da parte editorial que fica com a administradora (0–100) */
  pct_administradora: number | null
  /** UUID do negócio editorial que autorizou ou bloqueou */
  negocio_editorial_id: string | null
  /** Território normalizado usado na validação */
  territorio: TerritorioDireito
  /** Código jurídico do direito consultado */
  direito_codigo: string
  /**
   * Se a obra específica é coberta pelo negócio editorial.
   * null quando obra_id não foi fornecido (sem validação por obra).
   */
  obra_coberta: boolean | null
}

export interface ValidacaoDireitoParams {
  /** UUID da editora original / administrada */
  editora_original_id: string
  /** UUID da editora administradora */
  administradora_id: string
  /**
   * Código jurídico canônico do direito.
   * Use os valores de DIREITOS_JURIDICOS_CODIGOS.
   * Ex: 'comunicacao_publico', 'distribuicao_meios'
   */
  direito_codigo: string
  /** Território: 'brasil' | 'exterior' | código ISO (ex: 'AR', 'US') */
  territorio: string
  /** Data de referência (YYYY-MM-DD). Default: hoje */
  data_referencia?: string
  /**
   * UUID da obra específica para validação por abrangência.
   * Omitir para validação de catálogo inteiro.
   * obra_coberta no retorno será null quando omitido.
   */
  obra_id?: string | null
}

// ─── Normalização de território ───────────────────────────────────────────────
/**
 * Normaliza qualquer código de território para 'brasil' ou 'exterior'.
 *
 * 'brasil' | 'BR' | 'br' | 'brazil' → 'brasil'
 * qualquer outro → 'exterior'
 */
export function normalizarTerritorio(territorio: string): TerritorioDireito {
  const t = territorio.toLowerCase().trim()
  return (t === 'brasil' || t === 'br' || t === 'brazil') ? 'brasil' : 'exterior'
}

// ─── Validação via API route (client-side / server-to-server) ─────────────────
/**
 * Valida se a administradora pode representar um direito jurídico de uma editora.
 * Chama POST /api/validar-direito-administrado, que executa a função SQL no Supabase.
 *
 * @example
 * const v = await validarDireitoAdministrado({
 *   editora_original_id: ediMusicId,
 *   administradora_id:   topShowId,
 *   direito_codigo:      'comunicacao_publico',
 *   territorio:          'brasil',
 * })
 * if (!v.permitido) {
 *   // bloquear ou enviar para fila de pendências
 *   console.warn(v.motivo)
 * } else {
 *   // aplicar: v.pct_editora_original e v.pct_administradora
 * }
 *
 * // Com validação por obra específica:
 * const v2 = await validarDireitoAdministrado({
 *   editora_original_id: ediMusicId,
 *   administradora_id:   topShowId,
 *   direito_codigo:      'comunicacao_publico',
 *   territorio:          'brasil',
 *   obra_id:             obraId,
 * })
 * // v2.obra_coberta: true | false | null
 */
export async function validarDireitoAdministrado(
  params: ValidacaoDireitoParams,
): Promise<ValidacaoDireitoResult> {
  const res = await fetch('/api/validar-direito-administrado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`validarDireitoAdministrado: ${err?.error ?? res.status}`)
  }
  return res.json()
}

// ─── Utilitários auxiliares ───────────────────────────────────────────────────
/**
 * Valida múltiplos direitos de uma vez.
 * Retorna um Map<direitoCodigo, ValidacaoDireitoResult>.
 * Útil ao processar uma receita com múltiplos tipos de direito simultaneamente.
 */
export async function validarMultiplosDireitos(
  base: Omit<ValidacaoDireitoParams, 'direito_codigo'>,
  direitos: string[],
): Promise<Map<string, ValidacaoDireitoResult>> {
  const resultados = await Promise.all(
    direitos.map(dc => validarDireitoAdministrado({ ...base, direito_codigo: dc }))
  )
  return new Map(direitos.map((dc, i) => [dc, resultados[i]]))
}

/**
 * Retorna apenas os direitos autorizados de uma lista.
 * Conveniente para filtrar o que pode ser processado antes de gerar distribuição.
 */
export async function filtrarDireitosAutorizados(
  base: Omit<ValidacaoDireitoParams, 'direito_codigo'>,
  direitos: string[],
): Promise<string[]> {
  const mapa = await validarMultiplosDireitos(base, direitos)
  return direitos.filter(dc => mapa.get(dc)?.permitido === true)
}

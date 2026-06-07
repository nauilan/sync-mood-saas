/**
 * validar-direito-administrado.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TRAVA OPERACIONAL CENTRAL DO SYNC MOOD
 *
 * REGRA: antes de gerar, importar, cobrar ou distribuir qualquer receita,
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

// ─── Catálogo oficial de direitos ────────────────────────────────────────────
// REGRA: usar apenas estes códigos em todo o sistema.
// "Direitos Internacionais" NÃO existe aqui — é território, não direito.
export const DIREITOS_MASTER_CODIGOS = [
  'execucao_publica',
  'fonodigital',
  'fonofisico',
  'sync',
  'licenciamento_direto',
  'audiovisual',
  'publicidade',
  'base_dados',
  'dir_editoriais',
  'dir_futuros',
  'outros',
] as const

export type DireitoCodigo = typeof DIREITOS_MASTER_CODIGOS[number]

export type TerritorioDireito = 'brasil' | 'exterior'

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
  /** Código do direito consultado */
  direito_codigo: string
}

export interface ValidacaoDireitoParams {
  /** UUID da editora original / administrada */
  editora_original_id: string
  /** UUID da editora administradora */
  administradora_id: string
  /** Código do direito (ex: 'execucao_publica', 'fonodigital') */
  direito_codigo: string
  /** Território: 'brasil' | 'exterior' | código ISO (ex: 'AR', 'US') */
  territorio: string
  /** Data de referência (YYYY-MM-DD). Default: hoje */
  data_referencia?: string
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
 * Valida se a administradora pode representar um direito específico de uma editora.
 * Chama POST /api/validar-direito-administrado, que executa a função SQL no Supabase.
 *
 * @example
 * const v = await validarDireitoAdministrado({
 *   editora_original_id: ediMusicId,
 *   administradora_id:   topShowId,
 *   direito_codigo:      'fonodigital',
 *   territorio:          'brasil',
 * })
 * if (!v.permitido) {
 *   // bloquear ou enviar para fila de pendências
 *   console.warn(v.motivo)
 * } else {
 *   // aplicar: v.pct_editora_original e v.pct_administradora
 * }
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

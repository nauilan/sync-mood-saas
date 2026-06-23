/**
 * lib/contrato-integridade.ts
 *
 * Funções puras de integridade contratual — extraídas das rotas de API
 * para permitir testes unitários independentes.
 */

// ── Campos críticos que exigem recontratação ao serem alterados ───────────────
export const CAMPOS_CRITICOS = ['titulo', 'subtitulo', 'titulo_alternativo', 'letra'] as const
export type CampoCritico = typeof CAMPOS_CRITICOS[number]

/**
 * Retorna quais campos críticos foram alterados entre o estado anterior e o update.
 */
export function detectarCamposCriticos(
  update: Record<string, unknown>,
  anterior: Record<string, unknown>,
): CampoCritico[] {
  return CAMPOS_CRITICOS.filter(
    c => c in update && String(anterior[c] ?? '') !== String(update[c] ?? ''),
  )
}

// ── Tipos de arquivo aceitos para contrato manual ─────────────────────────────
export const TIPOS_CONTRATO_ACEITOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const

export const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024 // 20 MB

export type ResultadoValidacaoArquivo =
  | { ok: true }
  | { ok: false; erro: string; status: 400 }

/**
 * Valida tipo e tamanho de arquivo para upload de contrato manual.
 */
export function validarArquivoContrato(
  tipo: string,
  tamanhoBytes: number,
): ResultadoValidacaoArquivo {
  if (!(TIPOS_CONTRATO_ACEITOS as readonly string[]).includes(tipo)) {
    return { ok: false, erro: 'Apenas PDF ou DOCX são aceitos', status: 400 }
  }
  if (tamanhoBytes > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: 'Arquivo excede o limite de 20 MB', status: 400 }
  }
  return { ok: true }
}

// ── Extração de texto poético (letra) do texto bruto do contrato ───────────────

/** Palavras-chave jurídicas que indicam texto legal (não poético). */
const REGEX_JURIDICO = /CONTRATO|CLÁUSULA|CONSIDERANDO|PELO PRESENTE|INSTRUMENTO|OUTORGANTE|OUTORGADO|CONTRATANTE|CONTRATADO/i

/**
 * Heurística: identifica o texto poético (letra) dentro do texto bruto do contrato.
 *
 * Algoritmo:
 *  1. Normaliza quebras de linha
 *  2. Agrupa linhas em blocos separados por linhas em branco
 *  3. Descarta linhas com palavras-chave jurídicas ou numeração de cláusulas
 *  4. Mantém apenas blocos com ≥ 4 linhas curtas (≤ 80 chars)
 *  5. Retorna o bloco mais longo como candidato principal
 */
export function extrairLetraDaLegal(texto: string): string {
  const linhas = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  const candidatos: string[][] = []
  let bloco: string[] = []

  for (const linha of linhas) {
    const l = linha.trim()

    if (l.length === 0) {
      if (bloco.length >= 4) candidatos.push([...bloco])
      bloco = []
      continue
    }

    const ehLinhaCurta     = l.length <= 80
    const ehNumeracaoClaus = /^\d+\.?\s/.test(l)
    const ehTextoJuridico  = REGEX_JURIDICO.test(l)

    if (ehLinhaCurta && !ehNumeracaoClaus && !ehTextoJuridico) {
      bloco.push(l)
    } else {
      if (bloco.length >= 4) candidatos.push([...bloco])
      bloco = []
    }
  }

  // Último bloco sem linha em branco final
  if (bloco.length >= 4) candidatos.push(bloco)

  if (candidatos.length === 0) return ''

  const melhor = candidatos.sort((a, b) => b.length - a.length)[0]
  return melhor.join('\n')
}

// ── Verificação de obras bloqueadas para exportação ───────────────────────────

export interface ObraResumo {
  id: string
  titulo?: string
  exportacao_bloqueada?: boolean
  exportacao_bloqueio_motivo?: string
}

/**
 * Retorna apenas as obras que estão bloqueadas para exportação.
 */
export function filtrarObrasBloqueadas(obras: ObraResumo[]): ObraResumo[] {
  return obras.filter(o => o.exportacao_bloqueada === true)
}

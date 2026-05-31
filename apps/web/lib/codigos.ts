/**
 * codigos.ts — Gerador central de códigos sequenciais Sync Mood
 *
 * OBRAS        → TSM00001  (TSM + 5 dígitos)
 * TITULARES    → 00001TSM  (5 dígitos + TSM)
 * CONTRATOS    → CTR-00001 (CTR- + 5 dígitos)
 * AUTORIZAÇÕES → AUT-00001 (AUT- + 5 dígitos)
 *
 * REGRA DE SEQUÊNCIA:
 * O próximo código sempre é max(todos os códigos existentes) + 1.
 * Isso garante que edições manuais são respeitadas: se alguém alterar
 * um código para TSM00050, o próximo gerado será TSM00051.
 */

const STORAGE_KEYS = {
  obra:        'seq_obra',
  titular:     'seq_titular',
  contrato:    'seq_contrato',
  autorizacao: 'seq_autorizacao',
} as const

type EntidadeCodigo = keyof typeof STORAGE_KEYS

export function pad(n: number, digits = 5): string {
  return String(n).padStart(digits, '0')
}

function lerSeq(entidade: EntidadeCodigo): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(STORAGE_KEYS[entidade]) ?? '0', 10)
}

function gravarSeq(entidade: EntidadeCodigo, seq: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS[entidade], String(seq))
}

// ─── Extratores numéricos ─────────────────────────────────────────────────────

function maxDeObras(codigos: string[]): number {
  return codigos.reduce((acc, c) => {
    const m = c.match(/^TSM(\d{5})$/i)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
}

function maxDeTitulares(codigos: string[]): number {
  return codigos.reduce((acc, c) => {
    const m = c.match(/^(\d{5})TSM$/i)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
}

function maxDeContratos(codigos: string[]): number {
  return codigos.reduce((acc, c) => {
    const m = c.match(/^CTR-(\d{5})$/i)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
}

function maxDeAutorizacoes(codigos: string[]): number {
  return codigos.reduce((acc, c) => {
    const m = c.match(/^AUT-(\d{5})$/i)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 0)
}

// ─── Geradores públicos ───────────────────────────────────────────────────────

/**
 * Retorna o próximo código de Obra: TSM00001
 * @param codigosExistentes — lista de todos os códigos já cadastrados (mocks + editados)
 */
export function proximoCodigoObra(codigosExistentes: string[] = []): string {
  const maxMock = maxDeObras(codigosExistentes)
  const maxSeq  = Math.max(lerSeq('obra'), maxMock)
  const next    = maxSeq + 1
  gravarSeq('obra', next)
  return `TSM${pad(next)}`
}

/**
 * Retorna o próximo código de Titular: 00001TSM
 * @param codigosExistentes — lista de todos os código_titular já cadastrados
 */
export function proximoCodigoTitular(codigosExistentes: string[] = []): string {
  const maxMock = maxDeTitulares(codigosExistentes)
  const maxSeq  = Math.max(lerSeq('titular'), maxMock)
  const next    = maxSeq + 1
  gravarSeq('titular', next)
  return `${pad(next)}TSM`
}

/**
 * Retorna o próximo código de Contrato: CTR-00001
 * @param codigosExistentes — lista de todos os numero_contrato já cadastrados
 */
export function proximoCodigoContrato(codigosExistentes: string[] = []): string {
  const maxMock = maxDeContratos(codigosExistentes)
  const maxSeq  = Math.max(lerSeq('contrato'), maxMock)
  const next    = maxSeq + 1
  gravarSeq('contrato', next)
  return `CTR-${pad(next)}`
}

/**
 * Retorna o próximo código de Autorização: AUT-00001
 * @param codigosExistentes — lista de todos os codigo_autorizacao já cadastrados
 */
export function proximoCodigoAutorizacao(codigosExistentes: string[] = []): string {
  const maxMock = maxDeAutorizacoes(codigosExistentes)
  const maxSeq  = Math.max(lerSeq('autorizacao'), maxMock)
  const next    = maxSeq + 1
  gravarSeq('autorizacao', next)
  return `AUT-${pad(next)}`
}

// ─── Formatadores (sem avançar o sequencial) ─────────────────────────────────

export function formatarCodigoObra(seq: number):        string { return `TSM${pad(seq)}` }
export function formatarCodigoTitular(seq: number):     string { return `${pad(seq)}TSM` }
export function formatarCodigoContrato(seq: number):    string { return `CTR-${pad(seq)}` }
export function formatarCodigoAutorizacao(seq: number): string { return `AUT-${pad(seq)}` }

// ─── Validadores ─────────────────────────────────────────────────────────────

export function validarCodigoObra(codigo: string):        boolean { return /^TSM\d{5}$/i.test(codigo.trim()) }
export function validarCodigoTitular(codigo: string):     boolean { return /^\d{5}TSM$/i.test(codigo.trim()) }
export function validarCodigoContrato(codigo: string):    boolean { return /^CTR-\d{5}$/i.test(codigo.trim()) }
export function validarCodigoAutorizacao(codigo: string): boolean { return /^AUT-\d{5}$/i.test(codigo.trim()) }

// ─── Atualizar sequencial após edição manual ─────────────────────────────────

/**
 * Deve ser chamado quando o usuário salva um código editado manualmente.
 * Garante que o sequencial interno não regride abaixo do valor editado.
 */
export function sincronizarAposEdicao(tipo: EntidadeCodigo, codigoEditado: string): void {
  const extratores: Record<EntidadeCodigo, (c: string[]) => number> = {
    obra:        codigos => maxDeObras(codigos),
    titular:     codigos => maxDeTitulares(codigos),
    contrato:    codigos => maxDeContratos(codigos),
    autorizacao: codigos => maxDeAutorizacoes(codigos),
  }
  const seq = extratores[tipo]([codigoEditado])
  if (seq > lerSeq(tipo)) gravarSeq(tipo, seq)
}

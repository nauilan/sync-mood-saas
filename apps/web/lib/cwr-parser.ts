/**
 * lib/cwr-parser.ts
 * Parser CWR 2.1 / 2.2 — offsets validados contra spec oficial CISAC e raw real.
 *
 * Posições 0-indexed, extremidade final exclusiva (substring style):
 *
 *  HDR : sender=9-29, receiver=29-49, data=49-57, versao=66-69
 *
 *  NWR/REV (240 chars):
 *    19-79  : Work Title (60)
 *    79-81  : Language Code (2)
 *    81-95  : Submitter Work # (14)
 *    95-106 : ISWC (11)
 *    113-116: Musical Work Distribution Category (3)
 *
 *  ALT (100 chars):
 *    19-79  : Title (60)
 *    79-81  : Language (2)
 *    81-82  : Title Type (2)
 *
 *  SPU/OPU (publicadora):
 *    19-21  : Publisher Sequence # (2)
 *    21-30  : Publisher IP Name # (9)
 *    30-75  : Publisher Name (45)
 *    75     : Unknown Indicator (1)
 *    76-78  : Publisher Type (2)
 *    IPI Base via regex I-\d{9}-\d no resto da linha
 *    PR/MR/SR shares via posições fixas após IPI
 *
 *  SWR/OWR (escritor) — CWR 2.2:
 *    19-27  : Writer IP Name # (9)
 *    28-72  : Writer Last Name (45)
 *    73-102 : Writer First Name (30)
 *    103    : Writer Unknown Indicator (1)
 *    104-105: Writer Designation Code (2)
 *    106-114: Tax ID # (9)
 *    115-125: Writer IPI Name # (11)
 *    126-128: PR Affiliation Society # (3)
 *    129-133: PR Share (5) — dividir por 100 para obter %
 *    134-136: MR Affiliation Society # (3)
 *    137-141: MR Share (5)
 *    142-144: SR Affiliation Society # (3)
 *    145-149: SR Share (5)
 *    150-153: Flags (Reversionary, FRR, WFH, Filler)
 *    154-166: Writer IPI Base # (13) — formato I-NNNNNNNNN-C
 *
 *  PWR:
 *    19-28  : Publisher IP Name # (9)
 *    28-73  : Publisher Name (45)
 *    73-82  : Writer IP Name # (9)
 *
 *  REC (fonograma):
 *    19-25  : Duration HHMMSS (6)
 *    ISRC via regex [A-Z]{2}[A-Z0-9]{3}\d{7} no resto da linha
 *    Intérprete via posição 63-103 ou regex de Performing Artist
 */

// ─── Interfaces públicas ──────────────────────────────────────────────────────

export interface CwrAutor {
  ipi: string | null
  ipi_nome: string | null
  nome: string
  papel: string
  pr_pct: number
  mr_pct: number
  sr_pct: number
  controlled: boolean
}

export interface CwrEditora {
  ipi: string | null
  ip_name_no: string | null
  nome: string
  tipo: string
  papel: string
  pr_pct: number
  mr_pct: number
  sr_pct: number
  controlled: boolean
}

export interface CwrFonograma {
  isrc: string | null
  titulo: string | null
  interprete: string | null
  versao: string | null
  ano: number | null
  duracao: string | null
}

export interface CwrPwrLink {
  writer_ip: string | null
  publisher_ip: string | null
  publisher_nome: string
}

/** Alias de compatibilidade */
export type CwrTitular = CwrAutor
export type CwrPapel = 'CA' | 'C' | 'A' | 'AR' | 'E' | 'ES' | 'AE' | 'SE' | 'PA' | 'outro'

export interface CwrObra {
  submitter_work_no: string
  iswc: string | null
  titulo: string
  lang: string | null
  categoria: string | null
  titulos_alt: string[]
  autores: CwrAutor[]
  editoras: CwrEditora[]
  fonogramas: CwrFonograma[]
  pwr_links: CwrPwrLink[]
  percentual_total: number
  registros_raw: string[]
  // compat legado
  titulares?: CwrAutor[]
  pwr_links_legacy?: CwrPwrLink[]
  codigo?: string
  titulo_alternativo?: string
  duracao_seg?: number
  pct_controlado?: number
  tem_editora?: boolean
  spt_shares?: unknown[]
  performers?: unknown[]
  codigo_interno_legado?: string
}

export interface CwrArquivo {
  versao: string
  sender: string
  receiver: string
  data_criacao: string
  obras: CwrObra[]
  total_records: number
  erros_parse: string[]
}

/** Alias de compatibilidade */
export type CwrParseResult = CwrArquivo

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tr(s: string): string {
  return (s ?? '').trim()
}

/** Lê coluna segura — retorna '' se a linha for mais curta */
function col(ln: string, start: number, end: number): string {
  if (ln.length <= start) return ''
  return ln.substring(start, Math.min(end, ln.length))
}

/** Percentual CWR 8-dígitos (SWR/OWR): divide por 10000 para obter %.
 *  "00500000" → 50.0000%
 */
function pct8(s: string): number {
  const raw = tr(s).replace(/\D/g, '')
  if (!raw) return 0
  const v = parseInt(raw, 10)
  return isNaN(v) ? 0 : Math.round((v / 10000) * 10000) / 10000
}

/** Percentual CWR 6-dígitos (SPU): divide por 100 para obter %.
 *  "050000" → 50.00%
 */
function pct6(s: string): number {
  const raw = tr(s).replace(/\D/g, '')
  if (!raw) return 0
  const v = parseInt(raw, 10)
  return isNaN(v) ? 0 : Math.round((v / 100) * 100) / 100
}

/** Percentual CWR 5-dígitos (SWR/OWR PR/MR/SR Share): divide por 100 para obter %.
 *  "07500" → 75.00%  |  "02500" → 25.00%
 */
function pct5(s: string): number {
  const raw = tr(s).replace(/\D/g, '')
  if (!raw) return 0
  const v = parseInt(raw, 10)
  return isNaN(v) ? 0 : Math.round((v / 100) * 100) / 100
}

/** IPI Base via regex I-NNNNNNNNN-C — extrai apenas dígitos */
const RE_IPI_FORMAT = /I[-]?(\d{9})[-]?\d/
const RE_IPI_PLAIN  = /\b(\d{9,11})\b/

function extractIpi(ln: string, start = 0): string | null {
  const sub = ln.substring(start)
  // Formato I-XXXXXXXXX-C (padrão CISAC)
  const m1 = RE_IPI_FORMAT.exec(sub)
  if (m1) return m1[1]
  // Formato numérico puro (9-11 dígitos)
  const m2 = RE_IPI_PLAIN.exec(sub)
  if (m2) {
    const s = m2[1]
    if (/^0+$/.test(s)) return null
    return s
  }
  return null
}

/** ISWC: T-XXXXXXXXX-C ou TXXXXXXXXXC (11 chars) */
const RE_ISWC = /T[-]?(\d{9})[-]?(\d)/

function iswcParse(raw: string): string | null {
  const s = tr(raw)
  if (!s) return null
  const m = RE_ISWC.exec(s)
  if (m) return `T-${m[1]}-${m[2]}`
  return null
}

/** ISRC: CC-XXX-YY-NNNNN → 12 alfanumérico sem traços.
 *  Usa varredura de janela de 12 chars para encontrar padrão mesmo sem separadores.
 */
const RE_ISRC_STRICT = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/

function isrcParse(s: string): string | null {
  const upper = tr(s).replace(/[\s\-]/g, '').toUpperCase()
  if (upper.length < 12) return null
  // Tenta a janela inicial
  if (RE_ISRC_STRICT.test(upper.substring(0, 12))) return upper.substring(0, 12)
  return null
}

/** Procura ISRC em qualquer posição de uma string longa (fallback) */
function findIsrcInLine(ln: string, fromPos = 0): string | null {
  const upper = ln.substring(fromPos).toUpperCase()
  for (let i = 0; i <= upper.length - 12; i++) {
    const candidate = upper.substring(i, i + 12)
    if (RE_ISRC_STRICT.test(candidate)) return candidate
  }
  return null
}

function nomeCompleto(sobrenome: string, primeiro: string): string {
  const s = tr(sobrenome)
  const p = tr(primeiro)
  if (!s && !p) return ''
  return p ? `${p} ${s}` : s
}

/** Detecta offset de início — sempre 0 para CWR padrão */
export function detectarOffsetCwr(_linha: string): number { return 0 }

// ─── Parser principal ─────────────────────────────────────────────────────────

export function parseCwr(conteudo: string, _opts?: unknown): CwrArquivo {
  const linhas = conteudo
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(l => l.length >= 3)

  const erros: string[] = []
  const obras: CwrObra[] = []
  let versao = '', sender = '', receiver = '', dataCri = ''
  let cur: CwrObra | null = null

  const flush = () => {
    if (!cur) return
    // Remove fonogramas completamente vazios
    cur.fonogramas = cur.fonogramas.filter(f =>
      f.isrc || f.interprete || (f.titulo && f.titulo !== '00') || f.ano
    )
    // Recalcular percentual_total com percentuais finais pós-SWT
    // (SWT pode ter sobrescrito os valores do SWR)
    cur.percentual_total = Math.round(
      cur.autores.reduce((s, a) => s + a.pr_pct, 0) * 10000
    ) / 10000
    obras.push(cur)
    cur = null
  }

  for (let i = 0; i < linhas.length; i++) {
    const ln = linhas[i]
    const t = ln.substring(0, 3).toUpperCase()

    try {
      // ── HDR ───────────────────────────────────────────────────────────────
      if (t === 'HDR') {
        sender   = tr(col(ln,  9, 29))
        receiver = tr(col(ln, 29, 49))
        dataCri  = tr(col(ln, 49, 57))
        versao   = tr(col(ln, 66, 69)) || tr(col(ln, 5, 9))
      }

      // ── NWR / REV ─────────────────────────────────────────────────────────
      else if (t === 'NWR' || t === 'REV') {
        flush()
        // Work Title (60): pos 19-79
        const titulo         = tr(col(ln,  19,  79))
        // Language Code (2): pos 79-81
        const lang           = tr(col(ln,  79,  81)) || null
        // Submitter Work # (14): pos 81-95
        const submitter_work = tr(col(ln,  81,  95))
        // ISWC (11): pos 95-106  — fallback: regex em toda a linha
        const iswcRaw = col(ln, 95, 106)
        const iswc    = iswcParse(iswcRaw) ?? iswcParse(ln.substring(95))
        // Musical Work Distribution Category (3): pos 113-116
        const categoria = tr(col(ln, 113, 116)) || null

        cur = {
          submitter_work_no: submitter_work,
          iswc,
          titulo,
          lang,
          categoria,
          titulos_alt:  [],
          autores:      [],
          editoras:     [],
          fonogramas:   [],
          pwr_links:    [],
          percentual_total: 0,
          registros_raw: [ln],
        }
      }

      // ── ALT ───────────────────────────────────────────────────────────────
      else if (t === 'ALT' && cur) {
        cur.registros_raw.push(ln)
        const alt = tr(col(ln, 19, 79))
        if (alt) cur.titulos_alt.push(alt)
      }

      // ── SPU / OPU (Publisher) ──────────────────────────────────────────────
      else if ((t === 'SPU' || t === 'OPU') && cur) {
        cur.registros_raw.push(ln)

        // Publisher IP Name # (9): pos 21-29
        const ip_name_no = tr(col(ln, 21, 30))
        // Publisher Name (45): pos 30-74
        const nome       = tr(col(ln, 30, 75))
        // Unknown Indicator (1): pos 75 | Publisher Type (2): pos 76-77
        const tipo       = tr(col(ln, 76, 78))
        // Tax ID (9): 78-86
        // Publisher IPI Name # (13): 87-99  (senders enviam 13 chars neste arquivo)
        // Filler (12): 100-111
        // PR Society (3): 112-114  |  PR Share (5): 115-119
        // MR Society (3): 120-122  |  MR Share (5): 123-127
        // SR Society (3): 128-130  |  SR Share (5): 131-135
        // Flags (3): 136-138  |  IPI Base (13): 139-151
        const prPct = pct5(col(ln, 115, 120))
        const mrPct = pct5(col(ln, 123, 128))
        const srPct = pct5(col(ln, 131, 136))

        // IPI Base # via regex (busca após os flags)
        const ipiBase = extractIpi(ln, 136) || extractIpi(ln, 78)

        if (nome) {
          cur.editoras.push({
            ipi:        ipiBase,
            ip_name_no: ip_name_no || null,
            nome,
            tipo,
            papel:      tipo,   // Publisher Type serves as role for SPU
            pr_pct:     prPct,
            mr_pct:     mrPct,
            sr_pct:     srPct,
            controlled: t === 'SPU',
          })
        }
      }

      // ── SPT (Publisher Territory — percentuais territoriais efetivos) ───────
      // SPT define os percentuais REAIS por território.
      // O SPU identifica a editora; o SPT define o quanto ela coleta no território.
      // Hierarquia: SPT sobrescreve SPU; preferência para Brasil (TIS 0076).
      //
      // Layout SPT (0-indexed):
      //   19-27  IP Name # (9) — identifica o SPU pai (match por ip_name_no)
      //   34-38  PR Collection Share (5) — divide por 100 para obter %
      //   39-43  MR Collection Share (5)
      //   44-48  SR Collection Share (5)
      //   49     Inclusion/Exclusion Indicator ('I' = incluir)
      //   50-53  TIS Numeric Code ('0076' = Brasil)
      else if (t === 'SPT' && cur) {
        cur.registros_raw.push(ln)
        const ipNameNo = tr(col(ln, 19, 28))   // IP Name # do SPU pai
        const ieInd    = tr(col(ln, 49, 50))   // 'I' = incluir no cálculo
        if (ipNameNo && ieInd === 'I') {
          const prPct   = pct5(col(ln, 34, 39))
          const mrPct   = pct5(col(ln, 39, 44))
          const srPct   = pct5(col(ln, 44, 49))
          const tisCode = tr(col(ln, 50, 54))   // '0076' = Brasil
          // Percorre de trás pra frente — SPT sempre segue seu SPU pai no arquivo,
          // então o último match é o pai correto (mesmo publisher em links múltiplos)
          for (let j = cur.editoras.length - 1; j >= 0; j--) {
            if (tr(cur.editoras[j].ip_name_no ?? '') === ipNameNo) {
              // Preferir Brasil; aceitar outro território apenas se ainda não há Brasil
              const ed = cur.editoras[j] as (typeof cur.editoras[0]) & { _spt_br?: boolean }
              if (tisCode === '0076' || !ed._spt_br) {
                ed.pr_pct = prPct
                ed.mr_pct = mrPct
                ed.sr_pct = srPct
                if (tisCode === '0076') ed._spt_br = true
              }
              break
            }
          }
        }
      }

      // ── SWR / OWR (Writer) ────────────────────────────────────────────────
      else if ((t === 'SWR' || t === 'OWR') && cur) {
        cur.registros_raw.push(ln)

        // Writer IP Name # (9): pos 19-27
        const ip_name_no = tr(col(ln, 19, 28))
        // Last Name (45): pos 28-72  |  First Name (30): pos 73-102
        const sobrenome  = col(ln, 28, 73)
        const primeiro   = col(ln, 73, 103)
        // Designation Code (2): pos 104-105 | fallback CWR 2.1: pos 95-96
        const designation = tr(col(ln, 104, 106)) || tr(col(ln, 95, 97))

        // CWR 2.2 shares (5-char, N/100 = %):
        //   Tax ID (9): 106-114  |  IPI Name (11): 115-125
        //   PR Society (3): 126-128  |  PR Share (5): 129-133
        //   MR Society (3): 134-136  |  MR Share (5): 137-141
        //   SR Society (3): 142-144  |  SR Share (5): 145-149
        //   Flags (4): 150-153  |  IPI Base (13): 154-166
        const prPct = pct5(col(ln, 129, 134))
        const mrPct = pct5(col(ln, 137, 142))
        const srPct = pct5(col(ln, 145, 150))

        // IPI Base # (13 chars) em pos 154-166 — busca a partir de 150 para robustez
        const ipiBase = extractIpi(ln, 150)

        const nomeFull = nomeCompleto(sobrenome, primeiro)
        if (nomeFull) {
          cur.autores.push({
            ipi:       ipiBase,
            ipi_nome:  ip_name_no || null,
            nome:      nomeFull,
            papel:     designation,
            pr_pct:    prPct,
            mr_pct:    mrPct,
            sr_pct:    srPct,
            controlled: t === 'SWR',
          })
          cur.percentual_total = Math.round(
            (cur.percentual_total + prPct) * 10000
          ) / 10000
        }
      }

      // ── SWT (Writer Territory — percentuais territoriais efetivos) ────────
      // SWT sobrescreve SWR/OWR para percentuais por território.
      // Preferência para Brasil (TIS 0076); fallback = percentual do SWR.
      //
      // Layout SWT (0-indexed):
      //   19-27  IP Name # (9) — identifica o SWR/OWR pai (match por ipi_nome)
      //   28-32  PR Collection Share (5) — divide por 100 para obter %
      //   33-37  MR Collection Share (5)
      //   38-42  SR Collection Share (5)
      //   43     Inclusion/Exclusion Indicator ('I' = incluir)
      //   44-47  TIS Numeric Code ('0076' = Brasil)
      else if (t === 'SWT' && cur) {
        cur.registros_raw.push(ln)
        const ipNameNo = tr(col(ln, 19, 28))   // IP Name # do SWR/OWR pai
        const ieInd    = tr(col(ln, 43, 44))   // 'I' = incluir no cálculo
        if (ipNameNo && ieInd === 'I') {
          const prPct   = pct5(col(ln, 28, 33))
          const mrPct   = pct5(col(ln, 33, 38))
          const srPct   = pct5(col(ln, 38, 43))
          const tisCode = tr(col(ln, 44, 48))   // '0076' = Brasil
          // Percorre de trás pra frente — SWT sempre segue seu SWR pai no arquivo
          for (let j = cur.autores.length - 1; j >= 0; j--) {
            if (tr(cur.autores[j].ipi_nome ?? '') === ipNameNo) {
              const aut = cur.autores[j] as (typeof cur.autores[0]) & { _swt_br?: boolean }
              if (tisCode === '0076' || !aut._swt_br) {
                aut.pr_pct = prPct
                aut.mr_pct = mrPct
                aut.sr_pct = srPct
                if (tisCode === '0076') aut._swt_br = true
              }
              break
            }
          }
        }
      }

      // ── PWR (Publisher for Writer) ────────────────────────────────────────
      else if (t === 'PWR' && cur) {
        cur.registros_raw.push(ln)
        const pub_ip   = tr(col(ln, 19, 28))
        const pub_nome = tr(col(ln, 28, 73))
        const wri_ip   = tr(col(ln, 73, 82))
        cur.pwr_links.push({
          publisher_ip:   pub_ip  || null,
          publisher_nome: pub_nome,
          writer_ip:      wri_ip  || null,
        })
      }

      // ── REC (Fonograma / Recording) ───────────────────────────────────────
      else if (t === 'REC' && cur) {
        cur.registros_raw.push(ln)

        // Duração HHMMSS: pos 19-25
        const duracaoRaw = tr(col(ln, 19, 25))
        const duracao    = /^\d{6}$/.test(duracaoRaw) ? duracaoRaw : null

        // ISRC — tenta posições fixas (CWR 2.1 / 2.2) e fallback de varredura total
        let isrc: string | null = null
        for (const [s, e] of [[51, 63], [123, 135], [63, 75]] as [number, number][]) {
          isrc = isrcParse(col(ln, s, e))
          if (isrc) break
        }
        // Fallback: varredura de janela na linha inteira a partir de pos 19
        if (!isrc) isrc = findIsrcInLine(ln, 19)

        // Intérprete: pos 63-103 (40 chars) — posição padrão CWR 2.1
        // Rejeitar valores puramente numéricos (campos de controle, não nomes reais)
        const interpreteRaw = tr(col(ln, 63, 103))
        const interprete = (interpreteRaw && !/^\d+$/.test(interpreteRaw)) ? interpreteRaw : null

        // Título da gravação: pos 94-154 (60 chars) — Recording Title conforme CWR 2.1
        // Não usar pos 25-51 (zona de campos numéricos de controle → produzia "00")
        // Não usar pos 135-175 (zona de duração/controle → produzia "000000")
        const tituloRaw = tr(col(ln, 94, 154))
        const tituloGrav = (tituloRaw && !/^\d+$/.test(tituloRaw)) ? tituloRaw : null

        // Ano: pos 160-167 (release date YYYYMMDD) → extrair 4 primeiros dígitos
        const anoStr = tr(col(ln, 160, 164))
        const anoNum = parseInt(anoStr, 10)
        const ano    = anoStr.length === 4 && anoNum >= 1900 && anoNum <= 2100
          ? anoNum
          : null

        cur.fonogramas.push({
          isrc,
          titulo:     tituloGrav,
          interprete: interprete || null,
          versao:     null,
          ano,
          duracao,
        })
      }

      // ── GRH / GRT / TRL — fim de grupo/arquivo ────────────────────────────
      else if (t === 'GRT' || t === 'TRL' || t === 'GRH') {
        flush()
      }

      // ── Demais registros: preservar raw na obra atual ─────────────────────
      else if (cur) {
        cur.registros_raw.push(ln)
      }

    } catch (e) {
      erros.push(`L${i + 1}(${t}): ${String(e)}`)
    }
  }

  flush()

  return {
    versao,
    sender,
    receiver,
    data_criacao: dataCri,
    obras,
    total_records: linhas.length,
    erros_parse:  erros,
  }
}

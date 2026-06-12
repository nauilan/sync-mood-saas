/**
 * lib/cwr-parser.ts
 * Parser para arquivos CWR 2.1 / 2.2 (formato de largura fixa).
 */

export interface CwrAutor {
  ipi: string | null
  nome: string
  papel: string
  pr_pct: number
  mr_pct: number
  sr_pct: number
  controlled: boolean
}

export interface CwrEditora {
  ipi: string | null
  nome: string
  papel: string
  pr_pct: number
  mr_pct: number
  controlled: boolean
}

export interface CwrFonograma {
  isrc: string | null
  titulo: string | null
  interprete: string | null
  versao: string | null
  ano: number | null
  duracao: string | null
  duracao_seg?: number
}

export interface CwrPwrLink {
  writer_ipi: string | null
  publisher_ipi: string | null
  publisher_nome: string
}

export type CwrPapel = 'CA' | 'C' | 'A' | 'AR' | 'E' | 'ES' | 'AE' | 'SE' | 'PA' | 'outro'

/** Alias de compatibilidade — equivale a CwrAutor */
export type CwrTitular = CwrAutor

export interface CwrObra {
  submitter_work_no: string
  iswc: string | null
  titulo: string
  categoria: string | null
  titulos_alt: string[]
  autores: CwrAutor[]
  editoras: CwrEditora[]
  fonogramas: CwrFonograma[]
  percentual_total: number
  registros_raw: string[]
  // Campos opcionais usados por integrações legadas
  titulares?: CwrAutor[]
  pwr_links?: CwrPwrLink[]
  codigo?: string
  titulo_alternativo?: string
  lang?: string
  duracao_seg?: number
  pct_controlado?: number
  tem_editora?: boolean
  spt_shares?: unknown[]
  performers?: unknown[]
  codigo_interno_legado?: string
}

/** Alias de compatibilidade — equivale a CwrArquivo */
export type CwrParseResult = CwrArquivo

export interface CwrArquivo {
  versao: string
  sender: string
  receiver: string
  data_criacao: string
  obras: CwrObra[]
  total_records: number
  erros_parse: string[]
}

function tr(s: string): string { return (s ?? '').trim() }
function num(s: string): number { const n = parseFloat(tr(s).replace(',', '.')); return isNaN(n) ? 0 : n }
function ipi(raw: string): string | null { const s = tr(raw).replace(/\D/g, ''); return (!s || /^0+$/.test(s)) ? null : s }
function iswc(raw: string): string | null { const s = tr(raw).replace(/\s/g, ''); return (s && s.startsWith('T') && s.length >= 11) ? s : null }
function nome(sob: string, pri: string): string { const s = tr(sob); const p = tr(pri); return p ? `${p} ${s}` : s }

/** Detecta o offset de início da área de dados do CWR (compatibilidade legada) */
export function detectarOffsetCwr(_linha: string): number { return 0 }

export function parseCwr(conteudo: string, _opts?: unknown): CwrArquivo {
  const linhas = conteudo.split(/\r?\n/).filter(l => l.length >= 3)
  const erros: string[] = []
  const obras: CwrObra[] = []
  let versao = '', sender = '', receiver = '', dataCri = ''
  let cur: CwrObra | null = null
  const flush = () => { if (cur) { obras.push(cur); cur = null } }

  for (let i = 0; i < linhas.length; i++) {
    const ln = linhas[i]
    const t = ln.substring(0, 3).toUpperCase()
    try {
      if (t === 'HDR') {
        sender = tr(ln.substring(9, 29)); versao = tr(ln.substring(66, 69)) || tr(ln.substring(5, 9))
        receiver = tr(ln.substring(29, 49)); dataCri = tr(ln.substring(49, 57))
      } else if (t === 'NWR' || t === 'REV') {
        flush()
        cur = {
          submitter_work_no: tr(ln.substring(19, 33)),
          iswc: ln.length > 149 ? iswc(ln.substring(149, 160)) : null,
          titulo: tr(ln.substring(33, 93)),
          categoria: tr(ln.substring(99, 101)) || null,
          titulos_alt: [], autores: [], editoras: [], fonogramas: [],
          percentual_total: 0, registros_raw: [ln],
        }
      } else if (t === 'ALT' && cur) {
        cur.registros_raw.push(ln)
        const a = tr(ln.substring(19, 79)); if (a) cur.titulos_alt.push(a)
      } else if ((t === 'SPU' || t === 'OPU') && cur) {
        cur.registros_raw.push(ln)
        const n = tr(ln.substring(41, 96))
        if (n) cur.editoras.push({ ipi: ipi(ln.substring(30, 41)), nome: n, papel: tr(ln.substring(96, 99)), pr_pct: num(ln.substring(99, 104)) / 100, mr_pct: num(ln.substring(104, 109)) / 100, controlled: t === 'SPU' })
      } else if ((t === 'SWR' || t === 'OWR') && cur) {
        cur.registros_raw.push(ln)
        const n = nome(ln.substring(41, 81), ln.substring(81, 107))
        const pr = num(ln.substring(110, 115)) / 100
        if (n) { cur.autores.push({ ipi: ipi(ln.substring(30, 41)), nome: n, papel: tr(ln.substring(107, 110)), pr_pct: pr, mr_pct: num(ln.substring(115, 120)) / 100, sr_pct: num(ln.substring(120, 125)) / 100, controlled: t === 'SWR' }); cur.percentual_total += pr }
      } else if (t === 'REC' && cur) {
        cur.registros_raw.push(ln)
        const a = tr(ln.substring(51, 55)); const an = a ? parseInt(a, 10) : null
        cur.fonogramas.push({ isrc: tr(ln.substring(123, 135)) || null, titulo: tr(ln.substring(25, 85)) || null, interprete: tr(ln.substring(135, 195)) || null, versao: tr(ln.substring(195, 225)) || null, ano: an && !isNaN(an) ? an : null, duracao: tr(ln.substring(19, 25)) || null })
      } else if (t === 'GRT' || t === 'TRL') {
        flush()
      } else if (cur) {
        cur.registros_raw.push(ln)
      }
    } catch (e) { erros.push(`L${i + 1}(${t}):${String(e)}`) }
  }
  flush()
  return { versao, sender, receiver, data_criacao: dataCri, obras, total_records: linhas.length, erros_parse: erros }
}

// ============================================================
// lib/cwr-parser.ts — Parser CWR 2.1 client-side
// Suporta: HDR, NWR, SPU, SPT, SWR, SWT, OWR, OPU, PWR, ALT, PER, REC, GRH, GRT, TRL
// Captura sequence codes de SPU/SWR e vínculos completos de PWR
// O controle editorial (controlado=true/false) é determinado em cwr-to-obra.ts,
// não aqui, pois depende do cadastro interno de editoras controladas.
// ============================================================

export type CwrPapel = 'editora_original' | 'administradora' | 'subeditora' | 'autor' | 'compositor' | 'versionista' | 'adaptador' | 'outro'

export interface CwrTitular {
  seq: number
  tipo: 'SPU' | 'SWR' | 'OWR' | 'OPU'
  nome: string
  ipi: string
  submitter_code: string
  papel_cwr: string        // E, SE, AQ, CA, C, A, V, AD, AM…
  papel: CwrPapel
  pr_pct: number           // percentual performance (0-100)
  mr_pct: number           // percentual mechanical (0-100)
  /**
   * Controle provisório (baseado apenas no campo pub_unknown do CWR).
   * O controle definitivo é recalculado em cwr-to-obra.ts usando
   * o cadastro de editoras controladas do tenant.
   */
  controlado: boolean
  publisher_ipi?: string   // link pelo IPI (legado, mantido como fallback)
  publisher_seq?: string   // link pelo publisher_sequence_code do PWR (novo)
  /**
   * Código sequencial bruto da linha CWR.
   * Para SPU: pub_seq (pos 27-28).
   * Para SWR/OWR: writer_seq (pos 27-28).
   */
  sequence_code: string
}

/** Registro PWR bruto — preservado para montagem de links por sequence code */
export interface CwrPwrLink {
  pub_ipi: string       // IPI da editora
  pub_code: string      // Publisher sequence code (pos 38-51, 14 chars)
  pub_seq: string       // Publisher sequence # (pos 27-28, 2 chars) — alias do SPU seq
  writer_ipi: string    // IPI do autor
  writer_seq: string    // Writer sequence # (pos 63-64, 2 chars)
}

export interface CwrObra {
  tx_seq: number
  /** Código interno da obra (submitter_code do NWR). Ex: AFW2 */
  codigo: string
  /** Mesmo que codigo — preservado explicitamente como legado */
  codigo_interno_legado: string
  titulo: string
  titulo_alternativo?: string
  iswc: string
  lang: string
  duracao_seg: number
  version_type: string     // ORI | MOD
  titulares: CwrTitular[]
  pwr_links: CwrPwrLink[]  // todos os registros PWR da obra
  linhas_raw: string[]     // linhas originais do grupo
  // calculados após parse
  pct_controlado: number   // soma dos % controlados normalizada
  tem_editora: boolean
}

export interface CwrParseResult {
  sender: string
  creation_date: string
  total_obras: number
  obras: CwrObra[]
  erros: string[]
  /** Offset detectado: 0=Standard, 4=Extended+4, 8=Extended UBEM */
  offset_detectado: number
  stats: {
    nwr: number
    spu: number
    swr: number
    owr: number
    pwr: number
    linhas: number
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function s(line: string, start: number, len: number): string {
  return (line.slice(start, start + len) ?? '').trim()
}

function pct(raw: string): number {
  // CWR percentual: 5 chars inteiros = centésimos (ex: "05000" = 50.00%)
  const n = parseInt(raw, 10)
  if (isNaN(n)) return 0
  return n / 100
}

function duracao(raw: string): number {
  // HHMMSS
  if (!raw || raw.trim().length < 6) return 0
  const h = parseInt(raw.slice(0, 2), 10) || 0
  const m = parseInt(raw.slice(2, 4), 10) || 0
  const sec = parseInt(raw.slice(4, 6), 10) || 0
  return h * 3600 + m * 60 + sec
}

function papelFromRole(role: string, tipo: 'SPU' | 'SWR' | 'OWR' | 'OPU'): CwrPapel {
  const r = role.trim().toUpperCase()
  if (tipo === 'SPU' || tipo === 'OPU') {
    if (r === 'E' || r === 'AQ') return 'editora_original'
    if (r === 'AM') return 'administradora'
    if (r === 'SE') return 'subeditora'
    return 'editora_original'
  }
  // SWR / OWR
  if (r === 'CA' || r === 'C') return 'compositor'
  if (r === 'A') return 'autor'
  if (r === 'V') return 'versionista'
  if (r === 'AD') return 'adaptador'
  return 'autor'
}

// ── Auto-detecção de formato CWR ──────────────────────────────────────────────
/**
 * Detecta o offset do conteúdo nas linhas NWR/SPU/SWR usando scoring alfabético.
 *
 * Testa os offsets candidatos [0, 4, 8] contra as primeiras linhas NWR/SPU do arquivo.
 * Para cada offset, extrai o campo "title" (NWR) ou "name" (SPU/SWR) e pontua
 * quantos caracteres alfabéticos aparecem nos primeiros 12 chars.
 * O offset com maior pontuação ganha.
 *
 * Isso torna o parser agnóstico a variações de formato:
 *   Standard CWR 2.1   → conteúdo em 19 (off=0)
 *   Extended BR (+4)   → conteúdo em 23 (off=4)
 *   Extended UBEM (+8) → conteúdo em 27 (off=8)
 */
function scoreOffset(line: string, off: number): number {
  // Para NWR: título começa em 19+off; para SPU/SWR: nome em 32+off
  const recType = line.slice(0, 3)
  const start   = (recType === 'NWR' || recType === 'REV') ? 19 + off : 32 + off
  const sample  = line.slice(start, start + 12)
  // Pontuação: cada letra A-Z ou char acentuado = +2; espaço entre letras = +1
  let score = 0
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i]
    if (/[A-Za-zÀ-ÿ]/.test(c)) score += 2
    else if (c === ' ' && i > 0 && i < sample.length - 1) score += 1
  }
  // Penalizar se começa com dígito (provavelmente ainda é campo sequencial)
  if (/\d/.test(sample[0] ?? '')) score -= 10
  return score
}

function detectCwrOffset(lines: string[]): number {
  const candidates = [0, 4, 8]
  const scores: Record<number, number> = { 0: 0, 4: 0, 8: 0 }
  let samples = 0

  for (const line of lines) {
    const rec = line.slice(0, 3)
    if (rec !== 'NWR' && rec !== 'REV' && rec !== 'SPU' && rec !== 'SWR') continue
    if (samples >= 6) break
    for (const off of candidates) {
      scores[off] += scoreOffset(line, off)
    }
    samples++
  }

  if (samples === 0) return 8 // fallback

  // Retorna o offset com maior pontuação acumulada
  return candidates.reduce((best, off) => scores[off] > scores[best] ? off : best, 8)
}

// ── Record parsers ────────────────────────────────────────────────────────────

function parseNWR(line: string, off: number = 8): Omit<CwrObra, 'titulares' | 'pwr_links' | 'linhas_raw' | 'pct_controlado' | 'tem_editora'> {
  const tx_seq_raw   = s(line, 11, 8)
  const titulo       = s(line, 19 + off, 60)
  const lang         = s(line, 79 + off, 2)
  const codigo       = s(line, 81 + off, 14)
  const iswc         = s(line, 95 + off, 11)
  // version_type e duracao: posições podem variar entre implementações;
  // lemos com o offset mais seguro (off-only, sem extra de sub_len).
  const version_type = s(line, 142 + off, 3) || 'ORI'
  const dur_raw      = s(line, 129 + off, 6)

  return {
    tx_seq: parseInt(tx_seq_raw, 10) || 0,
    codigo,
    codigo_interno_legado: codigo,   // preservar explicitamente
    titulo,
    iswc,
    lang,
    duracao_seg: duracao(dur_raw),
    version_type,
  }
}

function parseSPU(line: string, off: number = 8): CwrTitular {
  // off=8 (extended UBEM/BR): conteúdo em 27, submitter_code=14 chars
  // off=0 (standard CWR 2.1): conteúdo em 19, Tax_ID=9 chars
  // spu_extra: SPU extended tem submitter_code 14 chars vs 9 chars standard → +5 shift nos campos seguintes
  const spu_extra = off > 0 ? 5 : 0
  const sequence_code  = s(line, 19 + off, 2)
  const ipi            = s(line, 21 + off, 11)
  const nome           = s(line, 32 + off, 45)
  const pub_unknown    = s(line, 77 + off, 1)
  const pub_role       = s(line, 78 + off, 2)
  const sub_len        = 9 + spu_extra                          // 14 extended, 9 standard
  const submitter_code = s(line, 80 + off, sub_len)
  const pr_pct_raw     = s(line, 105 + off + spu_extra, 5)
  const mr_pct_raw     = s(line, 113 + off + spu_extra, 5)
  // Controle provisório: pub_unknown = 'Y' significa editora desconhecida/externa
  // O controle definitivo será recalculado em cwr-to-obra.ts
  const controlado     = pub_unknown !== 'Y'

  return {
    seq: parseInt(sequence_code, 10) || 0,
    tipo: 'SPU',
    nome,
    ipi,
    submitter_code,
    papel_cwr: pub_role,
    papel: papelFromRole(pub_role, 'SPU'),
    pr_pct: pct(pr_pct_raw),
    mr_pct: pct(mr_pct_raw),
    controlado,
    sequence_code,
  }
}

function parseSWR(line: string, tipo: 'SWR' | 'OWR' = 'SWR', off: number = 8): CwrTitular {
  // off=8 (extended) ou off=0 (standard)
  const sequence_code = s(line, 19 + off, 2)
  const ipi           = s(line, 21 + off, 11)
  const last_name     = s(line, 32 + off, 45)
  const first_name    = s(line, 77 + off, 30)
  const unknown       = s(line, 107 + off, 1)
  const writer_role   = s(line, 108 + off, 2)
  const pr_pct_raw    = s(line, 126 + off, 5)
  const mr_pct_raw    = s(line, 134 + off, 5)
  // OWR = sempre não controlado; SWR depende do PWR
  const controlado    = tipo === 'SWR' && unknown !== 'Y'

  const nome = first_name ? `${first_name} ${last_name}` : last_name

  return {
    seq: parseInt(sequence_code, 10) || 0,
    tipo,
    nome,
    ipi,
    submitter_code: '',
    papel_cwr: writer_role,
    papel: papelFromRole(writer_role, tipo),
    pr_pct: pct(pr_pct_raw),
    mr_pct: pct(mr_pct_raw),
    controlado,
    sequence_code,
  }
}

function parseOPU(line: string, off: number = 8): CwrTitular {
  const spu_extra      = off > 0 ? 5 : 0
  const sequence_code  = s(line, 19 + off, 2)
  const ipi            = s(line, 21 + off, 11)
  const nome           = s(line, 32 + off, 45)
  const submitter_code = s(line, 80 + off, 9 + spu_extra)
  return {
    seq: parseInt(sequence_code, 10) || 0,
    tipo: 'OPU',
    nome,
    ipi,
    submitter_code,
    papel_cwr: 'E ',
    papel: 'editora_original',
    pr_pct: 0,
    mr_pct: 0,
    controlado: false,
    sequence_code,
  }
}

function parsePWR(line: string, off: number = 8): CwrPwrLink {
  // off=8 (extended): pub_code=14 chars; off=0 (standard): pub_seq=2 chars
  const pwr_extra  = off > 0 ? 12 : 0
  const pub_ipi    = s(line, 19 + off, 11)
  const pub_code   = s(line, 30 + off, 2 + pwr_extra)
  const writer_ipi = s(line, 32 + off + pwr_extra, 11)
  const writer_seq = s(line, 43 + off + pwr_extra, 2)
  // pub_seq: primeiros 2 chars do pub_code (quando pub_code é o seq numérico)
  // ou derivado do sub-campo; manter pub_code completo + seq 2-char
  const pub_seq = pub_code.length <= 2 ? pub_code : pub_code.slice(0, 2)
  return { pub_ipi, pub_code, pub_seq, writer_ipi, writer_seq }
}

function parseALT(line: string, off: number = 8): string {
  return s(line, 19 + off, 60)
}

// ── Cálculo de percentual controlado ─────────────────────────────────────────

function calcPctControlado(titulares: CwrTitular[]): { pct: number; tem_editora: boolean } {
  const controlados = titulares.filter(t => t.controlado)
  const tem_editora = titulares.some(t => t.tipo === 'SPU' && t.controlado)

  if (controlados.length === 0) return { pct: 0, tem_editora: false }

  const total = controlados.reduce((sum, t) => sum + (t.mr_pct > 0 ? t.mr_pct : t.pr_pct), 0)
  return { pct: Math.min(100, Math.round(total * 10) / 10), tem_editora }
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseCwr(content: string): CwrParseResult {
  const lines  = content.split(/\r?\n/).filter(l => l.length >= 3)
  // Auto-detectar formato: extended (off=8) ou standard (off=0)
  const off = detectCwrOffset(lines)

  const result: CwrParseResult = {
    sender: '',
    creation_date: '',
    total_obras: 0,
    obras: [],
    erros: [],
    offset_detectado: off,
    stats: { nwr: 0, spu: 0, swr: 0, owr: 0, pwr: 0, linhas: lines.length },
  }

  let current: CwrObra | null = null

  const flush = () => {
    if (!current) return

    // Aplicar vínculos PWR: tentar primeiro por sequence_code, fallback por IPI
    for (const pwr of current.pwr_links) {
      const writer = current.titulares.find(t =>
        (t.tipo === 'SWR' || t.tipo === 'OWR') && (
          // match por sequence code (prioritário)
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq) ||
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq.padStart(2, '0')) ||
          // fallback por IPI
          (pwr.writer_ipi && t.ipi === pwr.writer_ipi)
        )
      )
      if (writer) {
        writer.publisher_ipi = pwr.pub_ipi
        writer.publisher_seq = pwr.pub_code
      }
    }

    const { pct, tem_editora } = calcPctControlado(current.titulares)
    current.pct_controlado = pct
    current.tem_editora = tem_editora
    result.obras.push(current)
    current = null
  }

  for (const line of lines) {
    const rec = line.slice(0, 3)

    try {
      if (rec === 'HDR') {
        result.sender = s(line, 12, 45)
        result.creation_date = s(line, 66, 8)
        continue
      }

      if (rec === 'NWR' || rec === 'REV') {
        flush()
        const nwr = parseNWR(line, off)
        current = { ...nwr, titulares: [], pwr_links: [], linhas_raw: [line], pct_controlado: 0, tem_editora: false }
        result.stats.nwr++
        continue
      }

      if (!current) continue

      current.linhas_raw.push(line)

      if (rec === 'SPU') {
        current.titulares.push(parseSPU(line, off))
        result.stats.spu++
      } else if (rec === 'SWR') {
        current.titulares.push(parseSWR(line, 'SWR', off))
        result.stats.swr++
      } else if (rec === 'OWR') {
        current.titulares.push(parseSWR(line, 'OWR', off))
        result.stats.owr++
      } else if (rec === 'OPU') {
        current.titulares.push(parseOPU(line, off))
      } else if (rec === 'PWR') {
        // Guardar PWR bruto; os links são aplicados no flush()
        current.pwr_links.push(parsePWR(line, off))
        result.stats.pwr++
      } else if (rec === 'ALT') {
        current.titulo_alternativo = parseALT(line, off)
      }
      // GRH, GRT, SPT, SWT, PER, REC, TRL — ignorados para prévia
    } catch (err) {
      result.erros.push(`Linha "${line.slice(0, 20)}…": ${err}`)
    }
  }

  flush()
  result.total_obras = result.obras.length
  return result
}

// ── Helpers de exibição ───────────────────────────────────────────────────────

export const PAPEL_CWR_LABEL: Record<string, string> = {
  E: 'Editora (E)', AQ: 'Editora (AQ)', SE: 'Sub-editora (SE)', AM: 'Administradora (AM)',
  CA: 'Autor/Comp. (CA)', C: 'Compositor (C)', A: 'Autor (A)', V: 'Versionista (V)',
  AD: 'Adaptador (AD)', ES: 'Estrangeiro',
}

export function labelPapel(cwr: string): string {
  return PAPEL_CWR_LABEL[cwr.trim().toUpperCase()] ?? cwr.trim()
}

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
  /** Primeira linha NWR bruta — para diagnóstico de offset */
  debug_nwr_line?: string
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
 * Detecta o offset do arquivo CWR testando TODOS os valores de 0 a 12.
 *
 * Âncoras de detecção (por ordem de confiabilidade):
 *   1. Language Code (pos 79+off, 2 chars) — exatamente 2 letras maiúsculas (PT, EN, ES…) = +25
 *   2. Submitter Work# (pos 81+off, primeiros chars) — alfanumérico, não-espaço = +5 por char
 *   3. ISWC (pos 95+off) — começa com 'T' = +20; espaço = +8; dígito = -20
 *   4. Título (pos 19+off) — alpha = +2 por char; começa com dígito = -10
 *   5. SPU/SWR: nome a pos 32+off — alpha = +1 por char
 *
 * Suporta qualquer offset de 0 a 12 inclusive.
 * Fallback padrão: 0 (Standard CWR 2.1).
 */
// Idiomas oficiais ISO 639-1 usados em CWR — score alto quando identificados
const KNOWN_LANG_CODES = new Set([
  'PT','EN','ES','FR','IT','DE','JA','KO','ZH','AR','RU','NL','SV','NO','DA',
  'FI','PL','TR','CS','HU','RO','UK','CA','GL','EU','CY','EL','HE','HI','TH',
  'ID','MS','VI','FA','SL','HR','SK','BG','LT','LV','ET','MT','SQ','MK','SR',
  'BS','GA','IS','LB','MG','SW','HA','YO','IG','ZU','AF','AM','BE','KA','HY',
  'AZ','KK','UZ','TK','MN','NE','SI','MY','KM','LO','BO','KU','PS','UR','BN',
])

function detectCwrOffset(lines: string[]): number {
  // Testar todos os offsets de 0 a 12
  const candidates = [0,1,2,3,4,5,6,7,8,9,10,11,12]
  const scores: Record<number, number> = {}
  candidates.forEach(c => { scores[c] = 0 })
  let nwrCount = 0

  for (const line of lines) {
    if (line.length < 50) continue
    const rec = line.slice(0, 3)

    if (rec === 'NWR' || rec === 'REV') {
      // Sequência de transação/registro devem ser dígitos (pos 3-18)
      const txSeq  = line.slice(3, 11)
      const recSeq = line.slice(11, 19)
      if (!/^\d{8}$/.test(recSeq) && !/^\d{8}$/.test(txSeq)) continue

      for (const off of candidates) {
        if (19 + off + 60 > line.length) continue  // linha muito curta

        // ── Âncora 1: Language Code (pos 79+off, 2 chars) ──────────────────
        // Idioma ISO conhecido = +50 (fortíssimo); 2 maiúsculas genéricas = apenas +5
        // Isso evita falso-positivo quando substring do submitter_code (ex: "FW" de "AFW2") cai nesta posição
        const lang = line.slice(79 + off, 81 + off)
        if (KNOWN_LANG_CODES.has(lang)) {
          scores[off] += 50   // idioma real — sinal fortíssimo
        } else if (/^[A-Z]{2}$/.test(lang)) {
          scores[off] += 5    // 2 maiúsculas mas não é idioma known — sinal fraco
        } else if (lang.trim() === '') {
          scores[off] += 0    // vazio = neutro (muitos CWRs omitem lang)
        } else if (/^\d/.test(lang)) {
          scores[off] -= 40   // dígito = offset claramente errado
        } else if (/^[a-z]/.test(lang)) {
          scores[off] -= 15   // minúscula = improvável
        }

        // ── Âncora 2: ISWC (pos 95+off) ────────────────────────────────────
        const iswcFirst = line[95 + off] ?? ''
        if (iswcFirst === 'T' || iswcFirst === 't') {
          scores[off] += 25
        } else if (iswcFirst === ' ') {
          scores[off] += 8    // sem ISWC é comum
        } else if (/\d/.test(iswcFirst)) {
          scores[off] -= 25   // número onde deveria ser T = errado
        }

        // ── Âncora 3: Título (pos 19+off, 12 chars sample) ─────────────────
        const titleSample = line.slice(19 + off, 31 + off)
        let alphaCount = 0
        for (const c of titleSample) {
          if (/[A-Za-zÀ-ÿ\u00C0-\u024F]/.test(c)) alphaCount++
        }
        scores[off] += alphaCount * 2
        // Penalizar se começa com dígito (improvável para título)
        if (/\d/.test(line[19 + off] ?? '')) scores[off] -= 10

        // ── Âncora 4: Submitter Work# (pos 81+off) não é espaço ───────────
        const workChar = line[81 + off] ?? ''
        if (/[A-Za-z0-9]/.test(workChar)) scores[off] += 3
        else if (workChar === ' ') scores[off] -= 2  // campo de codigo vazio = suspeito
      }

      nwrCount++
      if (nwrCount >= 20) break  // processar mais linhas para maior confiança
    }

    if (rec === 'SPU' || rec === 'SWR' || rec === 'OWR') {
      const recSeq = line.slice(11, 19)
      if (!/^\d{8}$/.test(recSeq)) continue
      for (const off of candidates) {
        if (32 + off + 12 > line.length) continue
        const nameSample = line.slice(32 + off, 44 + off)
        for (const c of nameSample) {
          if (/[A-Za-zÀ-ÿ\u00C0-\u024F]/.test(c)) scores[off] += 1
        }
        // Penalizar se começa com dígito no campo nome
        if (/\d/.test(line[32 + off] ?? '')) scores[off] -= 5
      }
    }
  }

  // Retorna o offset com maior pontuação; empate = menor offset (mais conservador)
  return candidates.reduce(
    (best, off) => scores[off] > scores[best] ? off : best,
    0  // fallback: 0 (Standard CWR 2.1)
  )
}

/** Exportar offset detectado para debugging — testa todos os offsets 0-12 */
export function detectarOffsetCwr(content: string): { offset: number; scores: Record<number, number> } {
  const lines = content.split(/\r?\n/).filter(l => l.length >= 3)
  const candidates = [0,1,2,3,4,5,6,7,8,9,10,11,12]
  const scores: Record<number, number> = {}
  candidates.forEach(c => { scores[c] = 0 })
  let nwrCount = 0
  for (const line of lines) {
    if (line.length < 50) continue
    const rec = line.slice(0, 3)
    if (rec !== 'NWR' && rec !== 'REV') continue
    const recSeq = line.slice(11, 19)
    if (!/^\d{8}$/.test(recSeq)) continue
    for (const off of candidates) {
      if (79 + off + 2 > line.length) continue
      const lang = line.slice(79 + off, 81 + off)
      if (KNOWN_LANG_CODES.has(lang)) scores[off] += 50
      else if (/^[A-Z]{2}$/.test(lang)) scores[off] += 5
      else if (lang.trim() === '') scores[off] += 0
      else if (/^\d/.test(lang)) scores[off] -= 40
      const iswcFirst = line[95 + off] ?? ''
      if (iswcFirst === 'T' || iswcFirst === 't') scores[off] += 25
      else if (iswcFirst === ' ') scores[off] += 8
      else if (/\d/.test(iswcFirst)) scores[off] -= 25
      const titleSample = line.slice(19 + off, 31 + off)
      for (const c of titleSample) { if (/[A-Za-zÀ-ÿ]/.test(c)) scores[off] += 2 }
      if (/\d/.test(line[19 + off] ?? '')) scores[off] -= 10
    }
    nwrCount++
    if (nwrCount >= 20) break
  }
  const offset = candidates.reduce((best, off) => scores[off] > scores[best] ? off : best, 0)
  return { offset, scores }
}

// ── Detecção dinâmica do tamanho do campo sequência (2 ou 14 chars) ──────────
// CWR 2.1 padrão: publisher_seq/writer_seq = 2 chars numéricos ("01", "02")
// CWR Brasil estendido: usa 14 chars alfanuméricos ("ED01", "JD01", "2646326")
function seqFieldLen(line: string, base: number): number {
  const c0 = line[base] ?? ' '
  // Inicia com letra → código alfanumérico estendido (ED01, JD01, HR01, DJ01)
  if (/[A-Z]/.test(c0)) return 14
  // Inicia com dígito → verificar se é código numérico longo (2646326) com padding
  if (/\d/.test(c0)) {
    const raw14 = line.slice(base, base + 14)
    // 3+ dígitos seguidos de espaço = código numérico padded (ex: "2646326       ")
    if (/^\d{3,}\s/.test(raw14)) return 14
  }
  return 2
}

// ── Record parsers ────────────────────────────────────────────────────────────

function parseNWR(line: string, off: number = 8): Omit<CwrObra, 'titulares' | 'pwr_links' | 'linhas_raw' | 'pct_controlado' | 'tem_editora'> {
  const tx_seq_raw   = s(line, 11, 8)
  const titulo       = s(line, 19 + off, 60)
  const lang         = s(line, 79 + off, 2)
  const codigo       = s(line, 81 + off, 14)
  const iswc         = s(line, 95 + off, 11)
  const version_type = s(line, 142 + off, 3) || 'ORI'
  const dur_raw      = s(line, 129 + off, 6)

  return {
    tx_seq: parseInt(tx_seq_raw, 10) || 0,
    codigo,
    codigo_interno_legado: codigo,
    titulo,
    iswc,
    lang,
    duracao_seg: duracao(dur_raw),
    version_type,
  }
}

function parseSPU(line: string, off: number = 0): CwrTitular {
  // Layout CWR 2.1 SPU (posições relativas a base=19+off):
  // seq(2 ou 14) | ipi(11) | nome(45) | unknown(1) | role(2) |
  // tax_id(9) | cae_ipi(11) | submitter_id(14) | pr_soc(3) | pr_pct(5) | mr_soc(3) | mr_pct(5)
  const base  = 19 + off
  const seq_l = seqFieldLen(line, base)
  const extra = seq_l - 2   // deslocamento adicional dos campos seguintes

  let p = base + seq_l
  const sequence_code = s(line, base, seq_l)
  const ipi           = s(line, p, 11); p += 11
  const nome_raw      = s(line, p, 45); p += 45
  const pub_unknown   = s(line, p, 1);  p += 1
  const pub_role      = s(line, p, 2);  p += 2
  p += 9   // tax_id
  p += 11  // cae_ipi (2º IPI)
  const submitter_id  = s(line, p, 14); p += 14
  p += 3   // pr_society
  const pr_pct_raw    = s(line, p, 5);  p += 5
  p += 3   // mr_society
  const mr_pct_raw    = s(line, p, 5)

  const controlado = pub_unknown !== 'Y'

  // Detectar código embutido no campo nome (padrão mais antigo: "ED01   EDI MUSIC EDITORA")
  let nome = nome_raw
  let codigo_em_nome = ''
  const codeMatch = nome_raw.match(/^([A-Z0-9]{2,8})\s{3,}(.+)/)
  if (codeMatch) { codigo_em_nome = codeMatch[1]; nome = codeMatch[2].trim() }

  // Código primário: submitter_id (100% confiável quando presente)
  const code = submitter_id || codigo_em_nome || sequence_code

  return {
    seq: parseInt(sequence_code.replace(/\D/g, ''), 10) || 0,
    tipo: 'SPU', nome, ipi,
    submitter_code: code,
    papel_cwr: pub_role,
    papel: papelFromRole(pub_role, 'SPU'),
    pr_pct: pct(pr_pct_raw),
    mr_pct: pct(mr_pct_raw),
    controlado, sequence_code,
  }
}

function parseSWR(line: string, tipo: 'SWR' | 'OWR' = 'SWR', off: number = 0): CwrTitular {
  // Layout CWR 2.1 SWR (posições relativas a base=19+off):
  // seq(2 ou 14) | ipi(11) | last_name(45) | first_name(30) | unknown(1) | role(2) | … | pr_pct(5) | … | mr_pct(5)
  const base  = 19 + off
  const seq_l = seqFieldLen(line, base)
  const extra = seq_l - 2

  const sequence_code  = s(line, base, seq_l)
  const ipi            = s(line, 21 + off + extra, 11)
  const last_name_raw  = s(line, 32 + off + extra, 45)
  const first_name     = s(line, 77 + off + extra, 30)
  const unknown        = s(line, 107 + off + extra, 1)
  const writer_role    = s(line, 108 + off + extra, 2)
  const pr_pct_raw     = s(line, 126 + off + extra, 5)
  const mr_pct_raw     = s(line, 134 + off + extra, 5)
  const controlado     = tipo === 'SWR' && unknown !== 'Y'

  // Detectar código embutido no campo last_name (padrão mais antigo: "JD01   JOAO DALZOTO")
  let last_name = last_name_raw
  let codigo_interno_swr = ''
  const codeMatch = last_name_raw.match(/^([A-Z]{1,3}\d{1,4})\s{3,}(.+)/)
  if (codeMatch) { codigo_interno_swr = codeMatch[1]; last_name = codeMatch[2].trim() }

  const nome = first_name ? `${first_name} ${last_name}` : last_name
  const submitter_code = codigo_interno_swr || sequence_code

  return {
    seq: parseInt(sequence_code.replace(/\D/g, ''), 10) || 0,
    tipo, nome, ipi, submitter_code,
    papel_cwr: writer_role, papel: papelFromRole(writer_role, tipo),
    pr_pct: pct(pr_pct_raw), mr_pct: pct(mr_pct_raw),
    controlado, sequence_code,
  }
}

function parseOPU(line: string, off: number = 0): CwrTitular {
  const base  = 19 + off
  const seq_l = seqFieldLen(line, base)
  const extra = seq_l - 2

  const sequence_code  = s(line, base, seq_l)
  const ipi            = s(line, 21 + off + extra, 11)
  const nome           = s(line, 32 + off + extra, 45)
  let p = base + seq_l + 11 + 45 + 1 + 2 + 9 + 11
  const submitter_code = s(line, p, 14)
  return {
    seq: parseInt(sequence_code.replace(/\D/g, ''), 10) || 0,
    tipo: 'OPU', nome, ipi, submitter_code,
    papel_cwr: 'E ', papel: 'editora_original',
    pr_pct: 0, mr_pct: 0, controlado: false, sequence_code,
  }
}

function parsePWR(line: string, off: number = 0): CwrPwrLink {
  // Layout CWR 2.1 PWR: pub_ipi(11) | pub_seq(2 ou 14) | writer_ipi(11) | writer_seq(2 ou 14)
  const base = 19 + off

  const pub_ipi     = s(line, base, 11)
  const pub_seq_pos = base + 11         // = 30 + off
  const pub_seq_l   = seqFieldLen(line, pub_seq_pos)
  const pub_code    = s(line, pub_seq_pos, pub_seq_l)

  const writer_ipi_pos = pub_seq_pos + pub_seq_l
  const writer_ipi     = s(line, writer_ipi_pos, 11)

  const writer_seq_pos = writer_ipi_pos + 11
  const writer_seq_l   = seqFieldLen(line, writer_seq_pos)
  const writer_seq     = s(line, writer_seq_pos, writer_seq_l)

  return { pub_ipi, pub_code, pub_seq: pub_code, writer_ipi, writer_seq }
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

export function parseCwr(content: string, offsetOverride?: number): CwrParseResult {
  const lines  = content.split(/\r?\n/).filter(l => l.length >= 3)
  // Auto-detectar formato: standard (off=0), BR (+4), UBEM (+8)
  // offsetOverride permite forçar manualmente quando auto-detecção falha
  const off = offsetOverride !== undefined ? offsetOverride : detectCwrOffset(lines)

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

    // Aplicar vínculos PWR: tentar por sequence_code, submitter_code ou IPI
    for (const pwr of current.pwr_links) {
      const writer = current.titulares.find(t =>
        (t.tipo === 'SWR' || t.tipo === 'OWR') && (
          // match por sequence code numérico (padrão CWR 2.1)
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq) ||
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq.padStart(2, '0')) ||
          // match por submitter_code (padrão BR: "HR01")
          (pwr.writer_seq && t.submitter_code && t.submitter_code === pwr.writer_seq) ||
          // fallback por IPI
          (pwr.writer_ipi && t.ipi === pwr.writer_ipi && pwr.writer_ipi.length > 3)
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
        // Capturar primeira linha NWR bruta para diagnóstico
        if (!result.debug_nwr_line) result.debug_nwr_line = line
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

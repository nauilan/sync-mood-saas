// ============================================================
// lib/cwr-parser.ts — Parser CWR 2.1 client-side
// Suporta: HDR, NWR, SPU, SPT, SWR, SWT, OWR, OPU, PWR, ALT, PER, REC, GRH, GRT, TRL
// SPT parseado para extrair percentuais reais (pr_own) dos publishers.
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
  pr_pct: number           // exec pública — ownership individual (SPT pr_own sobrescreve SPU header)
  mr_pct: number           // MEC ownership individual (SPU header = o quanto este participante RECEBE)
  mr_coll: number          // MEC collection (SPT mr_coll) — só AM/SE: total que coletam em nome do link
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

/** Registro SPT — percentuais reais do publisher por território */
export interface CwrSptShare {
  /** Código do sub-publisher (igual a SPU.submitter_code). Ex: "ED01", "2646326" */
  sub_publisher_code: string
  /** PR ownership share (0-100). Ex: "01250" → 12.50 */
  pr_own: number
  /** PR collect share (0-100) */
  pr_coll: number
  /** MR collect share (0-100) */
  mr_coll: number
  /** Território numérico CWR. Ex: "0076" = Brasil */
  territory: string
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
  spt_shares: CwrSptShare[] // registros SPT — % reais por publisher/território
  linhas_raw: string[]     // linhas originais do grupo
  // calculados após parse
  pct_controlado: number   // soma dos % controlados normalizada
  tem_editora: boolean
  /** Intérpretes (PER) vinculados à obra */
  performers: { nome: string; ipi?: string }[]
  /** Gravações (REC) com ISRC */
  fonogramas: { isrc: string; titulo?: string; duracao_seg?: number }[]
}

export interface CwrParseResult {
  sender: string
  creation_date: string
  total_obras: number
  obras: CwrObra[]
  erros: string[]
  /** Offset detectado para NWR: 0=Standard, 4=Extended+4, 8=Extended UBEM */
  offset_detectado: number
  /** Offset detectado para SPU/SWR/PWR (pode diferir do NWR em formatos BR) */
  spu_offset_detectado: number
  /** Primeira linha NWR bruta — para diagnóstico de offset */
  debug_nwr_line?: string
  /** Primeira linha SPU bruta — para diagnóstico de offset SPU */
  debug_spu_line?: string
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

// ── Detecção de offset para linhas SPU/SWR/PWR ───────────────────────────────
/**
 * Detecta o offset para registros SPU/SWR/OWR/PWR independentemente do NWR.
 *
 * Estratégia: para cada candidato de offset, testa as posições onde o campo
 * pub_role (2 chars) seria lido com seq_l=2 ou seq_l=14, e pontua quando
 * encontrar códigos de papel CWR válidos ("E ", "AM", "SE", "CA", "C ", etc.)
 */
const VALID_SPU_ROLES = new Set([
  'E ', 'AQ', 'PA', 'SE', 'AM', 'ES', 'E\t', 'E\r',
  'CA', 'C ', 'A ', 'V ', 'AD', 'AQ', 'PA',
])

function detectSpuOffset(lines: string[]): number {
  const offs = [0,1,2,3,4,5,6,7,8,9,10,11,12]
  const scores: Record<number, number> = {}
  offs.forEach(o => { scores[o] = 0 })

  let count = 0
  for (const line of lines) {
    const rec = line.slice(0, 3)
    if (rec !== 'SPU' && rec !== 'SWR' && rec !== 'OWR') continue
    if (line.length < 90) continue
    const recSeq = line.slice(11, 19)
    if (!/^\d{8}$/.test(recSeq)) continue

    for (const off of offs) {
      const base = 19 + off
      if (base + 80 > line.length) continue

      // Tentativa com seq_l=2: role está em base+2+11+45+1 = base+59
      const role2 = line.slice(base + 59, base + 61)
      if (VALID_SPU_ROLES.has(role2)) scores[off] += 15
      else if (/^[A-Z]{2}$/.test(role2)) scores[off] += 3
      else if (/^\d/.test(role2)) scores[off] -= 10

      // Tentativa com seq_l=14: role está em base+14+11+45+1 = base+71
      if (base + 75 <= line.length) {
        const role14 = line.slice(base + 71, base + 73)
        if (VALID_SPU_ROLES.has(role14)) scores[off] += 15
        else if (/^[A-Z]{2}$/.test(role14)) scores[off] += 3
        else if (/^\d/.test(role14)) scores[off] -= 10
      }
    }
    count++
    if (count >= 20) break
  }

  if (count === 0) return 0
  return offs.reduce((best, off) => scores[off] > scores[best] ? off : best, 0)
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

function parseNWR(line: string, off: number = 8): Omit<CwrObra, 'titulares' | 'pwr_links' | 'spt_shares' | 'linhas_raw' | 'pct_controlado' | 'tem_editora' | 'performers' | 'fonogramas'> {
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
  // ── Formato detectado do arquivo real (CW260020TSL_189.V21) ─────────────────
  // pos 19-20: ip_sequence_n (2)  → "01"
  // pos 21-29: sub_id / INTERESTED_PARTY_N (9) → "ED01     " ou "2646326  "
  // pos 30-74: publisher_name (45)
  // pos 75:    publisher_unknown (1)
  // pos 76-77: publisher_type / role (2) → "E ", "AM"
  // pos 78-86: tax_id (9)
  // pos 87-97: publisher_ipi_name_n (11)
  // pos 98-111: submitter_agreement_n (14, ignorado)
  // pos 112-114: pr_soc (3) | pos 115-119: pr_pct (5)
  // pos 120-122: mr_soc (3) | pos 123-127: mr_pct (5)
  const base = 19 + off

  // Tenta layout BR (sub_id 9 chars, nome a pos 30, role a pos 76)
  const sub_id_br = s(line, base + 2, 9)    // pos 21
  const nome_br   = s(line, base + 11, 45)  // pos 30
  const role_br   = s(line, base + 57, 2)   // pos 76

  const VALID_ROLES = new Set(['E','AQ','AM','SE','PA','ES','CA','C','A','V','AD'])

  if (VALID_ROLES.has(role_br.trim().toUpperCase())) {
    // ── Layout BR confirmado ─────────────────────────────────────────────────
    const seq_num    = s(line, base, 2)
    const ipi        = s(line, base + 68, 11)  // pos 87
    const pr_pct_raw = s(line, base + 96, 5)   // pos 115
    const mr_pct_raw = s(line, base + 104, 5)  // pos 123
    const unknown    = s(line, base + 56, 1)   // pos 75
    const controlado = unknown !== 'Y'
    return {
      seq: parseInt(seq_num.replace(/\D/g, ''), 10) || 0,
      tipo: 'SPU', nome: nome_br, ipi,
      submitter_code: sub_id_br || seq_num,
      papel_cwr: role_br.trim(),
      papel: papelFromRole(role_br, 'SPU'),
      pr_pct: pct(pr_pct_raw), mr_pct: pct(mr_pct_raw), mr_coll: 0,
      controlado, sequence_code: seq_num,
    }
  }

  // ── Fallback: layout padrão CWR 2.1 (seq variável + ipi 11 chars) ──────────
  const seq_l = seqFieldLen(line, base)
  const extra = seq_l - 2
  let p = base + seq_l
  const sequence_code = s(line, base, seq_l)
  const ipi           = s(line, p, 11); p += 11
  const nome_raw      = s(line, p, 45); p += 45
  const pub_unknown   = s(line, p, 1);  p += 1
  const pub_role      = s(line, p, 2);  p += 2
  p += 9; p += 11
  const submitter_id  = s(line, p, 14); p += 14
  p += 3
  const pr_pct_raw    = s(line, p, 5);  p += 5
  p += 3
  const mr_pct_raw    = s(line, p, 5)
  let nome = nome_raw
  let codigo_em_nome = ''
  const codeMatch = nome_raw.match(/^([A-Z0-9]{2,8})\s{3,}(.+)/)
  if (codeMatch) { codigo_em_nome = codeMatch[1]; nome = codeMatch[2].trim() }
  const code = submitter_id || codigo_em_nome || sequence_code
  return {
    seq: parseInt(sequence_code.replace(/\D/g, ''), 10) || 0,
    tipo: 'SPU', nome, ipi,
    submitter_code: code, papel_cwr: pub_role,
    papel: papelFromRole(pub_role, 'SPU'),
    pr_pct: pct(pr_pct_raw), mr_pct: pct(mr_pct_raw), mr_coll: 0,
    controlado: pub_unknown !== 'Y', sequence_code,
  }
}

function parseSWR(line: string, tipo: 'SWR' | 'OWR' = 'SWR', off: number = 0): CwrTitular {
  // ── Formato detectado do arquivo real (CW260020TSL_189.V21) ─────────────────
  // pos 19-27: writer_ip_n / sequence_code (9) → "HR01     " ou "JD01     "
  // pos 28-72: last_name (45) → "ALVES DOS REIS"
  // pos 73-102: first_name (30) → "HENRIQUE"
  // pos 103: writer_unknown (1)
  // pos 104-105: writer_designation_code / role (2) → "CA"
  // pos 106-114: tax_id (9)
  // pos 115-125: writer_ipi_name_n (11)
  // pos 126-128: pr_soc (3) | pos 129-133: pr_pct (5)
  // pos 134-136: mr_soc (3) | pos 137-141: mr_pct (5)
  const base = 19 + off

  // Tenta layout BR (writer_seq 9 chars, last_name a pos 28, role a pos 104)
  const sub_code_br = s(line, base, 9)          // pos 19 (9 chars)
  const last_name_br = s(line, base + 9, 45)    // pos 28
  const first_name_br = s(line, base + 54, 30)  // pos 73
  const role_br = s(line, base + 85, 2)         // pos 104

  const VALID_WRITER_ROLES = new Set(['CA','C','A','V','AD','E','AM','SE','AQ'])

  if (VALID_WRITER_ROLES.has(role_br.trim().toUpperCase())) {
    // ── Layout BR confirmado ─────────────────────────────────────────────────
    const ipi        = s(line, base + 96, 11)   // pos 115
    const pr_pct_raw = s(line, base + 110, 5)   // pos 129
    const mr_pct_raw = s(line, base + 118, 5)   // pos 137
    const unknown    = s(line, base + 84, 1)    // pos 103
    const controlado = tipo === 'SWR' && unknown !== 'Y'
    const nome = first_name_br ? `${first_name_br} ${last_name_br}` : last_name_br
    return {
      seq: parseInt(sub_code_br.replace(/\D/g, ''), 10) || 0,
      tipo, nome, ipi,
      submitter_code: sub_code_br,
      papel_cwr: role_br.trim(),
      papel: papelFromRole(role_br, tipo),
      pr_pct: pct(pr_pct_raw), mr_pct: pct(mr_pct_raw), mr_coll: 0,
      controlado, sequence_code: sub_code_br,
    }
  }

  // ── Fallback: layout padrão CWR 2.1 (seq variável) ─────────────────────────
  const seq_l = seqFieldLen(line, base)
  const extra = seq_l - 2
  const sequence_code  = s(line, base, seq_l)
  const ipi            = s(line, 21 + off + extra, 11)
  const last_name_raw  = s(line, 32 + off + extra, 45)
  const first_name     = s(line, 77 + off + extra, 30)
  const unknown        = s(line, 107 + off + extra, 1)
  const writer_role    = s(line, 108 + off + extra, 2)
  const pr_pct_raw     = s(line, 133 + off + extra, 5)
  const mr_pct_raw     = s(line, 141 + off + extra, 5)
  const controlado_fb  = tipo === 'SWR' && unknown !== 'Y'
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
    pr_pct: pct(pr_pct_raw), mr_pct: pct(mr_pct_raw), mr_coll: 0,
    controlado: controlado_fb, sequence_code,
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
    pr_pct: 0, mr_pct: 0, mr_coll: 0, controlado: false, sequence_code,
  }
}

function parsePWR(line: string, off: number = 0): CwrPwrLink {
  // ── Formato detectado do arquivo real (CW260020TSL_189.V21, len=110) ─────────
  // pos 19-27: pub_code (9) → "ED01     " ou "2646326  "
  // pos 28-72: pub_name (45) → "EDI MUSIC EDITORA LTDA"
  // pos 73-77: pr_owner_seq (5) → "33   " (número de ordem/referência)
  // pos 78-100: padding (23)
  // pos 101-109: writer_code (9) → "HR01     " ou "JD01     "
  //
  // O vínculo é: pub_code (pos 19) ↔ SPU.submitter_code
  //              writer_code (pos 101) ↔ SWR.submitter_code (sequence_code)
  const base = 19 + off

  // Layout BR: pub_code 9 chars a pos 19, writer_code 9 chars a pos 101
  // Identificado pelo comprimento da linha (= 110 chars para este formato TSL/ECAD)
  // Válido para códigos alfanuméricos (HR01, ED01) E numéricos (2780022, 8961236)
  if (line.length >= 108 + off) {
    const pub_code_br    = s(line, base, 9)       // pos 19
    const writer_code_br = s(line, base + 81, 9)  // pos 100 (fixed: was 101)
    // Aceitar se writer_code ou pub_code são não-vazios
    if (pub_code_br.length > 0 && writer_code_br.length > 0) {
      return {
        pub_ipi: '',
        pub_code: pub_code_br,
        pub_seq: pub_code_br,
        writer_ipi: '',
        writer_seq: writer_code_br,
      }
    }
  }

  // ── Fallback: layout padrão CWR 2.1 ─────────────────────────────────────────
  const pub_ipi     = s(line, base, 11)
  const pub_seq_pos = base + 11
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

// ── Parse SPT ─────────────────────────────────────────────────────────────────
/**
 * SPT — Sub-Publisher Territory (formato BR real, 58 chars):
 *   pos 0-2:   "SPT"
 *   pos 3-10:  tx_seq (8)
 *   pos 11-18: rec_seq (8)
 *   pos 19-33: sub_publisher_code (15, padded) — "ED01      " ou "2646326     "
 *   pos 34-38: pr_own (5)   — ownership PR. Ex: "01250" = 12.50%
 *   pos 39-43: pr_coll (5)  — collect PR.  Ex: "05000" = 50.00%
 *   pos 44-48: mr_coll (5)  — collect MR.  Ex: "05000" = 50.00%
 *   pos 49:    incl indicator ("I"/"E")
 *   pos 50-53: territory (4 chars). "0076" = Brasil
 */
function parseSPT(line: string): CwrSptShare {
  const sub_publisher_code = s(line, 19, 15)
  const pr_own  = pct(s(line, 34, 5))
  const pr_coll = pct(s(line, 39, 5))
  const mr_coll = pct(s(line, 44, 5))
  const territory = line.length > 53 ? s(line, 50, 4) : ''
  return { sub_publisher_code, pr_own, pr_coll, mr_coll, territory }
}

// ── Cálculo de percentual controlado ─────────────────────────────────────────

function calcPctControlado(titulares: CwrTitular[]): { pct: number; tem_editora: boolean } {
  const controlados = titulares.filter(t => t.controlado)
  const tem_editora = titulares.some(t => t.tipo === 'SPU' && t.controlado)

  if (controlados.length === 0) return { pct: 0, tem_editora: false }

  // % controlado = soma de exec_pública (pr_pct) de TODOS titulares controlados
  // (CA + E + AM juntos; OWR nunca controlado, já filtrado em cima)
  const total = controlados.reduce((sum, t) => sum + (t.pr_pct || 0), 0)

  return { pct: Math.min(100, Math.round(total * 100) / 100), tem_editora }
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseCwr(content: string, offsetOverride?: number): CwrParseResult {
  const lines  = content.split(/\r?\n/).filter(l => l.length >= 3)
  // Detectar offsets separados: NWR e SPU/SWR/PWR podem ter offsets diferentes em formatos BR
  const nwrOff = offsetOverride !== undefined ? offsetOverride : detectCwrOffset(lines)
  const spuOff = offsetOverride !== undefined ? offsetOverride : detectSpuOffset(lines)

  const result: CwrParseResult = {
    sender: '',
    creation_date: '',
    total_obras: 0,
    obras: [],
    erros: [],
    offset_detectado: nwrOff,
    spu_offset_detectado: spuOff,
    stats: { nwr: 0, spu: 0, swr: 0, owr: 0, pwr: 0, linhas: lines.length },
  }

  let current: CwrObra | null = null

  const flush = () => {
    if (!current) return

    // ── FASE 1: Aplicar vínculos PWR pelos campos de sequência/IPI ───────────
    for (const pwr of current.pwr_links) {
      const writer = current.titulares.find(t =>
        (t.tipo === 'SWR' || t.tipo === 'OWR') && (
          // match por sequence_code numérico (padrão CWR 2.1: "01", "02")
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq) ||
          (pwr.writer_seq && t.sequence_code === pwr.writer_seq.padStart(2, '0')) ||
          // match zero-padded inverso ("1" → "01")
          (pwr.writer_seq && pwr.writer_seq.padStart(2, '0') === t.sequence_code) ||
          // match por submitter_code (padrão BR: "HR01", "JD01")
          (pwr.writer_seq && t.submitter_code && t.submitter_code === pwr.writer_seq) ||
          // match por IPI quando disponível
          (pwr.writer_ipi && t.ipi && t.ipi === pwr.writer_ipi && pwr.writer_ipi.replace(/\D/g, '').length >= 4)
        )
      )
      if (writer) {
        writer.publisher_ipi = pwr.pub_ipi
        writer.publisher_seq = pwr.pub_code
      }
    }

    // ── FASE 2: Fallback posicional — mesmo número de PWRs e SWRs sem link ──
    const swrsTodos = current.titulares.filter(t => t.tipo === 'SWR' || t.tipo === 'OWR')
    const swrsSemPub = swrsTodos.filter(t => !t.publisher_seq && !t.publisher_ipi)
    const pwrsRestantes = current.pwr_links.filter(pwr =>
      !swrsTodos.some(t => t.publisher_seq === pwr.pub_code || t.publisher_seq === pwr.pub_seq)
    )
    if (swrsSemPub.length > 0 && pwrsRestantes.length > 0 &&
        swrsSemPub.length === pwrsRestantes.length) {
      // Ordem posicional: o 1º PWR não casado vai para o 1º SWR sem pub, etc.
      pwrsRestantes.forEach((pwr, i) => {
        if (swrsSemPub[i]) {
          swrsSemPub[i].publisher_ipi = pwr.pub_ipi
          swrsSemPub[i].publisher_seq = pwr.pub_code || pwr.pub_seq
        }
      })
    }

    // ── FASE 3: Fallback único — se existe apenas 1 editora E/AQ, vincula todos ─
    const swrsAindaSemPub = current.titulares.filter(
      t => (t.tipo === 'SWR' || t.tipo === 'OWR') && !t.publisher_seq && !t.publisher_ipi
    )
    if (swrsAindaSemPub.length > 0) {
      const editorasE = current.titulares.filter(
        t => t.tipo === 'SPU' && ['E', 'AQ', 'SE', 'ES'].includes(t.papel_cwr.trim().toUpperCase())
      )
      if (editorasE.length === 1) {
        swrsAindaSemPub.forEach(swr => {
          swr.publisher_seq = editorasE[0].sequence_code
          swr.publisher_ipi = editorasE[0].ipi
        })
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
        const nwr = parseNWR(line, nwrOff)
        // Capturar primeira linha NWR bruta para diagnóstico
        if (!result.debug_nwr_line) result.debug_nwr_line = line
        current = { ...nwr, titulares: [], pwr_links: [], spt_shares: [], linhas_raw: [line], pct_controlado: 0, tem_editora: false, performers: [], fonogramas: [] }
        result.stats.nwr++
        continue
      }

      if (!current) continue

      current.linhas_raw.push(line)

      if (rec === 'SPU') {
        if (!result.debug_spu_line) result.debug_spu_line = line
        current.titulares.push(parseSPU(line, spuOff))
        result.stats.spu++
      } else if (rec === 'SWR') {
        current.titulares.push(parseSWR(line, 'SWR', spuOff))
        result.stats.swr++
      } else if (rec === 'OWR') {
        current.titulares.push(parseSWR(line, 'OWR', spuOff))
        result.stats.owr++
      } else if (rec === 'OPU') {
        current.titulares.push(parseOPU(line, spuOff))
      } else if (rec === 'PWR') {
        // Guardar PWR bruto; os links são aplicados no flush()
        current.pwr_links.push(parsePWR(line, spuOff))
        result.stats.pwr++
      } else if (rec === 'SPT') {
        // Aplicar SPT ao SPU correspondente pelo publisher_sequence_code (não por posição)
        const sptData = parseSPT(line)
        current.spt_shares.push(sptData)
        const isBrasil = sptData.territory === '0076'
        // Encontrar o SPU mais recente cujo código corresponde ao do SPT
        // (findLast para pegar a instância mais recente quando há múltiplos SPUs com o mesmo código)
        const allSpus = current.titulares.filter(
          t => t.tipo === 'SPU' && (
            t.submitter_code === sptData.sub_publisher_code ||
            t.sequence_code  === sptData.sub_publisher_code
          )
        )
        const matchSpu = allSpus[allSpus.length - 1] ?? null
        const spu = matchSpu ?? (() => {
          // fallback: último SPU inserido (SPT segue seu SPU no CWR)
          for (let si = current.titulares.length - 1; si >= 0; si--) {
            if (current.titulares[si].tipo === 'SPU') return current.titulares[si]
          }
          return null
        })()
        if (spu) {
          // pr_own → pr_pct (exec pública territory)
          if (sptData.pr_own > 0 && (isBrasil || spu.pr_pct === 0)) {
            spu.pr_pct = sptData.pr_own
          }
          // mr_coll → quem coleta mecânico em nome do link
          const mrSrc = sptData.mr_coll > 0 ? sptData.mr_coll
                      : (sptData.pr_coll > 0 && spu.papel_cwr.trim() === 'AM' ? sptData.pr_coll : 0)
          if (mrSrc > 0 && (isBrasil || spu.mr_coll === 0)) {
            spu.mr_coll = mrSrc
          }
        }
      } else if (rec === 'SWT') {
        // SWT — território do autor: usar pr_own para setar pr_pct real do autor
        const writerSeq = s(line, 19, 9)  // pos 19-27
        const prOwn     = pct(s(line, 28, 5))  // pos 28-32
        const mrColl    = pct(s(line, 38, 5))  // pos 38-42
        const territory = line.slice(44, 48).trim()
        const isBrasil  = territory === '0076'
        const swr = current.titulares.find(
          t => (t.tipo === 'SWR' || t.tipo === 'OWR') && (
            t.submitter_code === writerSeq || t.sequence_code === writerSeq
          )
        )
        if (swr) {
          if (prOwn > 0 && (isBrasil || swr.pr_pct === 0)) swr.pr_pct = prOwn
          if (mrColl > 0 && (isBrasil || swr.mr_coll === 0)) swr.mr_coll = mrColl
        }
      } else if (rec === 'ALT') {
        current.titulo_alternativo = parseALT(line, nwrOff)
      } else if (rec === 'PER') {
        // PER: performer — posição fixa
        const lastName  = s(line, 19, 30)
        const firstName = s(line, 49, 30)
        const ipi       = s(line, 79, 11)
        const nome = [firstName, lastName].filter(Boolean).join(' ').replace(/\t/g, '').trim()
        if (nome) current.performers.push({ nome, ipi: ipi !== '00000000000' ? ipi : undefined })
      } else if (rec === 'REC') {
        // REC: recording — ISRC no formato UBEM está na posição 249 (12 chars)
        const isrc     = s(line, 249, 12)
        const durRaw   = s(line, 25, 6)  // release_duration
        const durSeg   = duracao(durRaw)
        if (isrc) current.fonogramas.push({ isrc, duracao_seg: durSeg || undefined })
      }
      // GRH, GRT, TRL — ignorados
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

// ============================================================
// lib/cwr-parser.ts — Parser CWR 2.1 client-side
// Inverso do cwr-generator.ts — lê registros de posição fixa
// Suporta: HDR, NWR, REV, SPU, SPT, SWR, SWT, OWR, PWR, ALT, PER, REC, GRH, GRT, TRL
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
  controlado: boolean      // SPU/SWR = true; OWR/OPU = false
  publisher_ipi?: string   // PWR link (autor → editora)
}

export interface CwrObra {
  tx_seq: number
  codigo: string           // submitter_code (NWR pos 89-103)
  titulo: string
  titulo_alternativo?: string
  iswc: string
  lang: string
  duracao_seg: number
  version_type: string     // ORI | MOD
  titulares: CwrTitular[]
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
  stats: {
    nwr: number
    spu: number
    swr: number
    owr: number
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

// ── Record parsers ────────────────────────────────────────────────────────────

function parseNWR(line: string): Omit<CwrObra, 'titulares' | 'linhas_raw' | 'pct_controlado' | 'tem_editora'> {
  // record_type(3) seq(8) tx_seq(8) record_seq(8) title(60) lang(2) submitter_code(14) iswc(11) copyright_dt(8) copyright_no(12) music_arr(3) lyrics_adp(3) excerpt(3) composite(3) version_type(3) excerpt_type(2) music_arr2(3) duration(6)
  const tx_seq_raw  = s(line, 11, 8)
  const titulo      = s(line, 27, 60)
  const lang        = s(line, 87, 2)
  const codigo      = s(line, 89, 14)
  const iswc        = s(line, 103, 11)
  const version_type= s(line, 149, 3) || 'ORI'
  const dur_raw     = s(line, 155, 6)

  return {
    tx_seq: parseInt(tx_seq_raw, 10) || 0,
    codigo,
    titulo,
    iswc,
    lang,
    duracao_seg: duracao(dur_raw),
    version_type,
  }
}

function parseSPU(line: string): CwrTitular {
  // record_type(3) seq(8) tx_seq(8) record_seq(8) pub_seq(2) ipi_name_no(11) pub_name(45) pub_unknown(1) pub_role(2) submitter_code(14) ipi_base_no(13) pr_soc(3) pr_pct(5) mr_soc(3) mr_pct(5)
  const seq_raw        = parseInt(s(line, 27, 2), 10) || 0
  const ipi            = s(line, 29, 11)
  const nome           = s(line, 40, 45)
  const pub_unknown    = s(line, 85, 1)
  const pub_role       = s(line, 86, 2)
  const submitter_code = s(line, 88, 14)
  const pr_pct_raw     = s(line, 118, 5)
  const mr_pct_raw     = s(line, 126, 5)
  const controlado     = pub_unknown !== 'Y'

  return {
    seq: seq_raw,
    tipo: 'SPU',
    nome,
    ipi,
    submitter_code,
    papel_cwr: pub_role,
    papel: papelFromRole(pub_role, 'SPU'),
    pr_pct: pct(pr_pct_raw),
    mr_pct: pct(mr_pct_raw),
    controlado,
  }
}

function parseSWR(line: string, tipo: 'SWR' | 'OWR' = 'SWR'): CwrTitular {
  // record_type(3) seq(8) tx_seq(8) record_seq(8) writer_seq(2) ipi_name_no(11) last_name(45) first_name(30) unknown(1) writer_role(2) ipi_base_no(13) pr_soc(3) pr_pct(5) mr_soc(3) mr_pct(5)
  const seq_raw     = parseInt(s(line, 27, 2), 10) || 0
  const ipi         = s(line, 29, 11)
  const last_name   = s(line, 40, 45)
  const first_name  = s(line, 85, 30)
  const unknown     = s(line, 115, 1)
  const writer_role = s(line, 116, 2)
  const pr_pct_raw  = s(line, 134, 5)
  const mr_pct_raw  = s(line, 142, 5)
  const controlado  = tipo === 'SWR' && unknown !== 'Y'

  const nome = first_name ? `${first_name} ${last_name}` : last_name

  return {
    seq: seq_raw,
    tipo,
    nome,
    ipi,
    submitter_code: '',
    papel_cwr: writer_role,
    papel: papelFromRole(writer_role, tipo),
    pr_pct: pct(pr_pct_raw),
    mr_pct: pct(mr_pct_raw),
    controlado,
  }
}

function parseOPU(line: string): CwrTitular {
  const seq_raw        = parseInt(s(line, 27, 2), 10) || 0
  const ipi            = s(line, 29, 11)
  const nome           = s(line, 40, 45)
  const submitter_code = s(line, 88, 14)
  return {
    seq: seq_raw,
    tipo: 'OPU',
    nome,
    ipi,
    submitter_code,
    papel_cwr: 'E ',
    papel: 'editora_original',
    pr_pct: 0,
    mr_pct: 0,
    controlado: false,
  }
}

function parsePWR(line: string): { pub_ipi: string; pub_code: string; writer_ipi: string } {
  // record_type(3) seq(8) tx_seq(8) record_seq(8) pub_ipi(11) pub_code(14) writer_ipi(11)
  const pub_ipi    = s(line, 27, 11)
  const pub_code   = s(line, 38, 14)
  const writer_ipi = s(line, 52, 11)
  return { pub_ipi, pub_code, writer_ipi }
}

function parseALT(line: string): string {
  // record_type(3) seq(8) tx_seq(8) record_seq(8) title(60) title_type(2) lang(2)
  return s(line, 27, 60)
}

// ── Cálculo de percentual controlado ─────────────────────────────────────────

function calcPctControlado(titulares: CwrTitular[]): { pct: number; tem_editora: boolean } {
  // Lógica: link controlado = tem SPU (editora) + SWR (autores)
  // Somar apenas os titulares controlados; se todos não controlados → 0
  const controlados = titulares.filter(t => t.controlado)
  const tem_editora = titulares.some(t => t.tipo === 'SPU' && t.controlado)

  if (controlados.length === 0) return { pct: 0, tem_editora: false }

  // Usa mr_pct como base (mechanical rights)
  const total = controlados.reduce((sum, t) => sum + (t.mr_pct > 0 ? t.mr_pct : t.pr_pct), 0)
  return { pct: Math.min(100, Math.round(total * 10) / 10), tem_editora }
}

// ── Parser principal ──────────────────────────────────────────────────────────

export function parseCwr(content: string): CwrParseResult {
  const lines  = content.split(/\r?\n/).filter(l => l.length >= 3)
  const result: CwrParseResult = {
    sender: '',
    creation_date: '',
    total_obras: 0,
    obras: [],
    erros: [],
    stats: { nwr: 0, spu: 0, swr: 0, owr: 0, linhas: lines.length },
  }

  let current: CwrObra | null = null

  const flush = () => {
    if (!current) return
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
        const nwr = parseNWR(line)
        current = { ...nwr, titulares: [], linhas_raw: [line], pct_controlado: 0, tem_editora: false }
        result.stats.nwr++
        continue
      }

      if (!current) continue

      current.linhas_raw.push(line)

      if (rec === 'SPU') {
        current.titulares.push(parseSPU(line))
        result.stats.spu++
      } else if (rec === 'SWR') {
        current.titulares.push(parseSWR(line, 'SWR'))
        result.stats.swr++
      } else if (rec === 'OWR') {
        current.titulares.push(parseSWR(line, 'OWR'))
        result.stats.owr++
      } else if (rec === 'OPU') {
        current.titulares.push(parseOPU(line))
      } else if (rec === 'PWR') {
        const { pub_ipi, writer_ipi } = parsePWR(line)
        // Associar editora ao autor pelo IPI
        const writer = current.titulares.find(t =>
          (t.tipo === 'SWR' || t.tipo === 'OWR') && t.ipi === writer_ipi
        )
        if (writer) writer.publisher_ipi = pub_ipi
      } else if (rec === 'ALT') {
        current.titulo_alternativo = parseALT(line)
      }
      // GRH, GRT, SPT, SWT, PER, REC, VER, TRL — ignorados para prévia
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

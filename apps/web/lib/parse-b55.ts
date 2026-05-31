/**
 * Parser B-55 (UBEM fixed-width royalty statement)
 * Extrai campos por posição fixa conforme layout identificado nos TXTs da backoffice.
 */

export interface B55Row {
  seq: number
  publisher: string
  territory: string
  source: string
  start_date: string
  end_date: string
  statement_id: string
  song_code: string
  song_title: string
  artistas: string
  royalty: number
  moeda: string
}

export interface B55ParseResult {
  filename: string
  statement_id: string
  publisher: string
  source: string
  rows: B55Row[]
  total_linhas: number
  total_valor: number
  periodo_inicio: string
  periodo_fim: string
}

function fmtDate(d: string): string {
  // YYYYMMDD -> DD/MM/YYYY
  if (/^20\d{6}$/.test(d)) {
    return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`
  }
  return d
}

function parseRoyalty(content: string): number {
  // Extrai o último bloco de 12 dígitos + ponto + 9 dígitos
  const matches = content.match(/(\d{12}\.\d{9})/g)
  if (!matches || matches.length === 0) return 0
  return parseFloat(matches[matches.length - 1])
}

export function parseB55Text(text: string, filename: string): B55ParseResult {
  const lines = text.split('\n')
  const rows: B55Row[] = []
  let detectedPublisher = ''
  let detectedSource = ''
  let detectedStmtId = ''
  let periodoInicio = ''
  let periodoFim = ''

  for (const raw of lines) {
    // Remove número sequencial inicial: "123|conteudo" -> "conteudo"
    const seqMatch = raw.match(/^(\d+)\|/)
    const seq = seqMatch ? parseInt(seqMatch[1], 10) : 0
    const content = raw.replace(/^\d+\|/, '').trimEnd()

    if (content.length < 300) continue

    const publisher  = content.slice(30, 60).trim()
    const territory  = content.slice(100, 102).trim()
    const src_raw    = content.slice(102, 122).trim()
    const source     = src_raw.split(/\s+/)[0] || ''
    const start_raw  = content.slice(122, 130)
    const end_raw    = content.slice(130, 138)
    const song_code  = content.slice(168, 182).trim().replace(/^0+/, '') || '0'
    const song_title = content.slice(182, 232).trim()
    const artistas   = content.slice(232, 332).trim()
    const moeda_raw  = content.slice(390, 393).trim()
    const moeda      = /^[A-Z]{3}$/.test(moeda_raw) ? moeda_raw : 'BRL'

    // statement_id: bloco de 7 dígitos após o código de editora (pos ~138-168)
    const stmt_m = content.slice(138, 168).match(/(\d{7,})/)
    const statement_id = stmt_m ? stmt_m[1].slice(0, 7) : ''

    const royalty = parseRoyalty(content)
    if (!song_code || royalty === 0) continue

    const start_date = fmtDate(start_raw)
    const end_date   = fmtDate(end_raw)

    if (!detectedPublisher && publisher) detectedPublisher = publisher
    if (!detectedSource && source) detectedSource = source
    if (!detectedStmtId && statement_id) detectedStmtId = statement_id
    if (!periodoInicio && start_date) periodoInicio = start_date
    if (end_date) periodoFim = end_date

    rows.push({
      seq, publisher, territory, source, start_date, end_date,
      statement_id, song_code, song_title, artistas,
      royalty, moeda,
    })
  }

  // Extrair statement ID do nome do arquivo (STxxxxxx)
  const fnStmt = filename.match(/ST(\d+)/i)
  const stmtId = fnStmt ? `ST${fnStmt[1]}` : detectedStmtId

  // Inferir DSP do nome do arquivo
  let dspInferred = detectedSource
  if (/spotify/i.test(filename)) dspInferred = 'SPOTIFY'
  else if (/youtube/i.test(filename)) dspInferred = 'YOUTUBE'
  else if (/imusica/i.test(filename)) dspInferred = 'IMUSICA'

  const total_valor = rows.reduce((s, r) => s + r.royalty, 0)

  return {
    filename,
    statement_id: stmtId,
    publisher: detectedPublisher,
    source: dspInferred,
    rows,
    total_linhas: rows.length,
    total_valor,
    periodo_inicio: periodoInicio,
    periodo_fim: periodoFim,
  }
}

/**
 * Agrupa linhas por song_code, somando royalties
 */
export interface B55Aggregated {
  song_code: string
  song_title: string
  publisher: string
  source: string
  start_date: string
  end_date: string
  statement_id: string
  total: number
  n_linhas: number
}

export function aggregateB55(result: B55ParseResult): B55Aggregated[] {
  const map = new Map<string, B55Aggregated>()
  for (const row of result.rows) {
    const existing = map.get(row.song_code)
    if (existing) {
      existing.total = Math.round((existing.total + row.royalty) * 1e9) / 1e9
      existing.n_linhas++
    } else {
      map.set(row.song_code, {
        song_code: row.song_code,
        song_title: row.song_title,
        publisher: row.publisher,
        source: row.source,
        start_date: row.start_date,
        end_date: row.end_date,
        statement_id: result.statement_id,
        total: row.royalty,
        n_linhas: 1,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

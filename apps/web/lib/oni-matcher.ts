// ============================================================
// lib/oni-matcher.ts — Algoritmo de matching ONI x catalogo
// Sync Mood Gestao Inteligente — M5 BackOffice
// ============================================================

import type { ONIRow, ONIMatch, ONIMatchConfidence, ONIMatchCriterio } from './types-oni'
import type { Obra, Fonograma } from './types-obras'

// ── Normalização ──────────────────────────────────────────────────────────────

export function normalizeStr(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')        // remove pontuacao
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitMultiTitles(title: string): string[] {
  return title
    .split(/\s*\/\s*/)
    .map(t => t.trim())
    .filter(Boolean)
}

export function splitMultiArtists(performer: string): string[] {
  return performer
    .split(/[,|]/)
    .map(p => p.trim())
    .filter(Boolean)
}

export function splitWriters(writers: string): string[] {
  return writers
    .split('|')
    .map(w => w.trim())
    .filter(Boolean)
}

// ── Levenshtein (inline, sem dependencia externa) ────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  return dp[m][n]
}

/**
 * Retorna similaridade normalizada entre 0 e 1.
 * >= 0.85 = match forte, 0.70-0.85 = parcial
 */
export function fuzzyMatch(a: string, b: string): number {
  const na = normalizeStr(a)
  const nb = normalizeStr(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const maxLen = Math.max(na.length, nb.length)
  if (maxLen === 0) return 1
  const dist = levenshtein(na, nb)
  return 1 - dist / maxLen
}

/**
 * Melhor score entre um array de candidatos contra um alvo
 */
function bestScore(targets: string[], candidates: string[]): number {
  let best = 0
  for (const t of targets) {
    for (const c of candidates) {
      const s = fuzzyMatch(t, c)
      if (s > best) best = s
    }
  }
  return best
}

// ── Obra + fonogramas snapshot (para o matcher) ──────────────────────────────

export interface ObraSnapshot {
  obra: Obra
  fonogramas: Fonograma[]
  allTitles: string[]      // titulo + titulo_original
  allInterpretes: string[] // de fonogramas
  allAutores: string[]     // nomes de titulares (passados pelo chamador)
  allIsrcs: string[]
}

export interface MatchResult {
  score: number
  criterios: ONIMatchCriterio[]
  confidence: ONIMatchConfidence | 'none'
  detalhes: {
    titulo_score: number
    autor_score: number
    interprete_score: number
    isrc_score: number
  }
}

/**
 * Cruza uma linha ONI com um snapshot de obra e retorna score composto.
 *
 * Pesos:  titulo 0.40 | autores 0.30 | interpretes 0.20 | isrc 0.10
 */
export function matchONI(oniRow: ONIRow, snapshot: ObraSnapshot): MatchResult {
  const oniTitles = splitMultiTitles(oniRow.Title)
  const oniPerformers = splitMultiArtists(oniRow.Performer)
  const oniWriters = splitWriters(oniRow.Writers)

  // Titulo
  const titulo_score = bestScore(oniTitles, snapshot.allTitles)

  // Autores
  const autor_score = bestScore(oniWriters, snapshot.allAutores)

  // Interpretes
  const interprete_score = bestScore(oniPerformers, snapshot.allInterpretes)

  // ISRC
  let isrc_score = 0
  if (oniRow.ISRC && snapshot.allIsrcs.length > 0) {
    const oniIsrc = normalizeStr(oniRow.ISRC)
    isrc_score = snapshot.allIsrcs.some(i => normalizeStr(i) === oniIsrc) ? 1 : 0
  }

  // Score composto (isrc so entra se presente)
  const hasIsrc = !!oniRow.ISRC && snapshot.allIsrcs.length > 0
  let score: number
  if (hasIsrc) {
    score = titulo_score * 0.40 + autor_score * 0.30 + interprete_score * 0.20 + isrc_score * 0.10
  } else {
    score = titulo_score * 0.444 + autor_score * 0.334 + interprete_score * 0.222
  }

  // Criterios matched (threshold >= 0.70)
  const criterios: ONIMatchCriterio[] = []
  if (titulo_score >= 0.70) criterios.push('titulo')
  if (autor_score >= 0.70) criterios.push('autor')
  if (interprete_score >= 0.70) criterios.push('interprete')
  if (isrc_score >= 1) criterios.push('isrc')

  // Confidence
  let confidence: ONIMatchConfidence | 'none'
  if (score >= 0.85) confidence = 'alta'
  else if (score >= 0.65) confidence = 'media'
  else if (score >= 0.50) confidence = 'baixa'
  else confidence = 'none'

  return {
    score,
    criterios,
    confidence,
    detalhes: { titulo_score, autor_score, interprete_score, isrc_score },
  }
}

/**
 * Cria um ONIMatch a partir do resultado do matchONI.
 */
export function buildONIMatch(
  id: string,
  lista_id: string,
  oniRow: ONIRow,
  snapshot: ObraSnapshot,
  result: MatchResult,
): Omit<ONIMatch, 'status'> & { status: 'pendente' } {
  const obra = snapshot.obra
  const autoresStr = snapshot.allAutores.join(', ')
  const interpretesStr = snapshot.allInterpretes.join(', ')
  const isrcStr = snapshot.allIsrcs[0] ?? null

  return {
    id,
    lista_id,
    oni_code: oniRow.ONI_CODE,
    obra_id: obra.id,
    submitter_songcode: obra.codigo,
    score: parseFloat(result.score.toFixed(4)),
    criterios_matched: result.criterios,
    confidence: result.confidence as ONIMatchConfidence,
    status: 'pendente',
    oni_title: oniRow.Title,
    oni_performer: oniRow.Performer,
    oni_writers: oniRow.Writers,
    oni_isrc: oniRow.ISRC,
    oni_royalty_spotify: oniRow.RoyaltyRange_Spotify,
    oni_royalty_youtube: oniRow.RoyaltyRange_Youtube,
    oni_royalty_others: oniRow.RoyaltyRange_Others,
    oni_claimed: oniRow.Claimed,
    oni_first_date: oniRow.First_Informed_Date,
    obra_titulo: obra.titulo,
    obra_codigo: obra.codigo,
    obra_interpretes: interpretesStr || null,
    obra_autores: autoresStr || null,
    obra_isrc: isrcStr,
  }
}

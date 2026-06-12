/**
 * lib/cwr-matching.ts
 * Engine de matching editorial para importação CWR.
 * Compara obras/titulares/editoras do CWR com registros existentes no banco.
 */

import type { CwrObra, CwrAutor, CwrEditora } from './cwr-parser'

// ── Tipos de resultado ─────────────────────────────────────────────────────────

export type MatchTipo = 'nova' | 'vinculada' | 'conflito' | 'ignorada' | 'divergente'

export interface MatchObra {
  match_tipo:     MatchTipo
  match_score:    number
  match_criterio: string | null
  obra_id:        string | null   // null = nova obra
  conflitos:      string[]        // descrições de campos divergentes
}

export interface MatchParticipante {
  id:              string | null  // null = novo
  tipo:            'titular' | 'editora'
  nome_cwr:        string
  ipi_cwr:         string | null
  match_score:     number
  match_criterio:  string | null
  status_editorial: 'controlado' | 'em_validacao' | 'nao_controlado' | 'administrado_externo'
}

// ── Normalização de strings ──────────────────────────────────────────────────

export function normalizar(s: string): string {
  return (s ?? '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove acentos
    .replace(/[^A-Z0-9\s]/g, '')       // só letras/números/espaços
    .replace(/\s+/g, ' ')
    .trim()
}

// Similaridade simples: proporção de bigramas em comum (Dice coefficient)
export function similaridade(a: string, b: string): number {
  const na = normalizar(a)
  const nb = normalizar(b)
  if (!na || !nb) return 0
  if (na === nb) return 1
  const bigramas = (s: string) => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 1; i++) set.add(s.substring(i, i + 2))
    return set
  }
  const ba = bigramas(na)
  const bb = bigramas(nb)
  let intersec = 0
  ba.forEach(g => { if (bb.has(g)) intersec++ })
  return (2 * intersec) / (ba.size + bb.size)
}

// ── Editoras conhecidas / administradas ────────────────────────────────────────

const EDITORAS_ADMINISTRADAS = [
  'TOP SHOW MUSIC', 'TOPSHOW MUSIC', 'TOP SHOW',
  'EDI MUSIC', 'LR EDICOES', 'LR EDIÇÕES',
  'LAMU', 'P3', 'A PARADA', 'GS MUSIC',
]

export function isEditoraAdministrada(nome: string): boolean {
  const n = normalizar(nome)
  return EDITORAS_ADMINISTRADAS.some(e => normalizar(e) === n || n.includes(normalizar(e)))
}

// ── Matching de obras ─────────────────────────────────────────────────────────

interface ObraExistente {
  id: string
  codigo_obra: string | null
  iswc: string | null
  titulo: string
  status_catalogo: string
  autores_nomes?: string[]
}

export function matchObra(cwrObra: CwrObra, existentes: ObraExistente[]): MatchObra {
  // Nível 1: submitter_work_no = codigo_obra
  if (cwrObra.submitter_work_no) {
    const m = existentes.find(o => o.codigo_obra && normalizar(o.codigo_obra) === normalizar(cwrObra.submitter_work_no))
    if (m) {
      const conflitos = detectarConflitos(cwrObra, m)
      return { match_tipo: conflitos.length > 0 && m.status_catalogo === 'catalogo_ativo' ? 'conflito' : 'vinculada', match_score: 100, match_criterio: 'codigo_interno', obra_id: m.id, conflitos }
    }
  }

  // Nível 2: ISWC
  if (cwrObra.iswc) {
    const m = existentes.find(o => o.iswc && o.iswc === cwrObra.iswc)
    if (m) {
      const conflitos = detectarConflitos(cwrObra, m)
      return { match_tipo: conflitos.length > 0 && m.status_catalogo === 'catalogo_ativo' ? 'conflito' : 'vinculada', match_score: 90, match_criterio: 'iswc', obra_id: m.id, conflitos }
    }
  }

  // Nível 3: Título normalizado + autores
  const tituloNorm = normalizar(cwrObra.titulo)
  const autoresCwr = cwrObra.autores.map(a => normalizar(a.nome))

  for (const o of existentes) {
    const sim = similaridade(o.titulo, cwrObra.titulo)
    if (sim >= 0.85) {
      const autoresOk = autoresCwr.length === 0 || (o.autores_nomes ?? []).some(an => autoresCwr.some(ac => similaridade(an, ac) >= 0.8))
      if (autoresOk) {
        const score = Math.round(sim * 85)
        const conflitos = detectarConflitos(cwrObra, o)
        return { match_tipo: conflitos.length > 0 && o.status_catalogo === 'catalogo_ativo' ? 'conflito' : 'divergente', match_score: score, match_criterio: 'titulo_autores', obra_id: o.id, conflitos }
      }
    }
  }

  // Nível 4: similaridade textual >= 0.60
  let melhorSim = 0
  let melhorObra: ObraExistente | null = null
  for (const o of existentes) {
    const s = similaridade(o.titulo, cwrObra.titulo)
    if (s > melhorSim) { melhorSim = s; melhorObra = o }
  }
  if (melhorObra && melhorSim >= 0.60) {
    return { match_tipo: 'divergente', match_score: Math.round(melhorSim * 65), match_criterio: 'similaridade', obra_id: melhorObra.id, conflitos: [`Título similar mas não confirmado (${Math.round(melhorSim * 100)}%)`] }
  }

  // Nível 5: nova obra
  return { match_tipo: 'nova', match_score: 0, match_criterio: null, obra_id: null, conflitos: [] }
}

function detectarConflitos(cwr: CwrObra, existente: ObraExistente): string[] {
  const c: string[] = []
  if (cwr.iswc && existente.iswc && cwr.iswc !== existente.iswc) c.push(`ISWC divergente: CWR=${cwr.iswc} vs Sistema=${existente.iswc}`)
  if (normalizar(cwr.titulo) !== normalizar(existente.titulo)) c.push(`Título divergente: CWR="${cwr.titulo}" vs Sistema="${existente.titulo}"`)
  return c
}

// ── Matching de titulares ──────────────────────────────────────────────────────

interface TitularExistente {
  id: string
  nome: string
  ipi: string | null
  tem_contrato_valido?: boolean
}

export function matchAutor(
  autor: CwrAutor,
  titulares: TitularExistente[]
): MatchParticipante {
  // Por IPI
  if (autor.ipi) {
    const m = titulares.find(t => t.ipi && t.ipi === autor.ipi)
    if (m) return {
      id: m.id, tipo: 'titular', nome_cwr: autor.nome, ipi_cwr: autor.ipi,
      match_score: 100, match_criterio: 'ipi',
      status_editorial: resolverStatus(m.tem_contrato_valido, false),
    }
  }

  // Por nome (>= 85%)
  let melhorSim = 0
  let melhor: TitularExistente | null = null
  for (const tit of titulares) {
    const s = similaridade(tit.nome, autor.nome)
    if (s > melhorSim) { melhorSim = s; melhor = tit }
  }
  if (melhor && melhorSim >= 0.85) return {
    id: melhor.id, tipo: 'titular', nome_cwr: autor.nome, ipi_cwr: autor.ipi,
    match_score: Math.round(melhorSim * 75), match_criterio: 'nome',
    status_editorial: resolverStatus(melhor.tem_contrato_valido, false),
  }

  // Novo titular
  return { id: null, tipo: 'titular', nome_cwr: autor.nome, ipi_cwr: autor.ipi, match_score: 0, match_criterio: null, status_editorial: 'nao_controlado' }
}

// ── Matching de editoras ────────────────────────────────────────────────────────

interface EditoraExistente {
  id: string
  nome: string
  ipi: string | null
}

export function matchEditora(
  editora: CwrEditora,
  editoras: EditoraExistente[]
): MatchParticipante {
  // Por IPI
  if (editora.ipi) {
    const m = editoras.find(e => e.ipi && e.ipi === editora.ipi)
    if (m) return { id: m.id, tipo: 'editora', nome_cwr: editora.nome, ipi_cwr: editora.ipi, match_score: 100, match_criterio: 'ipi', status_editorial: 'controlado' }
  }

  // Editora administrada conhecida
  if (isEditoraAdministrada(editora.nome)) {
    const m = editoras.find(e => similaridade(e.nome, editora.nome) >= 0.60)
    if (m) return { id: m.id, tipo: 'editora', nome_cwr: editora.nome, ipi_cwr: editora.ipi, match_score: 90, match_criterio: 'administrada_conhecida', status_editorial: 'controlado' }
  }

  // Por nome >= 75%
  let melhorSim = 0
  let melhor: EditoraExistente | null = null
  for (const e of editoras) {
    const s = similaridade(e.nome, editora.nome)
    if (s > melhorSim) { melhorSim = s; melhor = e }
  }
  if (melhor && melhorSim >= 0.75) return { id: melhor.id, tipo: 'editora', nome_cwr: editora.nome, ipi_cwr: editora.ipi, match_score: Math.round(melhorSim * 80), match_criterio: 'nome', status_editorial: 'administrado_externo' }

  return { id: null, tipo: 'editora', nome_cwr: editora.nome, ipi_cwr: editora.ipi, match_score: 0, match_criterio: null, status_editorial: 'administrado_externo' }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function resolverStatus(
  temContrato: boolean | undefined,
  externo: boolean
): MatchParticipante['status_editorial'] {
  if (externo) return 'administrado_externo'
  if (temContrato === true) return 'controlado'
  if (temContrato === false) return 'nao_controlado'
  return 'em_validacao'
}

export type AutorDedup = { titular_id?: string | null; nomes: Array<string | null | undefined> }
export type MatchTipoDedup = 'duplicata_exata' | 'homonima' | 'nenhum'

export function normalizarTextoDedup(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function aliasesAutor(autor: AutorDedup): string[] {
  return Array.from(new Set((autor.nomes ?? []).map(normalizarTextoDedup).filter(Boolean)))
}

function autoresIguais(a: AutorDedup, b: AutorDedup): boolean {
  if (a.titular_id && b.titular_id && a.titular_id === b.titular_id) return true
  const aliasesA = aliasesAutor(a)
  const aliasesB = aliasesAutor(b)
  return aliasesA.some(nome => aliasesB.includes(nome))
}

export function classificarAutoresDedup(novosAutores: AutorDedup[], autoresExistentes: AutorDedup[]): MatchTipoDedup {
  const novos = novosAutores.filter(a => aliasesAutor(a).length > 0 || Boolean(a.titular_id))
  const existentes = autoresExistentes.filter(a => aliasesAutor(a).length > 0 || Boolean(a.titular_id))

  if (novos.length === 0 || existentes.length === 0) return 'nenhum'

  const usados = new Set<number>()
  const todosNovosCasam = novos.every(novo => {
    const idx = existentes.findIndex((existente, i) => !usados.has(i) && autoresIguais(novo, existente))
    if (idx < 0) return false
    usados.add(idx)
    return true
  })

  if (todosNovosCasam && novos.length === existentes.length) return 'duplicata_exata'
  if (novos.some(novo => existentes.some(existente => autoresIguais(novo, existente)))) return 'homonima'
  return 'nenhum'
}

export function isPapelAutorDedup(t: Record<string, unknown>): boolean {
  const papel = normalizarTextoDedup(t.papel)
  const funcao = String(t.funcao_no_link ?? '').trim().toUpperCase()
  return ['autor', 'compositor', 'coautor', 'co titular', 'co_titular', 'letrista', 'versionista', 'adaptador', 'compositor letrista'].includes(papel)
    || ['A', 'CA', 'C', 'CE', 'V', 'AD', 'T'].includes(funcao)
}
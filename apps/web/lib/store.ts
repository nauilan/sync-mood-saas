// ============================================================
// lib/store.ts — Camada de persistência client-side (localStorage)
// Alimentada pelas importações (CWR, DSP TXT, etc.)
// Lida por todos os módulos como fonte de dados primária
// ============================================================

export const STORE_KEYS = {
  obras:        'sm_obras_v1',
  titulares:    'sm_titulares_v1',
  gravacoes:    'sm_gravacoes_v1',
  contratos:    'sm_contratos_v1',
  editoras:     'sm_editoras_v1',
  cc_obras:     'sm_cc_obras_v1',
  cc_titulares: 'sm_cc_titulares_v1',
  recebimentos: 'sm_recebimentos_v1',
  importacoes:  'sm_importacoes_v1',  // log de arquivos importados
} as const

export type StoreKey = keyof typeof STORE_KEYS

// ── Leitura ───────────────────────────────────────────────────────────────────

export function getStore<T>(key: string, fallback: T[] = []): T[] {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T[]
  } catch {
    return fallback
  }
}

export function getStoreObj<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// ── Escrita ───────────────────────────────────────────────────────────────────

export function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    console.warn('store: localStorage write failed for', key)
  }
}

export function setStoreObj<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    console.warn('store: localStorage write failed for', key)
  }
}

// ── Merge (upsert por id/codigo) ──────────────────────────────────────────────

export function upsertStore<T extends { id?: string; codigo?: string }>(
  key: string,
  incoming: T[],
  idField: keyof T = 'id' as keyof T
): { inserted: number; updated: number } {
  const existing = getStore<T>(key)
  const map = new Map<unknown, T>()
  for (const item of existing) map.set(item[idField], item)

  let inserted = 0, updated = 0
  for (const item of incoming) {
    if (map.has(item[idField])) updated++
    else inserted++
    map.set(item[idField], item)
  }

  setStore(key, Array.from(map.values()))
  return { inserted, updated }
}

// ── Limpar ────────────────────────────────────────────────────────────────────

export function clearStore(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export function clearAllStores(): void {
  if (typeof window === 'undefined') return
  Object.values(STORE_KEYS).forEach(k => localStorage.removeItem(k))
}

// ── Log de importações ────────────────────────────────────────────────────────

export interface ImportacaoLog {
  id: string
  arquivo: string
  tipo: 'CWR' | 'DSP_TXT' | 'XLSX' | 'outro'
  data: string
  obras_importadas: number
  titulares_importados: number
  total_valor?: number
  status: 'sucesso' | 'parcial' | 'erro'
  detalhes?: string
  /** Códigos das obras importadas neste arquivo — usado para deletar seletivamente */
  codigos_obras?: string[]
}

export function registrarImportacao(log: Omit<ImportacaoLog, 'id' | 'data'>): string {
  const logs = getStore<ImportacaoLog>(STORE_KEYS.importacoes)
  const id = `imp-${Date.now()}`
  const novo: ImportacaoLog = { ...log, id, data: new Date().toISOString() }
  setStore(STORE_KEYS.importacoes, [novo, ...logs])
  return id
}

/** Remove o log de importação e todas as obras/titulares/gravações associadas do localStorage */
export function deleteImportacao(importId: string): { obras_removidas: number } {
  const logs = getStore<ImportacaoLog>(STORE_KEYS.importacoes)
  const entry = logs.find(l => l.id === importId)
  const codigosRemover = new Set(entry?.codigos_obras ?? [])

  setStore(STORE_KEYS.importacoes, logs.filter(l => l.id !== importId))

  if (codigosRemover.size === 0) return { obras_removidas: 0 }

  // Remover obras
  const obras = getStore<{ codigo?: string; id?: string }>(STORE_KEYS.obras)
  const obrasRestantes = obras.filter(o => !codigosRemover.has(o.codigo ?? ''))
  setStore(STORE_KEYS.obras, obrasRestantes)

  // Remover titulares vinculados
  const titulares = getStore<{ obra_codigo?: string }>(STORE_KEYS.titulares)
  setStore(STORE_KEYS.titulares, titulares.filter(t => !codigosRemover.has(t.obra_codigo ?? '')))

  // Remover gravações vinculadas
  const gravacoes = getStore<{ obra_codigo?: string }>(STORE_KEYS.gravacoes)
  setStore(STORE_KEYS.gravacoes, gravacoes.filter(g => !codigosRemover.has(g.obra_codigo ?? '')))

  return { obras_removidas: obras.length - obrasRestantes.length }
}

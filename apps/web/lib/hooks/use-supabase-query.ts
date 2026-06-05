/**
 * useSupabaseQuery — hook genérico para leitura de tabelas Supabase
 * com fallback automático para localStorage (store) durante a migração.
 *
 * Uso:
 *   const { data: obras, loading } = useSupabaseQuery<Obra>({
 *     table: 'obras',
 *     storeKey: STORE_KEYS.obras,
 *     fallback: MOCK_OBRAS,
 *   })
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStore } from '@/lib/store'

interface UseSupabaseQueryOptions<T> {
  table: string
  storeKey?: string
  fallback?: T[]
  select?: string
  filter?: Record<string, unknown>
  orderBy?: { column: string; ascending?: boolean }
  enabled?: boolean
}

interface UseSupabaseQueryResult<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
  source: 'supabase' | 'store' | 'mock'
}

export function useSupabaseQuery<T>(
  options: UseSupabaseQueryOptions<T>
): UseSupabaseQueryResult<T> {
  const {
    table,
    storeKey,
    fallback = [],
    select = '*',
    filter,
    orderBy,
    enabled = true,
  } = options

  const [data, setData] = useState<T[]>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'supabase' | 'store' | 'mock'>('mock')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      // 1. Tenta Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        try {
          const supabase = createClient()
          let query = supabase.from(table).select(select)

          if (filter) {
            Object.entries(filter).forEach(([col, val]) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              query = (query as any).eq(col, val)
            })
          }
          if (orderBy) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            query = (query as any).order(orderBy.column, {
              ascending: orderBy.ascending ?? true,
            }) as typeof query
          }

          const { data: rows, error: sbErr } = await query

          // Supabase respondeu sem erro → confiar no resultado, mesmo que seja array vazio.
          // Nunca substituir resultado real do banco por mock/localStorage quando a query foi bem-sucedida.
          if (!sbErr && rows !== null && !cancelled) {
            let merged: T[] = rows as T[]

            // Enriquecer rows do Supabase com campos computados do store (_links, etc.)
            // sem substituir nem adicionar itens extras do localStorage.
            if (storeKey && (rows as any[]).length > 0) {
              try {
                const stored = getStore<T>(storeKey)
                if (stored.length > 0) {
                  const storeMap = new Map<string, any>()
                  for (const s of stored as any[]) {
                    if (s.codigo)      storeMap.set(String(s.codigo), s)
                    if (s.codigo_obra) storeMap.set(String(s.codigo_obra), s)
                    if (s.id)          storeMap.set(String(s.id), s)
                  }

                  const enriched = (rows as any[]).map(r => {
                    const local = storeMap.get(String(r.codigo ?? r.codigo_obra ?? r.id))
                    if (!local) return r
                    const patch: Record<string, unknown> = {}
                    for (const k of ['_links', '_links_count', '_percentual_controlado',
                                     '_performers', '_isrcs'] as const) {
                      if (local[k] !== undefined && r[k] === undefined) patch[k] = local[k]
                    }
                    return Object.keys(patch).length ? { ...r, ...patch } : r
                  })
                  merged = enriched as T[]
                }
              } catch { /* silencioso */ }
            }

            setData(merged)
            setSource('supabase')
            setLoading(false)
            return
          }

          // Supabase retornou erro → logar e cair no fallback
          if (sbErr) {
            console.warn(`[useSupabaseQuery] erro Supabase em "${table}":`, sbErr.message)
          }
        } catch {
          // Supabase indisponível — fallback para store
        }
      }

      // 2. Fallback: localStorage store
      if (storeKey) {
        try {
          const stored = getStore<T>(storeKey)
          if (stored.length > 0 && !cancelled) {
            setData(stored)
            setSource('store')
            setLoading(false)
            return
          }
        } catch { /* silencioso */ }
      }

      // 3. Fallback final: mock
      if (!cancelled) {
        setData(fallback)
        setSource('mock')
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [table, storeKey, select, enabled, tick]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    refetch: () => setTick(t => t + 1),
    source,
  }
}

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

          // Supabase retornou dados — mescla com localStorage para não perder
          // itens importados localmente (ex: CWR importado mas não salvo no Supabase).
          if (!sbErr && rows && rows.length > 0 && !cancelled) {
            let merged: T[] = rows as T[]
            if (storeKey) {
              try {
                const stored = getStore<T>(storeKey)
                if (stored.length > 0) {
                  // Deduplication: prefere Supabase; adiciona itens do store
                  // que não existam no Supabase (por id OU codigo OU codigo_obra)
                  const sbKeys = new Set<string>()
                  for (const r of rows as any[]) {
                    if (r.id) sbKeys.add(String(r.id))
                    if (r.codigo) sbKeys.add(String(r.codigo))
                    if (r.codigo_obra) sbKeys.add(String(r.codigo_obra))
                  }
                  const extra = stored.filter((s: any) => {
                    const sid   = s.id ? String(s.id) : null
                    const scod  = s.codigo ? String(s.codigo) : null
                    const scob  = s.codigo_obra ? String(s.codigo_obra) : null
                    return (
                      (!sid  || !sbKeys.has(sid)) &&
                      (!scod || !sbKeys.has(scod)) &&
                      (!scob || !sbKeys.has(scob))
                    )
                  })
                  if (extra.length > 0) {
                    merged = [...(rows as T[]), ...extra]
                  }
                }
              } catch { /* silencioso */ }
            }
            setData(merged)
            setSource('supabase')
            setLoading(false)
            return
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

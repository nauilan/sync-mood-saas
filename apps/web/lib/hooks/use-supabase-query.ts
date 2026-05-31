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

          if (!sbErr && rows && !cancelled) {
            setData(rows as T[])
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

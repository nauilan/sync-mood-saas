'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type UsuarioLogado = {
  id: string
  email: string
  nome: string
  role: 'master' | 'admin' | 'editora_administrada' | 'autor' | 'financeiro' | 'juridico' | 'atendimento'
  tenant_id: string
  titular_id: string | null
  editora_id: string | null
  auth_user_id: string
}

interface UseCurrentUserResult {
  user: UsuarioLogado | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<UsuarioLogado | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      // Supabase pode estar sem as tabelas ainda (fase de migração)
      try {
        const { data: usuario } = await supabase
          .from('usuarios')
          .select('id, nome, role, tenant_id, titular_id, editora_id')
          .eq('auth_user_id', authUser.id)
          .single() as { data: Omit<UsuarioLogado,'email'|'auth_user_id'> | null; error: unknown }

        if (usuario) {
          setUser({
            ...usuario,
            email: authUser.email ?? '',
            auth_user_id: authUser.id,
          } as UsuarioLogado)
        } else {
          // Usuário autenticado mas sem registro na tabela usuarios ainda
          setUser({
            id: authUser.id,
            email: authUser.email ?? '',
            nome: authUser.user_metadata?.nome ?? authUser.email ?? '',
            role: authUser.user_metadata?.user_role ?? 'master',
            tenant_id: authUser.user_metadata?.tenant_id ?? '',
            titular_id: null,
            editora_id: null,
            auth_user_id: authUser.id,
          })
        }
      } catch {
        // Tabela usuarios ainda não existe — modo de migração
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          nome: authUser.user_metadata?.nome ?? authUser.email ?? '',
          role: authUser.user_metadata?.user_role ?? 'master',
          tenant_id: authUser.user_metadata?.tenant_id ?? '',
          titular_id: null,
          editora_id: null,
          auth_user_id: authUser.id,
        })
      }

      setLoading(false)
    }

    loadUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return { user, loading, signOut }
}

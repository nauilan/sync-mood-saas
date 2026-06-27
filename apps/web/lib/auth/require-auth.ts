/**
 * requireAuthUser — utilitário centralizado de autenticação para rotas de API.
 *
 * REGRA DE OURO: nenhuma rota sensível deve fazer query sem passar por esta função.
 * O tenant_id SEMPRE vem do usuário autenticado no servidor — nunca do body/query da requisição.
 *
 * Uso:
 *   const { usuario, sb } = await requireAuthUser(request)
 *   // usuario.tenant_id já está disponível e validado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

export interface AuthUser {
  auth_user_id: string
  tenant_id:    string
  role:         string
  id:           string
}

export interface RequireAuthResult {
  usuario: AuthUser
  sb:      ReturnType<typeof createAdminClient>
}

function createAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL  ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) throw new Error('Supabase env vars not set')
  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Valida o JWT do header Authorization, busca tenant_id e role do usuário.
 * Lança NextResponse 401 se não autenticado, 403 se não encontrado no banco.
 */
export async function requireAuthUser(
  request: NextRequest
): Promise<RequireAuthResult> {
  const sb = createAdminClient()

  // 1. Validar JWT via Supabase Auth
  const authHeader = request.headers.get('Authorization') ?? ''
  const token      = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  if (!token) {
    throw Object.assign(
      NextResponse.json({ error: 'Não autenticado' }, { status: 401 }),
      { isAuthError: true }
    )
  }

  const { data: { user }, error: authError } = await sb.auth.getUser(token)

  if (authError || !user) {
    throw Object.assign(
      NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 }),
      { isAuthError: true }
    )
  }

  // 2. Buscar tenant_id do banco — nunca aceitar do cliente
  const { data: usuario, error: userError } = await sb
    .from('usuarios')
    .select('id, tenant_id, role, auth_user_id')
    .eq('auth_user_id', user.id)
    .single()

  if (userError || !usuario) {
    throw Object.assign(
      NextResponse.json({ error: 'Usuário não encontrado no sistema' }, { status: 403 }),
      { isAuthError: true }
    )
  }

  if (!(usuario as any).tenant_id) {
    throw Object.assign(
      NextResponse.json({ error: 'Usuário sem tenant associado' }, { status: 403 }),
      { isAuthError: true }
    )
  }

  return {
    usuario: usuario as AuthUser,
    sb,
  }
}

/**
 * Wrapper para uso com try/catch em rotas.
 * Retorna null se autenticado, ou NextResponse de erro.
 *
 * Uso:
 *   const auth = await tryRequireAuthUser(request)
 *   if (auth instanceof NextResponse) return auth
 *   const { usuario, sb } = auth
 */
export async function tryRequireAuthUser(
  request: NextRequest
): Promise<RequireAuthResult | NextResponse> {
  try {
    return await requireAuthUser(request)
  } catch (e: any) {
    if (e?.isAuthError && e instanceof NextResponse) return e
    return NextResponse.json({ error: 'Erro de autenticação' }, { status: 401 })
  }
}

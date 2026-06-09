import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY    = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

const ROLE_HOME: Record<string, string> = {
  master:               '/master/dashboard',
  admin:                '/master/dashboard',
  super_admin:          '/master/dashboard',
  editora_administrada: '/master/dashboard',
  financeiro:           '/master/dashboard',
  juridico:             '/master/dashboard',
  atendimento:          '/master/dashboard',
  autor:                '/portal/dashboard',
  titular:              '/titular/dashboard',
  editora:              '/editora/dashboard',
}

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Configuração ausente.' }, { status: 503 })
  }

  let cpfInput = '', password = ''
  try {
    const body = await req.json()
    // Aceita tanto { cpf } quanto { email } por compatibilidade com scripts
    const raw = String(body.cpf ?? body.email ?? '').trim()
    cpfInput  = raw.replace(/\D/g, '')  // extrai só dígitos
    password  = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 })
  }

  if (cpfInput.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido. Informe os 11 dígitos.' }, { status: 400 })
  }

  const email = `${cpfInput}@syncmood.app`

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() { return req.cookies.getAll() },
      setAll(list) {
        list.forEach(({ name, value, options }) => cookiesToSet.push({ name, value, options }))
      },
    },
  })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
  if (authError || !authData.session) {
    return NextResponse.json({ error: 'CPF ou senha incorretos.' }, { status: 401 })
  }

  // Verifica ativo + obtém role do banco
  let role = 'master'
  try {
    const { data: rows } = await supabase
      .from('usuarios')
      .select('role, ativo')
      .eq('auth_user_id', authData.user.id)
      .limit(1)
    if (Array.isArray(rows) && rows[0]) {
      if (rows[0].ativo === false) {
        return NextResponse.json({ error: 'Usuário bloqueado. Contate o administrador.' }, { status: 403 })
      }
      if (rows[0].role) role = rows[0].role
    }
  } catch { /* fallback master */ }

  const redirectTo = ROLE_HOME[role] ?? '/master/dashboard'

  const res = NextResponse.json({
    access_token:  authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    user:          authData.user,
    role,
    redirectTo,
  }, { headers: { 'Cache-Control': 'no-store, no-cache, private' } })

  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  })

  return res
}

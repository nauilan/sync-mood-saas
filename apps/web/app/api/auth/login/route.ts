import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

const ROLE_HOME: Record<string, string> = {
  master:               '/master/dashboard',
  admin:                '/master/dashboard',
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

  let cpf = '', password = ''
  try {
    const body = await req.json()
    cpf      = String(body.cpf      ?? '').replace(/\D/g, '')
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
  }

  // Resposta mutável para @supabase/ssr escrever os cookies
  const response = NextResponse.json({}) // placeholder — substituído abaixo

  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(list) {
        list.forEach(({ name, value, options }) => {
          cookiesToSet.push({ name, value, options })
        })
      },
    },
  })

  const email = `${cpf}@syncmood.app`
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.session) {
    return NextResponse.json({ error: 'CPF ou senha incorretos.' }, { status: 401 })
  }

  // Busca role
  let role = 'master'
  try {
    const { data: rows } = await supabase
      .from('usuarios')
      .select('role')
      .eq('auth_user_id', authData.user.id)
      .limit(1)
    if (Array.isArray(rows) && rows[0]?.role) role = rows[0].role
  } catch { /* usa master como padrão */ }

  const redirectTo = ROLE_HOME[role] ?? '/master/dashboard'

  const res = NextResponse.json({
    access_token:  authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    user:          authData.user,
    role,
    redirectTo,
  }, {
    headers: { 'Cache-Control': 'no-store, no-cache, private' },
  })

  // Aplica todos os cookies que o @supabase/ssr montou (formato correto)
  cookiesToSet.forEach(({ name, value, options }) => {
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  })

  return res
}

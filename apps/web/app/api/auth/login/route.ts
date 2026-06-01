import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Strip BOM (U+FEFF) and whitespace that PowerShell/Windows may inject into env vars
const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL  = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL  ?? process.env.SUPABASE_URL)
const ANON_KEY      = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json(
      { error: `Configuração ausente: URL=${!!SUPABASE_URL} KEY=${!!ANON_KEY}` },
      { status: 503 }
    )
  }

  let cpf = '', password = ''
  try {
    const body = await req.json()
    cpf = String(body.cpf ?? '').replace(/\D/g, '')
    password = String(body.password ?? '')
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  const email = `${cpf}@syncmood.app`

  // 1. Auth no Supabase via SSR client (seta cookies automaticamente na resposta)
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = []

  const response = NextResponse.json({ ok: false }) // placeholder
  const supabase = createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        cookies.forEach(c => cookiesToSet.push(c))
      },
    },
  })

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.session) {
    return NextResponse.json(
      { error: 'CPF ou senha incorretos.' },
      { status: 401 }
    )
  }

  // 2. Busca role na tabela usuarios
  let role = 'master'
  try {
    const usersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?auth_user_id=eq.${authData.user.id}&select=role&limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      }
    )
    const users = await usersResp.json()
    if (Array.isArray(users) && users[0]?.role) role = users[0].role
  } catch {
    // não fatal
  }

  // 3. Monta resposta com cookies de sessão + JSON
  const defaultRoutes: Record<string, string> = {
    master: '/master/dashboard',
    admin: '/master/dashboard',
    editora_administrada: '/master/dashboard',
    financeiro: '/master/dashboard',
    juridico: '/master/dashboard',
    atendimento: '/master/dashboard',
    autor: '/portal/dashboard',
    titular: '/titular/dashboard',
    editora: '/editora/dashboard',
  }
  const redirectTo = defaultRoutes[role] ?? '/master/dashboard'

  const finalResponse = NextResponse.json({
    access_token: authData.session.access_token,
    refresh_token: authData.session.refresh_token,
    user: authData.user,
    role,
    redirectTo,
  })

  // Propagar cookies de sessão do Supabase SSR para o browser
  cookiesToSet.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2])
  })

  return finalResponse
}

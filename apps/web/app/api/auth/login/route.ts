import { NextRequest, NextResponse } from 'next/server'

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

  // 1. Auth no Supabase (server → sem CORS)
  let authResp: Response
  try {
    authResp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    return NextResponse.json(
      { error: `Falha ao conectar Supabase Auth: ${String(err)}` },
      { status: 502 }
    )
  }

  const authData = await authResp.json()

  if (!authResp.ok || !authData.access_token) {
    return NextResponse.json(
      { error: authData.error_description ?? authData.message ?? 'CPF ou senha incorretos.' },
      { status: 401 }
    )
  }

  // 2. Busca role
  let role = 'autor'
  try {
    const usersResp = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?auth_user_id=eq.${authData.user.id}&select=role&limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${authData.access_token}`,
        },
      }
    )
    const users = await usersResp.json()
    if (Array.isArray(users) && users[0]?.role) role = users[0].role
  } catch {
    // não fatal: usa role padrão 'autor'
  }

  return NextResponse.json({
    access_token:  authData.access_token,
    refresh_token: authData.refresh_token,
    user:          authData.user,
    role,
  })
}

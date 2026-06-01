import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

// Nome do cookie que @supabase/ssr espera no browser
function cookieName(url: string) {
  const ref = new URL(url).hostname.split('.')[0]
  return `sb-${ref}-auth-token`
}

export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: `Config ausente` }, { status: 503 })
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

  // 1. Auth no Supabase
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
    return NextResponse.json({ error: `Falha Supabase: ${String(err)}` }, { status: 502 })
  }

  const authData = await authResp.json()
  if (!authResp.ok || !authData.access_token) {
    return NextResponse.json({ error: 'CPF ou senha incorretos.' }, { status: 401 })
  }

  // 2. Busca role
  let role = 'master'
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?auth_user_id=eq.${authData.user.id}&select=role&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${authData.access_token}` } }
    )
    const rows = await r.json()
    if (Array.isArray(rows) && rows[0]?.role) role = rows[0].role
  } catch { /* usa master como padrão */ }

  const ROLE_HOME: Record<string, string> = {
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
  const redirectTo = ROLE_HOME[role] ?? '/master/dashboard'

  // 3. Monta sessão no formato @supabase/ssr
  const sessionPayload = JSON.stringify({
    access_token:  authData.access_token,
    refresh_token: authData.refresh_token,
    expires_in:    authData.expires_in ?? 3600,
    expires_at:    authData.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
    token_type:    'bearer',
    user:          authData.user,
  })

  const ck = cookieName(SUPABASE_URL)
  const CHUNK = 3180
  const chunks = []
  for (let i = 0; i * CHUNK < sessionPayload.length; i++) {
    chunks.push(sessionPayload.slice(i * CHUNK, (i + 1) * CHUNK))
  }

  const response = NextResponse.json({
    access_token:  authData.access_token,
    refresh_token: authData.refresh_token,
    user:          authData.user,
    role,
    redirectTo,
  })

  const cookieOpts = {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: authData.expires_in ?? 3600,
    httpOnly: false,
  }

  if (chunks.length === 1) {
    response.cookies.set(ck, chunks[0], cookieOpts)
  } else {
    chunks.forEach((chunk, i) => {
      response.cookies.set(`${ck}.${i}`, chunk, cookieOpts)
    })
    // Remove cookie sem índice se existir
    response.cookies.delete(ck)
  }

  return response
}

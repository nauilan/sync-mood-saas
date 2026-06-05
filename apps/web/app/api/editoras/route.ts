import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  // Supabase chunked cookie: sb-xxx-auth-token.0, .1, ...
  const chunks: string[] = []
  for (let i = 0; i < 10; i++) {
    const name = i === 0 ? 'sb-auth-token' : `sb-auth-token.${i}`
    // Try both patterns
    for (const c of req.cookies.getAll()) {
      if (c.name.endsWith(`auth-token.${i}`) || (i === 0 && c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/))) {
        chunks[i] = c.value
        break
      }
    }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  // Fallback: find any auth-token cookie
  for (const c of req.cookies.getAll()) {
    if (c.name.includes('auth-token') && !c.name.includes('.')) {
      try { const p = JSON.parse(decodeURIComponent(c.value)); if (p?.access_token) return p.access_token } catch { /* */ }
    }
  }
  return ANON_KEY
}

// GET /api/editoras — lista editoras ativas do tenant autenticado
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }
  const token = getToken(req)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'ativo'

  let qs = `select=id,nome_fantasia,razao_social,cnpj&order=nome_fantasia.asc`
  if (status && status !== 'todos') qs += `&status=eq.${status}`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/editoras?${qs}`, {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  return NextResponse.json({ editoras: data })
}

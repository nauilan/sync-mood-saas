import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookies = req.cookies.getAll()
  for (const cookie of cookies) {
    if (cookie.name.includes('auth-token') && !cookie.name.includes('.')) return tryExtractToken(cookie.value)
    if (cookie.name.includes('auth-token.0')) return tryExtractToken(cookie.value)
  }
  return null
}

function tryExtractToken(raw: string): string | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    return parsed?.access_token ?? null
  } catch { return null }
}

// ── GET /api/contratos/[id] ─────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY
  const { id } = await params

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/contratos?id=eq.${id}&select=*&limit=1`,
      {
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    const row = Array.isArray(data) ? data[0] : null
    if (!row) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })
    return NextResponse.json({ contrato: row })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── PATCH /api/contratos/[id] ───────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/contratos?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
      }
    )
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json({ contrato: Array.isArray(data) ? data[0] : data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

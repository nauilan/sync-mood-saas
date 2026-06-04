import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  for (const c of req.cookies.getAll()) {
    if (c.name.includes('auth-token') && !c.name.includes('.')) {
      try { const p = JSON.parse(decodeURIComponent(c.value)); if (p?.access_token) return p.access_token } catch { /* */ }
    }
  }
  return ANON_KEY
}

// ── GET /api/negocios-editoriais/[id] ────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!SUPABASE_URL || !ANON_KEY) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const { id } = await params
  const token = getToken(req)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/negocios_editoriais?id=eq.${id}&select=*`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  const row = Array.isArray(data) ? data[0] : null
  if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ negocio: row })
}

// ── PUT /api/negocios-editoriais/[id] ────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!SUPABASE_URL || !ANON_KEY) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const { id } = await params
  const token = getToken(req)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Re-valida percentuais se ambos foram enviados
  if (body.percentual_administrada !== undefined && body.percentual_administradora !== undefined) {
    const soma = Number(body.percentual_administrada) + Number(body.percentual_administradora)
    if (Math.round(soma * 10000) !== 1000000) {
      return NextResponse.json({ error: 'Percentuais devem somar exatamente 100%' }, { status: 400 })
    }
  }

  // Remove campos não-editáveis
  const { id: _id, tenant_id: _t, created_at: _c, ...patch } = body as any

  const res = await fetch(`${SUPABASE_URL}/rest/v1/negocios_editoriais?id=eq.${id}`, {
    method: 'PATCH',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(patch),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  return NextResponse.json({ negocio: Array.isArray(data) ? data[0] : data })
}

// ── DELETE /api/negocios-editoriais/[id] ─────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!SUPABASE_URL || !ANON_KEY) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const { id } = await params
  const token = getToken(req)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/negocios_editoriais?id=eq.${id}`, {
    method: 'DELETE',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    const data = await res.json()
    return NextResponse.json({ error: data }, { status: res.status })
  }
  return NextResponse.json({ ok: true })
}

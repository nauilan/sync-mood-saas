import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const chunks: string[] = []
  for (const c of req.cookies.getAll()) {
    const m = c.name.match(/auth-token\.(\d+)$/)
    if (m) { chunks[parseInt(m[1])] = c.value; continue }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch { /* */ }
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch { /* */ }
  }
  return ANON_KEY
}

export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }
  const token = getToken(req)

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!authRes.ok) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const authUser = await authRes.json()

  const key = SERVICE_KEY || ANON_KEY
  const usrRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=tenant_id,nome,role,editora_id&auth_user_id=eq.${authUser.id}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const usrData = await usrRes.json()
  const usuario = Array.isArray(usrData) ? usrData[0] : null

  let tenantNome: string | null = null
  if (usuario?.tenant_id) {
    const tenantRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tenants?select=nome&id=eq.${usuario.tenant_id}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    )
    const tenantData = await tenantRes.json()
    tenantNome = Array.isArray(tenantData) && tenantData[0]?.nome ? tenantData[0].nome : null
  }

  return NextResponse.json({
    auth_user_id:  authUser.id,
    email:         authUser.email,
    tenant_id:     usuario?.tenant_id   ?? null,
    tenant_nome:   tenantNome,
    nome:          usuario?.nome        ?? null,
    role:          usuario?.role        ?? null,
    editora_id:    usuario?.editora_id  ?? null,
  })
}

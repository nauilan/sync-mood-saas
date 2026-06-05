import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

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

async function getTenantId(token: string): Promise<string | null> {
  const key = SERVICE_KEY || ANON_KEY
  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!authRes.ok) return null
  const authUser = await authRes.json()
  const usrRes = await fetch(
    `${SUPABASE_URL}/rest/v1/usuarios?select=tenant_id&auth_user_id=eq.${authUser.id}&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  )
  const usrData = await usrRes.json()
  const usuario = Array.isArray(usrData) ? usrData[0] : null
  return usuario?.tenant_id ?? null
}

// GET /api/editoras — lista editoras do tenant autenticado
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }
  const token = getToken(req)
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'ativo'

  let qs = `select=id,nome_fantasia,razao_social,cnpj,tipo_editora,controlada,status,codigo_publisher_cwr,created_at&order=nome_fantasia.asc`
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

// POST /api/editoras — cria nova editora para o tenant autenticado
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }
  const token = getToken(req)
  const tenant_id = await getTenantId(token)
  if (!tenant_id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { nome_fantasia, razao_social, cnpj, tipo_editora, controlada, codigo_publisher_cwr } = body

  if (!nome_fantasia?.trim() || !razao_social?.trim()) {
    return NextResponse.json({ error: 'nome_fantasia e razao_social são obrigatórios' }, { status: 400 })
  }

  const key = SERVICE_KEY || ANON_KEY
  const payload = {
    tenant_id,
    nome_fantasia: nome_fantasia.trim(),
    razao_social: razao_social.trim(),
    cnpj: cnpj?.trim() || null,
    tipo_editora: tipo_editora ?? 'administrada',
    controlada: controlada ?? false,
    codigo_publisher_cwr: codigo_publisher_cwr?.trim() || null,
    status: 'ativo',
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/editoras`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  const editora = Array.isArray(data) ? data[0] : data
  return NextResponse.json({ editora }, { status: 201 })
}

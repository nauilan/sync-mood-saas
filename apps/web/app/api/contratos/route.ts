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
  } catch {
    return null
  }
}

// ── GET /api/contratos ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY
  const { searchParams } = new URL(req.url)
  const tipo   = searchParams.get('tipo')
  const status = searchParams.get('status')
  const limit  = searchParams.get('limit') ?? '50'
  const offset = searchParams.get('offset') ?? '0'

  let qs = `select=*&order=created_at.desc&limit=${limit}&offset=${offset}`
  if (tipo)   qs += `&tipo=eq.${tipo}`
  if (status) qs += `&status=eq.${status}`

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contratos?${qs}`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'count=exact',
      },
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })

    const totalCount = res.headers.get('content-range')?.split('/')[1] ?? null
    return NextResponse.json({ contratos: data, total: totalCount ? parseInt(totalCount) : data.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/contratos ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY
  if (!token || token === ANON_KEY) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Obter tenant_id do usuário autenticado
  let tenantId: string | null = null
  try {
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/usuarios?auth_user_id=eq.${body.auth_user_id ?? 'INVALID'}&select=tenant_id&limit=1`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } }
    )
    const rows = await userRes.json()
    tenantId = Array.isArray(rows) && rows[0]?.tenant_id ? rows[0].tenant_id : null
  } catch { /* ignorar */ }

  // Montar payload de inserção
  const payload = {
    tenant_id: body.tenant_id ?? tenantId,
    tipo: body.tipo,
    status: body.status ?? 'rascunho',
    numero_contrato: body.numero_contrato ?? null,
    data_inicio: body.data_inicio ?? null,
    data_termino: body.data_termino ?? null,
    renovacao_automatica: body.renovacao_automatica ?? false,
    objeto: body.objeto ?? null,
    percentual_editora: body.percentual_editora ?? null,
    percentual_autor: body.percentual_autor ?? null,
    taxa_administracao: body.taxa_administracao ?? null,
    territorio: body.territorio ?? 'BR',
    moeda: body.moeda ?? 'BRL',
    observacoes: body.observacoes ?? null,
    metadados: body.metadados ?? {},
  }

  if (!payload.tenant_id) {
    return NextResponse.json({ error: 'tenant_id não encontrado' }, { status: 400 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/contratos`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
    return NextResponse.json({ contrato: Array.isArray(data) ? data[0] : data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

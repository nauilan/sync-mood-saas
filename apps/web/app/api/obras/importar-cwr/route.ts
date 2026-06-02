import { NextRequest, NextResponse } from 'next/server'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  const cookies = req.cookies.getAll()
  for (const cookie of cookies) {
    if (cookie.name.includes('auth-token') && !cookie.name.includes('.')) {
      try {
        const p = JSON.parse(decodeURIComponent(cookie.value))
        return p?.access_token ?? null
      } catch { /* ignorar */ }
    }
  }
  return null
}

// ── POST /api/obras/importar-cwr ────────────────────────────────
// Recebe obras+titulares já processados e salva no Supabase com campos legado.
// A lógica principal de parsing roda no client (parseCwr + cwrToStore).
// Esta route apenas faz o upsert server-side como alternativa segura.
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const token = getAuthToken(req) ?? ANON_KEY

  let body: {
    obras: Array<Record<string, unknown>>
    titulares: Array<Record<string, unknown>>
    tenant_id?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  let tenantId = body.tenant_id ?? null

  // Resolver tenant_id se não veio
  if (!tenantId && token !== ANON_KEY) {
    try {
      const userInfo = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString()
      )
      const userId = userInfo.sub
      if (userId) {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/usuarios?auth_user_id=eq.${userId}&select=tenant_id&limit=1`,
          { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } }
        )
        const rows = await r.json()
        tenantId = rows?.[0]?.tenant_id ?? null
      }
    } catch { /* ignorar */ }
  }

  if (!tenantId) {
    // Fallback: primeiro tenant (dev/demo)
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/tenants?select=id&limit=1`,
        { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } }
      )
      const rows = await r.json()
      tenantId = rows?.[0]?.id ?? null
    } catch { /* ignorar */ }
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 400 })
  }

  const result = {
    obras_saved: 0,
    titulares_saved: 0,
    errors: [] as string[],
  }

  // Upsert titulares
  if (body.titulares?.length > 0) {
    const titData = body.titulares.map((t: Record<string, unknown>) => ({
      tenant_id: tenantId,
      tipo: t.tipo === 'pessoa_juridica' ? 'editora' : 'autor',
      nome_completo: t.nome,
      pessoa: t.tipo === 'pessoa_juridica' ? 'PJ' : 'PF',
      ipi: t.ipi ?? null,
      codigo_ipi: t.ipi ?? null,
      status: 'ativo',
      codigo_interno_legado: t.codigo_interno_legado ?? null,
      codigo_sequence_cwr: t.codigo_sequence_cwr ?? null,
      origem_importacao: 'cwr',
    }))

    const tRes = await fetch(`${SUPABASE_URL}/rest/v1/titulares`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=ignore-duplicates,count=exact',
      },
      body: JSON.stringify(titData),
    })
    if (!tRes.ok) {
      const err = await tRes.json()
      result.errors.push(`Titulares: ${JSON.stringify(err)}`)
    } else {
      result.titulares_saved = titData.length
    }
  }

  // Upsert obras
  if (body.obras?.length > 0) {
    const obrasData = body.obras.map((o: Record<string, unknown>) => ({
      tenant_id: tenantId,
      titulo: o.titulo,
      titulo_alternativo: o.titulo_original ?? null,
      iswc: o.iswc ?? null,
      idioma: o.idioma ?? 'PT',
      status: 'ativa',
      codigo_obra: o.codigo,
      origem_cadastro: 'migracao',
      status_iswc: o.iswc ? 'recebido' : 'pendente',
      codigo_interno_legado: o.codigo_interno_legado ?? o.codigo ?? null,
      codigo_obra_cwr_original: o.codigo_obra_cwr_original ?? o.codigo ?? null,
      backoffice_status: 'nao_enviada',
      origem_importacao: 'cwr',
    }))

    const oRes = await fetch(`${SUPABASE_URL}/rest/v1/obras`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(obrasData),
    })
    const oData = await oRes.json()
    if (!oRes.ok) {
      result.errors.push(`Obras: ${JSON.stringify(oData)}`)
    } else {
      result.obras_saved = Array.isArray(oData) ? oData.length : obrasData.length
    }
  }

  return NextResponse.json(result, {
    status: result.errors.length === 0 ? 200 : 207,
  })
}

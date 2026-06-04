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

// ── GET /api/negocios-editoriais ─────────────────────────────────
export async function GET(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const token = getToken(req)
  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const administrada = searchParams.get('editora_administrada_id')
  const limit        = searchParams.get('limit') ?? '100'
  const offset       = searchParams.get('offset') ?? '0'

  let qs = `select=*&order=created_at.desc&limit=${limit}&offset=${offset}`
  if (status)       qs += `&status=eq.${status}`
  if (administrada) qs += `&editora_administrada_id=eq.${administrada}`

  const res = await fetch(`${SUPABASE_URL}/rest/v1/negocios_editoriais?${qs}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'count=exact' },
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  const total = res.headers.get('content-range')?.split('/')[1] ?? null
  return NextResponse.json({ negocios: data, total: total ? parseInt(total) : data.length })
}

// ── POST /api/negocios-editoriais ────────────────────────────────
export async function POST(req: NextRequest) {
  if (!SUPABASE_URL || !ANON_KEY) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const token = getToken(req)

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Validações obrigatórias
  if (!body.editora_administrada_id)   return NextResponse.json({ error: 'editora_administrada_id obrigatório' }, { status: 400 })
  if (!body.editora_administradora_id) return NextResponse.json({ error: 'editora_administradora_id obrigatório' }, { status: 400 })
  if (!body.data_inicio)               return NextResponse.json({ error: 'data_inicio obrigatório' }, { status: 400 })

  const pAdm  = Number(body.percentual_administrada  ?? 0)
  const pAdmR = Number(body.percentual_administradora ?? 0)
  if (Math.round((pAdm + pAdmR) * 10000) !== 1000000) {
    return NextResponse.json({ error: 'Percentuais devem somar exatamente 100%' }, { status: 400 })
  }

  const payload = {
    tenant_id:                 body.tenant_id,
    nome:                      body.nome ?? `Negócio ${new Date().toLocaleDateString('pt-BR')}`,
    codigo_interno:            body.codigo_interno ?? null,
    status:                    body.status ?? 'ativo',
    editora_administrada_id:   body.editora_administrada_id,
    editora_administrada_nome: body.editora_administrada_nome ?? null,
    editora_administradora_id: body.editora_administradora_id,
    editora_administradora_nome: body.editora_administradora_nome ?? null,
    percentual_administrada:   pAdm,
    percentual_administradora: pAdmR,
    receitas_aplicaveis:       body.receitas_aplicaveis ?? ['digital','sync','mecanico','internacional','licenciamento'],
    abrangencia_tipo:          body.abrangencia_tipo ?? 'catalogo_inteiro',
    abrangencia_ids:           body.abrangencia_ids ?? [],
    territorios:               body.territorios ?? ['mundial'],
    data_inicio:               body.data_inicio,
    data_fim:                  body.data_fim ?? null,
    contrato_url:              body.contrato_url ?? null,
    contrato_nome_arquivo:     body.contrato_nome_arquivo ?? null,
    observacoes:               body.observacoes ?? null,
  }

  if (!payload.tenant_id) return NextResponse.json({ error: 'tenant_id obrigatório' }, { status: 400 })

  const res = await fetch(`${SUPABASE_URL}/rest/v1/negocios_editoriais`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  return NextResponse.json({ negocio: Array.isArray(data) ? data[0] : data }, { status: 201 })
}

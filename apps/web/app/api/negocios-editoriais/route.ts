import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function autenticar(sb: ReturnType<typeof supabase>, req: NextRequest): Promise<string | null> {
  if (!sb) return null
  const auth = req.headers.get('authorization') ?? ''
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) {
    // Suporte a cookies chunked (sb-xxx-auth-token.0, .1, …)
    const chunks: string[] = []
    for (const c of req.cookies.getAll()) {
      const m = c.name.match(/auth-token\.(\d+)$/)
      if (m) { chunks[parseInt(m[1])] = c.value; continue }
      if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) { chunks[0] = c.value }
    }
    const joined = chunks.filter(Boolean).join('')
    if (joined) {
      try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) token = p.access_token } catch { /* */ }
      if (!token) { try { const p = JSON.parse(joined); if (p?.access_token) token = p.access_token } catch { /* */ } }
    }
  }
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return (usuario as any)?.tenant_id ?? null
}

function buildPayload(body: Record<string, unknown>, tenantId?: string) {
  const pAdm  = Number(body.percentual_administrada  ?? 0)
  const pAdmR = Number(body.percentual_administradora ?? 0)
  return {
    ...(tenantId ? { tenant_id: tenantId } : {}),
    nome:                        body.nome ?? `Negócio ${new Date().toLocaleDateString('pt-BR')}`,
    codigo_interno:              body.codigo_interno ?? null,
    status:                      body.status ?? 'ativo',
    editora_administrada_id:     body.editora_administrada_id,
    editora_administrada_nome:   body.editora_administrada_nome ?? null,
    editora_administradora_id:   body.editora_administradora_id,
    editora_administradora_nome: body.editora_administradora_nome ?? null,
    percentual_administrada:     pAdm,
    percentual_administradora:   pAdmR,
    receitas_aplicaveis:         body.receitas_aplicaveis ?? ['digital','sync','mecanico','internacional','licenciamento'],
    abrangencia_tipo:            body.abrangencia_tipo ?? 'catalogo_inteiro',
    abrangencia_ids:             body.abrangencia_ids ?? [],
    territorios:                 body.territorios ?? ['mundial'],
    data_inicio:                 body.data_inicio,
    data_fim:                    body.data_fim ?? null,
    contrato_url:                body.contrato_url ?? null,
    contrato_nome_arquivo:       body.contrato_nome_arquivo ?? null,
    tipo_direito_id:             body.tipo_direito_id || null,
    observacoes:                 body.observacoes ?? null,
    percentuais_por_receita:     body.percentuais_por_receita ?? null,
  }
}

// ── GET /api/negocios-editoriais ─────────────────────────────────
export async function GET(req: NextRequest) {
  const sb = supabase()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status       = searchParams.get('status')
  const administrada = searchParams.get('editora_administrada_id')
  const limit        = Math.min(Number(searchParams.get('limit') ?? 100), 500)
  const offset       = Math.max(Number(searchParams.get('offset') ?? 0), 0)

  let query = sb
    .from('negocios_editoriais')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status)       query = query.eq('status', status)
  if (administrada) query = query.eq('editora_administrada_id', administrada)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ negocios: data ?? [], total: count ?? 0 })
}

// ── POST /api/negocios-editoriais ────────────────────────────────
export async function POST(req: NextRequest) {
  const sb = supabase()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  if (!body.editora_administrada_id)   return NextResponse.json({ error: 'editora_administrada_id obrigatório' }, { status: 400 })
  if (!body.editora_administradora_id) return NextResponse.json({ error: 'editora_administradora_id obrigatório' }, { status: 400 })
  if (!body.data_inicio)               return NextResponse.json({ error: 'data_inicio obrigatório' }, { status: 400 })

  const pAdm  = Number(body.percentual_administrada  ?? 0)
  const pAdmR = Number(body.percentual_administradora ?? 0)
  if (Math.round((pAdm + pAdmR) * 10000) !== 1000000) {
    return NextResponse.json({ error: 'Percentuais devem somar exatamente 100%' }, { status: 400 })
  }

  const payload = buildPayload(body, tenant_id)
  const { data, error } = await sb.from('negocios_editoriais').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ negocio: data }, { status: 201 })
}

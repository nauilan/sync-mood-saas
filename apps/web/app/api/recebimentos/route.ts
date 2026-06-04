import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(req: NextRequest, sb: any): Promise<{ tenant_id: string; role: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('tenant_id, role').eq('auth_user_id', user.id).single()
  const u = data as { tenant_id: string; role: string } | null
  return u
}

// ── GET /api/recebimentos — listar ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status     = searchParams.get('status')
  const fonte      = searchParams.get('fonte')
  const territorio = searchParams.get('territorio')
  const page       = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const per_page   = Math.min(100, parseInt(searchParams.get('per_page') ?? '50'))
  const offset     = (page - 1) * per_page

  let query = sb
    .from('recebimentos')
    .select(`
      *,
      tipo_direito:tipo_direito_id ( id, codigo, nome )
    `, { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (status)     query = query.eq('status', status)
  if (fonte)      query = query.eq('fonte_pagadora_codigo', fonte)
  if (territorio) query = query.eq('territorio', territorio)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs rápidos
  const { data: kpiData } = await sb
    .from('recebimentos')
    .select('status, valor_bruto, valor_liquido, categoria')
    .eq('tenant_id', usuario.tenant_id)

  const kpis = {
    total:               kpiData?.length ?? 0,
    valor_total_brl:     kpiData?.reduce((s, r) => s + (Number(r.valor_liquido) || 0), 0) ?? 0,
    operacional:         kpiData?.filter(r => r.categoria === 'operacional').length ?? 0,
    informativo:         kpiData?.filter(r => r.categoria === 'informativo').length ?? 0,
    distribuidos:        kpiData?.filter(r => r.status === 'distribuido').length ?? 0,
    pendente_matching:   kpiData?.filter(r => r.status === 'pendente_matching').length ?? 0,
  }

  return NextResponse.json({
    data,
    pagination: { total: count ?? 0, page, per_page },
    kpis,
  })
}

// ── POST /api/recebimentos — criar ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['master', 'admin', 'financeiro'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Campos obrigatórios
  const required = ['obra_id', 'valor_bruto', 'fonte_pagadora_codigo', 'competencia_inicio', 'competencia_fim']
  for (const field of required) {
    if (!body[field]) return NextResponse.json({ error: `Campo obrigatório: ${field}` }, { status: 422 })
  }

  // Gerar código sequencial REC-YYYY-NNN
  const ano = new Date().getFullYear()
  const { count } = await sb
    .from('recebimentos')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', usuario.tenant_id)
    .gte('created_at', `${ano}-01-01`)
  const codigo = `REC-${ano}-${String((count ?? 0) + 1).padStart(3, '0')}`

  const payload = {
    tenant_id:            usuario.tenant_id,
    codigo,
    obra_id:              body.obra_id,
    tipo_direito_id:      body.tipo_direito_id ?? null,
    territorio:           body.territorio ?? 'BR',
    competencia_inicio:   body.competencia_inicio,
    competencia_fim:      body.competencia_fim,
    fonte_pagadora_codigo: body.fonte_pagadora_codigo,
    fonte_pagadora_tipo:  body.fonte_pagadora_tipo ?? null,
    valor_bruto:          Number(body.valor_bruto),
    valor_liquido:        Number(body.valor_liquido ?? body.valor_bruto),
    moeda:                body.moeda ?? 'BRL',
    cotacao_brl:          body.cotacao_brl ? Number(body.cotacao_brl) : null,
    valor_brl:            body.valor_brl ? Number(body.valor_brl) : Number(body.valor_liquido ?? body.valor_bruto),
    categoria:            body.categoria ?? 'operacional',
    status:               'importado',
    observacoes:          body.observacoes ?? null,
  }

  const { data, error } = await sb.from('recebimentos').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}

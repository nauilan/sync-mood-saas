/**
 * GET /api/titulares
 *
 * Lista titulares (autores + editoras) do tenant.
 * Usa service_role para garantir leitura correta com RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Extrai token JWT do header Authorization ou dos cookies Supabase (server-side) */
function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  // Leitura de cookies (server-side) — suporta formato chunked (.0, .1, ...) e formato simples
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
  return ''
}

async function autenticar(sb: any, req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return usuario?.tenant_id ?? null
}

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') ?? ''
  const tipo = searchParams.get('tipo') ?? 'todos'   // autor | editora | todos
  const status = searchParams.get('status') ?? 'todos' // ativo | inativo | todos
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  let query = sb
    .from('titulares')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('nome_completo')
    .range(offset, offset + per_page - 1)

  if (tipo !== 'todos') query = query.eq('tipo', tipo)
  if (status !== 'todos') query = query.eq('status', status)
  if (search) {
    query = query.or(`nome_completo.ilike.%${search}%,codigo_titular.ilike.%${search}%,ipi.ilike.%${search}%`)
  }

  const { data, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs
  const { data: kpiData } = await sb
    .from('titulares')
    .select('tipo, status')
    .eq('tenant_id', tenant_id)

  const totais = {
    total: kpiData?.length ?? 0,
    autores: kpiData?.filter((t: any) => t.tipo === 'autor').length ?? 0,
    editoras: kpiData?.filter((t: any) => t.tipo === 'editora' || t.tipo === 'editora_administrada').length ?? 0,
    ativos: kpiData?.filter((t: any) => t.status === 'ativo').length ?? 0,
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, kpis: totais })
}

export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const nomeCompleto = (body.nome_completo ?? body.nome ?? '').trim()
  if (!nomeCompleto) {
    return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })
  }

  // Código do titular: usa o fornecido (validando unicidade por tenant) ou gera T####
  let codigo_titular: string
  const codigoCustom = (body.codigo_titular ?? '').trim()
  if (codigoCustom) {
    const { count: dupeCount } = await sb
      .from('titulares')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
      .eq('codigo_titular', codigoCustom)
    if ((dupeCount ?? 0) > 0) {
      return NextResponse.json(
        { error: `Código "${codigoCustom}" já está em uso por outro titular neste tenant` },
        { status: 409 }
      )
    }
    codigo_titular = codigoCustom
  } else {
    // Auto-gera sequencial T0001, T0002...
    const { count: total } = await sb
      .from('titulares')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant_id)
    const seq = (total ?? 0) + 1
    codigo_titular = `T${String(seq).padStart(4, '0')}`
  }

  const payload: Record<string, unknown> = {
    tenant_id,
    codigo_titular,
    tipo: body.tipo ?? 'autor',
    pessoa: body.tipo_pessoa ?? body.pessoa ?? 'PF',
    nome_completo: nomeCompleto,
    status: 'ativo',
  }
  if (body.nome_artistico) payload.nome_artistico = body.nome_artistico
  if (body.cpf_cnpj) payload.cpf_cnpj = body.cpf_cnpj
  if (body.ipi) payload.ipi = body.ipi
  if (body.codigo_ipi) payload.codigo_ipi = body.codigo_ipi
  if (body.codigo_cae) payload.codigo_cae = body.codigo_cae

  const { data, error } = await sb.from('titulares').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

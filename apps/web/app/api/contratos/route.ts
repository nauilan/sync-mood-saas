/**
 * GET /api/contratos
 *
 * Lista contratos do tenant com KPIs.
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

async function autenticar(sb: any, req: NextRequest) {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '')
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
  const tipo = searchParams.get('tipo') ?? 'todos'
  const status = searchParams.get('status') ?? 'todos'
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  let query = sb
    .from('contratos')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (tipo !== 'todos') query = query.eq('tipo', tipo)
  if (status !== 'todos') query = query.eq('status', status)
  if (search) {
    query = query.or(`numero.ilike.%${search}%,descricao.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs
  const { data: kpiData } = await sb
    .from('contratos')
    .select('tipo, status, vigencia_fim')
    .eq('tenant_id', tenant_id)

  const hoje = new Date()
  const em30dias = new Date(); em30dias.setDate(em30dias.getDate() + 30)

  const totais = {
    total: kpiData?.length ?? 0,
    em_vigor: kpiData?.filter((c: any) => c.status === 'em_vigor').length ?? 0,
    vencendo: kpiData?.filter((c: any) => {
      if (!c.vigencia_fim) return false
      const fim = new Date(c.vigencia_fim)
      return fim >= hoje && fim <= em30dias
    }).length ?? 0,
    vencidos: kpiData?.filter((c: any) => {
      if (!c.vigencia_fim) return false
      return new Date(c.vigencia_fim) < hoje && c.status !== 'rescindido'
    }).length ?? 0,
    aguardando_assinatura: kpiData?.filter((c: any) => c.status === 'aguardando_assinatura').length ?? 0,
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, kpis: totais })
}

export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await sb
    .from('contratos')
    .insert({ ...body, tenant_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

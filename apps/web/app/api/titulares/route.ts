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

async function autenticar(sb: ReturnType<typeof createClient>, req: NextRequest) {
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
  const tipo = searchParams.get('tipo') ?? 'todos'   // autor | editora | todos
  const status = searchParams.get('status') ?? 'todos' // ativo | inativo | todos
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  let query = sb
    .from('titulares')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('nome')
    .range(offset, offset + per_page - 1)

  if (tipo !== 'todos') query = query.eq('tipo', tipo)
  if (status !== 'todos') query = query.eq('status', status)
  if (search) {
    query = query.or(`nome.ilike.%${search}%,codigo_interno.ilike.%${search}%,ipi.ilike.%${search}%,cae.ilike.%${search}%`)
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

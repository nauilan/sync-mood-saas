/**
 * GET /api/cc-obra
 *
 * Lista contas correntes de obras com saldos e movimentos recentes.
 * Usa service_role para garantir leitura correta mesmo com RLS.
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
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  // Busca cc_obras SEM join — mais confiável no PostgREST
  // Sem range/nullsFirst para evitar edge-cases com campos NULL
  const { data: ccObras, error } = await sb
    .from('cc_obras')
    .select('id, obra_id, saldo_atual, saldo_bloqueado, saldo_distribuido, saldo_pendente, moeda, status, updated_at')
    .eq('tenant_id', tenant_id)
    .order('updated_at', { ascending: false })
    .limit(per_page)

  if (error) {
    console.error('[cc-obra] query error:', error.message, error.code)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const count = ccObras?.length ?? 0

  // IDs das obras retornadas
  const obraIds = (ccObras ?? []).map((c: any) => c.obra_id).filter(Boolean)

  // Busca dados das obras separadamente
  const obrasMap: Map<string, any> = new Map()
  if (obraIds.length > 0) {
    const { data: obras } = await sb
      .from('obras')
      .select('id, titulo, codigo_obra, iswc, status')
      .in('id', obraIds)
    for (const o of obras ?? []) obrasMap.set(o.id, o)
  }

  // Busca movimentos recentes
  const movimentosMap: Map<string, any[]> = new Map()
  if (obraIds.length > 0) {
    const { data: movs } = await sb
      .from('cc_obras_movimentos')
      .select(`
        id, obra_id, tipo, valor, nome_participante, status_movimento,
        territorio, competencia_inicio, competencia_fim,
        recebimento_id, created_at
      `)
      .eq('tenant_id', tenant_id)
      .in('obra_id', obraIds)
      .order('created_at', { ascending: false })
      .limit(obraIds.length * 10)

    for (const mov of movs ?? []) {
      const list = movimentosMap.get(mov.obra_id) ?? []
      if (list.length < 5) {
        list.push(mov)
        movimentosMap.set(mov.obra_id, list)
      }
    }
  }

  // Normaliza — usa obrasMap em vez do join
  const normalized = (ccObras ?? []).map((cc: any) => {
    const obra = obrasMap.get(cc.obra_id)
    return {
      id: cc.id,
      obra_id: cc.obra_id,
      obra_titulo: obra?.titulo ?? '—',
      obra_codigo: obra?.codigo_obra ?? '—',
      obra_iswc: obra?.iswc ?? null,
      saldo_atual: Number(cc.saldo_atual ?? 0),
      saldo_bloqueado: Number(cc.saldo_bloqueado ?? 0),
      saldo_distribuido: Number(cc.saldo_distribuido ?? 0),
      saldo_pendente: Number(cc.saldo_pendente ?? 0),
      data_ultima_movimentacao: cc.updated_at ?? null,
      movimentos: movimentosMap.get(cc.obra_id) ?? [],
    }
  })

  // Filtro por search (client-side após normalização)
  const result = search
    ? normalized.filter(o => {
        const q = search.toLowerCase()
        return o.obra_titulo.toLowerCase().includes(q) || o.obra_codigo.toLowerCase().includes(q)
      })
    : normalized

  // KPIs globais
  const { data: kpiData } = await sb
    .from('cc_obras')
    .select('saldo_atual, saldo_distribuido, saldo_pendente')
    .eq('tenant_id', tenant_id)

  const saldo_total = (kpiData ?? []).reduce((s: number, r: any) => s + Number(r.saldo_atual ?? 0), 0)
  const distribuido_total = (kpiData ?? []).reduce((s: number, r: any) => s + Number(r.saldo_distribuido ?? 0), 0)

  // Entradas no mês
  const mesInicio = new Date(); mesInicio.setDate(1); mesInicio.setHours(0, 0, 0, 0)
  const { data: movMes } = await sb
    .from('cc_obras_movimentos')
    .select('tipo, valor')
    .eq('tenant_id', tenant_id)
    .gte('created_at', mesInicio.toISOString())

  const entradas_mes = (movMes ?? [])
    .filter((m: any) => m.tipo === 'entrada')
    .reduce((s: number, m: any) => s + Number(m.valor ?? 0), 0)

  // Obras com bloqueio
  const { count: bloqueiosCount } = await sb
    .from('cc_obras_movimentos')
    .select('obra_id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
    .eq('status_movimento', 'bloqueado')

  return NextResponse.json({
    data: result,
    total: search ? result.length : (count ?? 0),
    kpis: {
      saldo_total_obras: saldo_total,
      total_distribuido: distribuido_total,
      total_entradas_mes: entradas_mes,
      total_distribuido_mes: distribuido_total,
      obras_com_bloqueio: bloqueiosCount ?? 0,
    },
  })
}

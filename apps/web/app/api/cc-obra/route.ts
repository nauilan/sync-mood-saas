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
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  // Busca cc_obras com dados da obra
  let query = sb
    .from('cc_obras')
    .select(`
      id, obra_id, saldo_atual, saldo_bloqueado, saldo_distribuido, saldo_pendente,
      total_entradas, total_saidas, data_ultima_movimentacao, created_at,
      obras ( id, titulo, codigo_obra, iswc, status )
    `, { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('data_ultima_movimentacao', { ascending: false, nullsFirst: false })
    .range(offset, offset + per_page - 1)

  if (search) {
    // Filtra por título ou código via join — faremos no resultado
  }

  const { data: ccObras, error, count } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Busca movimentos recentes de todas as obras do resultado
  const obraIds = (ccObras ?? []).map((c: any) => c.obra_id).filter(Boolean)
  let movimentosMap: Map<string, any[]> = new Map()

  if (obraIds.length > 0) {
    const { data: movs } = await sb
      .from('cc_obras_movimentos')
      .select(`
        id, cc_obra_id, obra_id, tipo, valor, descricao, status,
        territorio, competencia_inicio, competencia_fim,
        recebimento_id, created_at,
        tipos_direito ( codigo, nome )
      `)
      .eq('tenant_id', tenant_id)
      .in('obra_id', obraIds)
      .order('created_at', { ascending: false })
      .limit(obraIds.length * 5) // até 5 movimentos por obra

    for (const mov of movs ?? []) {
      const list = movimentosMap.get(mov.obra_id) ?? []
      if (list.length < 5) {
        list.push(mov)
        movimentosMap.set(mov.obra_id, list)
      }
    }
  }

  // Conta bloqueios (movimentos tipo='bloqueio' com status='ativo')
  let bloqueiosMap: Map<string, any[]> = new Map()
  if (obraIds.length > 0) {
    const { data: bloqueios } = await sb
      .from('cc_obras_movimentos')
      .select('id, obra_id, descricao, valor')
      .eq('tenant_id', tenant_id)
      .eq('tipo', 'bloqueio')
      .eq('status', 'ativo')
      .in('obra_id', obraIds)

    for (const b of bloqueios ?? []) {
      const list = bloqueiosMap.get(b.obra_id) ?? []
      list.push(b)
      bloqueiosMap.set(b.obra_id, list)
    }
  }

  // Normaliza para o formato da interface ContaCorrenteObra
  const result = (ccObras ?? [])
    .filter((cc: any) => {
      if (!search) return true
      const q = search.toLowerCase()
      const obra = cc.obras
      return (
        obra?.titulo?.toLowerCase().includes(q) ||
        obra?.codigo_obra?.toLowerCase().includes(q)
      )
    })
    .map((cc: any) => ({
      id: cc.id,
      obra_id: cc.obra_id,
      obra_titulo: cc.obras?.titulo ?? '—',
      obra_codigo: cc.obras?.codigo_obra ?? '—',
      obra_iswc: cc.obras?.iswc ?? null,
      saldo_atual: Number(cc.saldo_atual ?? 0),
      saldo_bloqueado: Number(cc.saldo_bloqueado ?? 0),
      saldo_distribuido: Number(cc.saldo_distribuido ?? 0),
      saldo_pendente: Number(cc.saldo_pendente ?? 0),
      total_entradas: Number(cc.total_entradas ?? 0),
      total_saidas: Number(cc.total_saidas ?? 0),
      data_ultima_movimentacao: cc.data_ultima_movimentacao ?? null,
      bloqueios: bloqueiosMap.get(cc.obra_id) ?? [],
      movimentos: movimentosMap.get(cc.obra_id) ?? [],
    }))

  // KPIs globais
  const { data: kpiData } = await sb
    .from('cc_obras')
    .select('saldo_atual, saldo_distribuido, saldo_pendente, obra_id')
    .eq('tenant_id', tenant_id)

  const saldo_total = (kpiData ?? []).reduce((s: number, r: any) => s + Number(r.saldo_atual ?? 0), 0)
  const distribuido_total = (kpiData ?? []).reduce((s: number, r: any) => s + Number(r.saldo_distribuido ?? 0), 0)

  // Entradas e distribuído no mês atual
  const mesInicio = new Date(); mesInicio.setDate(1); mesInicio.setHours(0, 0, 0, 0)
  const { data: movMes } = await sb
    .from('cc_obras_movimentos')
    .select('tipo, valor')
    .eq('tenant_id', tenant_id)
    .gte('created_at', mesInicio.toISOString())

  const entradas_mes = (movMes ?? []).filter((m: any) => m.tipo === 'entrada').reduce((s: number, m: any) => s + Number(m.valor ?? 0), 0)
  const distribuido_mes = (movMes ?? []).filter((m: any) => m.tipo === 'distribuicao').reduce((s: number, m: any) => s + Number(m.valor ?? 0), 0)

  // Obras com bloqueio ativo
  const { count: bloqueiosCount } = await sb
    .from('cc_obras_movimentos')
    .select('obra_id', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
    .eq('tipo', 'bloqueio')
    .eq('status', 'ativo')

  return NextResponse.json({
    data: result,
    total: search ? result.length : (count ?? 0),
    kpis: {
      saldo_total_obras: saldo_total,
      total_distribuido: distribuido_total,
      total_entradas_mes: entradas_mes,
      total_distribuido_mes: distribuido_mes,
      obras_com_bloqueio: bloqueiosCount ?? 0,
    },
  })
}

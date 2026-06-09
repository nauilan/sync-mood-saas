/**
 * GET /api/contratos
 *
 * Lista contratos do tenant com KPIs.
 * Usa service_role para garantir leitura correta com RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

function getToken(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
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
  const tipo = searchParams.get('tipo') ?? 'todos'
  const status = searchParams.get('status') ?? 'todos'
  const titular_id = searchParams.get('titular_id')
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  let query = sb
    .from('contratos')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (titular_id) query = query.eq('titular_id', titular_id)
  if (tipo !== 'todos') query = query.eq('tipo', tipo)
  if (status !== 'todos') query = query.eq('status', status)
  if (search) {
    query = query.or(`numero.ilike.%${search}%,descricao.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs — coluna correta é data_fim (conforme migration 005_contratos.sql)
  const { data: kpiData } = await sb
    .from('contratos')
    .select('tipo, status, data_fim')
    .eq('tenant_id', tenant_id)

  const hoje = new Date()
  const em30dias = new Date(); em30dias.setDate(em30dias.getDate() + 30)

  const totais = {
    total: kpiData?.length ?? 0,
    em_vigor: kpiData?.filter((c: any) => ['ativo', 'vigente', 'em_vigor', 'assinado'].includes(c.status)).length ?? 0,
    vencendo: kpiData?.filter((c: any) => {
      if (!c.data_fim) return false
      const fim = new Date(c.data_fim)
      return fim >= hoje && fim <= em30dias
    }).length ?? 0,
    vencidos: kpiData?.filter((c: any) => {
      if (!c.data_fim) return false
      return new Date(c.data_fim) < hoje && c.status !== 'rescindido'
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
  const {
    tipo, editora_id, titular_id, percentual_editora, percentual_autor,
    splits_direitos, data_inicio, data_fim, prazo_indeterminado,
    territorio, exclusividade, status, numero, observacoes,
    titulo_obra, descricao, tipo_direito, abrangencia,
    obras, assinantes_d4sign, provedor_assinatura,
  } = body

  // Mapeia valor do frontend para enum do banco
  const tipoMapa: Record<string, string> = {
    cessao_obras: 'cessao',
    coedicao: 'coedicao',
    administracao: 'administracao',
    subedicao: 'subedicao',
    licenciamento: 'licenciamento',
    autorizacao: 'autorizacao',
  }
  const tipoDb = tipoMapa[tipo] ?? tipo ?? 'cessao'

  // Se editora_id não fornecido, usa a editora principal do tenant
  let resolvedEditoraId = editora_id
  if (!resolvedEditoraId) {
    const { data: editoraTenant } = await sb
      .from('editoras')
      .select('id')
      .eq('tenant_id', tenant_id)
      .limit(1)
      .single()
    resolvedEditoraId = editoraTenant?.id ?? null
  }

  const payload: Record<string, unknown> = {
    tenant_id,
    tipo:                tipoDb,
    status:              status ?? 'rascunho',
    numero:              numero ?? `CTO-${Date.now()}`,
    editora_id:          resolvedEditoraId,
  }
  if (editora_id != null)                 payload.editora_id           = editora_id
  if (titular_id !== undefined)           payload.titular_id           = titular_id
  if (percentual_editora !== undefined)   payload.percentual_editora   = percentual_editora
  if (percentual_autor !== undefined)     payload.percentual_autor     = percentual_autor
  if (splits_direitos !== undefined)      payload.splits_direitos      = splits_direitos
  if (data_inicio !== undefined)          payload.data_inicio          = data_inicio || null
  if (data_fim !== undefined)             payload.data_fim             = data_fim || null
  if (prazo_indeterminado !== undefined)  payload.prazo_indeterminado  = prazo_indeterminado
  if (territorio !== undefined)           payload.territorio           = territorio
  if (exclusividade !== undefined)        payload.exclusividade        = exclusividade
  if (observacoes !== undefined)          payload.observacoes          = observacoes
  if (titulo_obra !== undefined)          payload.titulo_obra          = titulo_obra
  if (descricao !== undefined)            payload.descricao            = descricao
  if (tipo_direito !== undefined)         payload.tipo_direito         = tipo_direito
  if (abrangencia !== undefined)          payload.abrangencia          = abrangencia
  if (assinantes_d4sign !== undefined)    payload.assinantes_d4sign    = assinantes_d4sign
  if (provedor_assinatura !== undefined)  payload.provedor_assinatura  = provedor_assinatura
  if (obras !== undefined)               payload.obras_json            = obras

  // Requer migration 045 (assinantes_d4sign, provedor_assinatura, obras_json)
  const { data, error } = await sb
    .from('contratos')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({
    tenant_id,
    acao: 'criar',
    modulo: 'contratos',
    tabela_afetada: 'contratos',
    registro_id: (data as { id: string }).id,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })
  return NextResponse.json({ data }, { status: 201 })
}

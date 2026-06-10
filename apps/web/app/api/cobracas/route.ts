/**
 * GET  /api/cobracas — lista cobranças do tenant
 * POST /api/cobracas — cria cobrança
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'

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
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

function gerarNumeroCobranca(): string {
  const now = new Date()
  const ano = now.getFullYear()
  const seq = Date.now().toString().slice(-6)
  return `COB-${ano}-${seq}`
}

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status          = searchParams.get('status') ?? ''
  const tipo            = searchParams.get('tipo') ?? ''
  const obra_id         = searchParams.get('obra_id') ?? ''
  const editora_id      = searchParams.get('editora_id') ?? ''
  const per_page        = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page            = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset          = (page - 1) * per_page

  let q = sb.from('cobracas')
    .select(`
      *,
      obra:obra_id(id, titulo),
      editora:editora_id(id, nome),
      titular:titular_id(id, nome),
      autorizacao:autorizacao_id(id, numero_autorizacao)
    `, { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (status)    q = q.eq('status', status)
  if (tipo)      q = q.eq('tipo', tipo)
  if (obra_id)   q = q.eq('obra_id', obra_id)
  if (editora_id) q = q.eq('editora_id', editora_id)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [{ count: totalEmitidas }, { count: totalPagas }, { count: totalVencidas }] = await Promise.all([
    sb.from('cobracas').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status', 'emitida').is('deleted_at', null),
    sb.from('cobracas').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status', 'paga').is('deleted_at', null),
    sb.from('cobracas').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status', 'vencida').is('deleted_at', null),
  ])

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    per_page,
    kpis: {
      total: count ?? 0,
      emitidas: totalEmitidas ?? 0,
      pagas: totalPagas ?? 0,
      vencidas: totalVencidas ?? 0,
    },
  })
}

export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    obra_id, editora_id, titular_id, autorizacao_id,
    tipo, status: statusReq,
    valor_bruto, valor_liquido, percentual_comissao, moeda,
    licenciado_nome, licenciado_cnpj_cpf, licenciado_email,
    data_emissao, data_vencimento, periodo_referencia, territorio,
    observacoes, editora_administrada_id,
  } = body

  if (!valor_bruto && valor_bruto !== 0) {
    return NextResponse.json({ error: 'valor_bruto obrigatório' }, { status: 400 })
  }

  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')
  // Administrada só pode criar rascunho
  const status = (statusReq && isAdmin) ? statusReq : 'rascunho'

  const payload: Record<string, unknown> = {
    tenant_id:              usuario.tenant_id,
    numero_cobranca:        gerarNumeroCobranca(),
    tipo:                   tipo ?? 'licenciamento',
    status,
    obra_id:                obra_id ?? null,
    editora_id:             editora_id ?? null,
    titular_id:             titular_id ?? null,
    autorizacao_id:         autorizacao_id ?? null,
    valor_bruto:            valor_bruto ?? 0,
    valor_liquido:          valor_liquido ?? null,
    percentual_comissao:    percentual_comissao ?? null,
    moeda:                  moeda ?? 'BRL',
    licenciado_nome:        licenciado_nome ?? null,
    licenciado_cnpj_cpf:    licenciado_cnpj_cpf ?? null,
    licenciado_email:       licenciado_email ?? null,
    data_emissao:           data_emissao ?? new Date().toISOString().slice(0, 10),
    data_vencimento:        data_vencimento ?? null,
    periodo_referencia:     periodo_referencia ?? null,
    territorio:             territorio ?? 'BR',
    observacoes:            observacoes ?? null,
    emitida_por:            usuario.id,
    editora_administrada_id: editora_administrada_id ?? null,
  }

  const { data, error } = await sb.from('cobracas').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id, usuario_id: usuario.id,
    acao: 'criar', modulo: 'cobracas', tabela_afetada: 'cobracas',
    registro_id: (data as any).id,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ data }, { status: 201 })
}

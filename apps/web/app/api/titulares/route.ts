/**
 * GET /api/titulares
 *
 * Lista titulares (autores + editoras) do tenant.
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
    .is('deleted_at', null)
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
    .is('deleted_at', null)

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

  // Contagem atual — compartilhada entre codigo_titular e codigo_interno sequenciais
  const { count: totalTitulares } = await sb
    .from('titulares')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant_id)
  const seqBase = (totalTitulares ?? 0) + 1

  // Código do titular: usa o fornecido (validando unicidade) ou gera T####
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
    codigo_titular = `T${String(seqBase).padStart(4, '0')}`
  }

  // ID Interno: usa o digitado ou gera ID#### sequencial automaticamente
  const codigo_interno = (body.codigo_interno ?? '').trim() || `ID${String(seqBase).padStart(4, '0')}`

  const payload: Record<string, unknown> = {
    tenant_id,
    codigo_titular,
    codigo_interno,
    tipo:   body.tipo ?? 'autor',
    pessoa: body.tipo_pessoa ?? body.pessoa ?? 'PF',
    nome_completo: nomeCompleto,
    status: 'ativo',
  }

  // Campos escalares opcionais — inclui apenas se presentes
  for (const field of [
    'nome_artistico', 'cpf_cnpj', 'ipi', 'codigo_ipi', 'codigo_cae',
    'sexo', 'estado_civil', 'profissao', 'nacionalidade', 'sociedade_autoral',
    'observacoes', 'editora_id', 'editora_vinculada_id',
  ]) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      payload[field] = body[field]
    }
  }
  // Campos estruturados
  if (body.dados_bancarios && typeof body.dados_bancarios === 'object') payload.dados_bancarios = body.dados_bancarios
  if (Array.isArray(body.funcoes)  && body.funcoes.length  > 0) payload.funcoes  = body.funcoes
  if (body.endereco && typeof body.endereco === 'object')         payload.endereco = body.endereco
  if (Array.isArray(body.contatos)    && body.contatos.length    > 0) payload.contatos    = body.contatos
  if (Array.isArray(body.pseudonimos) && body.pseudonimos.length > 0) payload.pseudonimos = body.pseudonimos
  if (Array.isArray(body.documentos)  && body.documentos.length  > 0) payload.documentos  = body.documentos

  const { data, error } = await sb.from('titulares').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await logAudit({
    tenant_id,
    acao: 'criar',
    modulo: 'titulares',
    tabela_afetada: 'titulares',
    registro_id: (data as { id: string }).id,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })
  return NextResponse.json({ data }, { status: 201 })
}

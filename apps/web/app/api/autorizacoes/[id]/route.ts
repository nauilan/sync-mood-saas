/**
 * GET    /api/autorizacoes/[id]
 * PATCH  /api/autorizacoes/[id]
 * DELETE /api/autorizacoes/[id] (soft delete)
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

const ALLOWED_PATCH = new Set([
  'tipo_autorizacao', 'status_workflow', 'finalidade', 'observacoes',
  'licenciado_nome', 'licenciado_cnpj_cpf', 'licenciado_email',
  'valor_licenca', 'moeda', 'territorio', 'prazo_inicio', 'prazo_fim',
  'prazo_indeterminado', 'editora_administrada_id', 'obra_id', 'editora_id',
  'titular_id', 'motivo_cancelamento',
  // legados
  'tipo_uso', 'licenciante', 'licenciado', 'data_inicio', 'data_fim', 'valor', 'descricao', 'status',
])

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await sb.from('autorizacoes')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (error) {
    const status = (error as any).code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message, code: (error as any).code }, { status })
  }

  // Buscar nomes relacionados em queries separadas (evita ambiguidade de FK)
  const row = data as Record<string, any>
  const [editoraRes, editoraAdmRes, titularRes, obraRes] = await Promise.all([
    row.editora_id
      ? sb.from('editoras').select('id,nome').eq('id', row.editora_id).single()
      : Promise.resolve({ data: null }),
    row.editora_administrada_id
      ? sb.from('editoras').select('id,nome').eq('id', row.editora_administrada_id).single()
      : Promise.resolve({ data: null }),
    row.titular_id
      ? sb.from('titulares').select('id,nome').eq('id', row.titular_id).single()
      : Promise.resolve({ data: null }),
    row.obra_id
      ? sb.from('obras').select('id,titulo').eq('id', row.obra_id).single()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({
    data: {
      ...row,
      editora:              editoraRes.data ?? null,
      editora_administrada: editoraAdmRes.data ?? null,
      titular:              titularRes.data ?? null,
      obra:                 obraRes.data ?? null,
    }
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')

  // Whitelist — campos protegidos nunca são aceitos do cliente
  const safeBody: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_PATCH.has(k)) safeBody[k] = v
  }

  // Somente Admin pode emitir
  if (safeBody.status_workflow === 'emitida' && !isAdmin) {
    safeBody.status_workflow = 'aguardando_aprovacao_admin'
  }
  if (safeBody.status_workflow === 'emitida') {
    safeBody.emitida_por = usuario.id
    safeBody.emitida_em  = new Date().toISOString()
  }

  const { data: anterior } = await sb.from('autorizacoes')
    .select('*').eq('id', id).eq('tenant_id', usuario.tenant_id).single()

  // Trava de integridade editorial: ao alterar status para 'emitida', verificar obra apta
  if (safeBody.status_workflow === 'emitida') {
    const obraId = (anterior as Record<string, unknown> | null)?.obra_id as string | null
    if (obraId) {
      const { data: obraInteg } = await sb.from('obras')
        .select('status_integridade')
        .eq('id', obraId)
        .eq('tenant_id', usuario.tenant_id)
        .single()
      const si = (obraInteg as Record<string, unknown> | null)?.status_integridade as string | null
      if (si !== 'apta') {
        return NextResponse.json({
          error: `Autorização não pode ser emitida: a obra possui integridade editorial "${si ?? 'não calculada'}". Regularize via Saneamento Editorial antes de emitir.`,
          status_integridade: si ?? null,
        }, { status: 422 })
      }
    }
  }

  const { data, error } = await sb.from('autorizacoes')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id, usuario_id: usuario.id,
    acao: 'alterar', modulo: 'autorizacoes', tabela_afetada: 'autorizacoes',
    registro_id: id,
    dados_anteriores: anterior as Record<string, unknown>,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')
  if (!isAdmin) return NextResponse.json({ error: 'Sem permissão para excluir autorização' }, { status: 403 })

  const { error } = await sb.from('autorizacoes')
    .update({ deleted_at: new Date().toISOString(), deleted_by: usuario.id })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id, usuario_id: usuario.id,
    acao: 'excluir', modulo: 'autorizacoes', tabela_afetada: 'autorizacoes',
    registro_id: id, origem_execucao: 'usuario',
  })

  return NextResponse.json({ ok: true })
}

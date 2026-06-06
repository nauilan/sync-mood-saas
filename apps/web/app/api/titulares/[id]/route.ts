import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// GET /api/titulares/[id]
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await sb
    .from('titulares')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Titular não encontrado' }, { status: 404 })
  return NextResponse.json({ data })
}

// PUT /api/titulares/[id] — atualizar campos do titular
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: titular } = await sb
    .from('titulares')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (!titular) return NextResponse.json({ error: 'Titular não encontrado' }, { status: 404 })

  const body = await req.json()

  const ALLOWED = [
    'nome_completo', 'nome_artistico', 'cpf_cnpj', 'tipo', 'tipo_pessoa',
    'codigo_titular', 'codigo_cae', 'codigo_ipi', 'ipi', 'dados_bancarios',
    'status', 'observacoes', 'editora_vinculada_id',
  ]

  const update: Record<string, unknown> = {}
  for (const k of ALLOWED) {
    if (k in body) update[k] = body[k]
  }

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })

  const { data, error } = await sb
    .from('titulares')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/titulares/[id] — soft delete com verificação de vínculos
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Confirmar que titular existe no tenant
  const { data: titular } = await sb
    .from('titulares')
    .select('id, nome_completo, codigo_titular')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (!titular) return NextResponse.json({ error: 'Titular não encontrado' }, { status: 404 })

  // Verificar vínculos bloqueantes
  const vinculos: string[] = []

  const { count: cContratos } = await sb
    .from('contratos')
    .select('*', { count: 'exact', head: true })
    .eq('titular_id', id)
    .eq('tenant_id', tenant_id)

  if ((cContratos ?? 0) > 0) vinculos.push(`${cContratos} contrato(s)`)

  const { count: cSolicitacoesContratos } = await sb
    .from('solicitacoes_contratos_titulares')
    .select('*', { count: 'exact', head: true })
    .eq('titular_id', id)

  if ((cSolicitacoesContratos ?? 0) > 0) vinculos.push(`${cSolicitacoesContratos} solicitação(ões) de contrato`)

  const { count: cSolicitacoesObras } = await sb
    .from('solicitacoes_obras_titulares')
    .select('*', { count: 'exact', head: true })
    .eq('titular_id', id)

  if ((cSolicitacoesObras ?? 0) > 0) vinculos.push(`${cSolicitacoesObras} solicitação(ões) de obra`)

  const { count: cObras } = await sb
    .from('obras_links_titulares')
    .select('*', { count: 'exact', head: true })
    .eq('titular_id', id)

  if ((cObras ?? 0) > 0) vinculos.push(`${cObras} vínculo(s) em obras`)

  if (vinculos.length > 0) {
    return NextResponse.json({
      error: 'Não é possível excluir este titular pois ele possui vínculos ativos.',
      vinculos,
      sugestao: 'Remova os vínculos antes de excluir, ou desative o titular alterando o status para inativo.',
    }, { status: 409 })
  }

  // Soft delete
  const { error } = await sb
    .from('titulares')
    .update({ deleted_at: new Date().toISOString(), status: 'inativo' })
    .eq('id', id)
    .eq('tenant_id', tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: `Titular "${titular.nome_completo}" excluído.` })
}

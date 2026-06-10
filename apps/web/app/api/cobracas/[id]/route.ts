/**
 * GET   /api/cobracas/[id]
 * PATCH /api/cobracas/[id]
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
  'tipo', 'status', 'valor_bruto', 'valor_liquido', 'percentual_comissao', 'moeda',
  'licenciado_nome', 'licenciado_cnpj_cpf', 'licenciado_email',
  'data_emissao', 'data_vencimento', 'data_pagamento',
  'periodo_referencia', 'territorio', 'observacoes',
  'obra_id', 'editora_id', 'titular_id', 'autorizacao_id', 'editora_administrada_id',
])

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await sb.from('cobracas')
    .select(`*, obra:obra_id(id,titulo), editora:editora_id(id,nome), titular:titular_id(id,nome), autorizacao:autorizacao_id(id,numero_autorizacao)`)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const safeBody: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_PATCH.has(k)) safeBody[k] = v
  }

  const { data: anterior } = await sb.from('cobracas')
    .select('*').eq('id', id).eq('tenant_id', usuario.tenant_id).single()

  const { data, error } = await sb.from('cobracas')
    .update({ ...safeBody, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id, usuario_id: usuario.id,
    acao: 'alterar', modulo: 'cobracas', tabela_afetada: 'cobracas',
    registro_id: id,
    dados_anteriores: anterior as Record<string, unknown>,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ data })
}

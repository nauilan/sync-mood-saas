/**
 * GET  /api/obras/[id]/interpretes  — lista intérpretes da obra
 * POST /api/obras/[id]/interpretes  — adiciona intérprete
 * DELETE /api/obras/[id]/interpretes?iid=UUID — remove intérprete
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(sb: any, req: NextRequest): Promise<string | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return usuario?.tenant_id ?? null
}

// ── GET — listar intérpretes ─────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data, error } = await sb
    .from('obras_interpretes')
    .select('id, nome_artistico, nome_civil, tipo, origem, created_at, titular_id')
    .eq('obra_id', id)
    .eq('tenant_id', tenant_id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

// ── POST — adicionar intérprete ──────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { nome_artistico, nome_civil, tipo = 'principal', origem = 'manual', titular_id } = body

  if (!nome_artistico?.trim()) {
    return NextResponse.json({ error: 'nome_artistico é obrigatório' }, { status: 422 })
  }

  // Verificar se a obra pertence ao tenant
  const { data: obra } = await sb
    .from('obras')
    .select('id, titulo')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  // Se não forneceu titular_id, tentar localizar pelo nome artístico
  let resolvedTitularId: string | null = titular_id ?? null
  if (!resolvedTitularId && nome_artistico?.trim()) {
    const { data: titFound } = await sb
      .from('titulares')
      .select('id')
      .eq('tenant_id', tenant_id)
      .or(`nome_completo.ilike.%${nome_artistico.trim()}%,nome.ilike.%${nome_artistico.trim()}%`)
      .limit(1)
      .single()
    resolvedTitularId = titFound?.id ?? null
  }

  const { data: novo, error: errInsert } = await sb
    .from('obras_interpretes')
    .insert({
      tenant_id,
      obra_id:       id,
      nome_artistico: nome_artistico.trim(),
      nome_civil:    nome_civil?.trim() ?? null,
      tipo,
      origem,
      titular_id:    resolvedTitularId,
    })
    .select()
    .single()

  if (errInsert || !novo) {
    return NextResponse.json({ error: errInsert?.message ?? 'Erro ao inserir' }, { status: 500 })
  }

  await logAudit({
    tenant_id,
    acao:           'criar',
    modulo:         'obras',
    tabela_afetada: 'obras_interpretes',
    registro_id:    id,
    dados_novos:    { interprete_id: novo.id, nome_artistico: novo.nome_artistico, tipo },
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ data: novo }, { status: 201 })
}

// ── DELETE — remover intérprete ──────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const iid = new URL(req.url).searchParams.get('iid')
  if (!iid) return NextResponse.json({ error: 'iid (interprete id) é obrigatório' }, { status: 422 })

  const { error } = await sb
    .from('obras_interpretes')
    .delete()
    .eq('id', iid)
    .eq('obra_id', id)
    .eq('tenant_id', tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id,
    acao:           'remover',
    modulo:         'obras',
    tabela_afetada: 'obras_interpretes',
    registro_id:    id,
    dados_novos:    { interprete_id: iid },
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ ok: true })
}

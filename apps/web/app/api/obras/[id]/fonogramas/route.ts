/**
 * GET  /api/obras/[id]/fonogramas — lista fonogramas da obra
 * POST /api/obras/[id]/fonogramas — cria fonograma vinculado à obra
 */
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(sb: any, req: NextRequest): Promise<{ tenant_id: string } | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return data as { tenant_id: string } | null
}

// ── GET ─────────────────────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obra_id } = await params

  const { data, error } = await sb
    .from('fonogramas')
    .select('*')
    .eq('obra_id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .order('titulo_fonograma')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [], total: (data ?? []).length })
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obra_id } = await params

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  if (!body.titulo_fonograma && !body.isrc) {
    return NextResponse.json({ error: 'titulo_fonograma ou isrc obrigatório' }, { status: 400 })
  }

  const ALLOWED = [
    'titulo_fonograma', 'isrc', 'interprete', 'versao', 'duracao_segundos',
    'ano_gravacao', 'gravadora', 'produtor_fonografico', 'data_lancamento', 'pais',
    'plataformas', 'url_preview', 'status',
    // Migration 058 — rastreabilidade
    'origem', 'titular_id', 'contrato_id',
  ]

  const payload: Record<string, unknown> = { obra_id, tenant_id: usuario.tenant_id }
  for (const k of ALLOWED) {
    if (body[k] !== undefined && body[k] !== null && body[k] !== '') payload[k] = body[k]
  }

  // Normalizar ISRC para maiúsculas
  if (payload.isrc) payload.isrc = String(payload.isrc).toUpperCase().trim()

  // Verificar duplicidade de ISRC na mesma obra
  if (payload.isrc) {
    const { data: dup } = await sb
      .from('fonogramas')
      .select('id')
      .eq('obra_id', obra_id)
      .eq('isrc', payload.isrc)
      .limit(1)
      .single()
    if (dup) return NextResponse.json({ error: `ISRC ${payload.isrc} já existe nesta obra` }, { status: 409 })
  }

  const { data, error } = await sb.from('fonogramas').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obra_id } = await params
  const fid = new URL(req.url).searchParams.get('fid')
  if (!fid) return NextResponse.json({ error: 'fid (fonograma id) é obrigatório' }, { status: 422 })

  const { error } = await sb
    .from('fonogramas')
    .delete()
    .eq('id', fid)
    .eq('obra_id', obra_id)
    .eq('tenant_id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

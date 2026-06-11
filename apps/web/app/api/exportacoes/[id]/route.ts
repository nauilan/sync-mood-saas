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

// ── GET /api/exportacoes/[id] ────────────────────────────────────────────────
// Detalhe completo: exportação + obras + logs
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const [
    { data: exportacao },
    { data: obras },
    { data: logs },
    { data: retorno },
  ] = await Promise.all([
    sb.from('exportacoes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
      .single(),
    sb.from('exportacoes_obras')
      .select(`
        id, obra_id, status_obra, codigo_externo_retornado, iswc_retornado,
        obras!inner ( id, titulo, codigo_obra, iswc, status_catalogo, completude_score )
      `)
      .eq('exportacao_id', id),
    sb.from('exportacoes_logs')
      .select('id, evento, mensagem, dados_json, timestamp')
      .eq('exportacao_id', id)
      .order('timestamp', { ascending: false }),
    sb.from('exportacoes_retorno')
      .select('*')
      .eq('exportacao_id', id)
      .maybeSingle(),
  ])

  if (!exportacao) return NextResponse.json({ error: 'Exportação não encontrada' }, { status: 404 })

  return NextResponse.json({
    data: {
      exportacao,
      obras:   obras   ?? [],
      logs:    logs    ?? [],
      retorno: retorno ?? null,
    },
  })
}

// ── PATCH /api/exportacoes/[id] ──────────────────────────────────────────────
// Permite atualizar status da exportação (ex: marcar como cancelada)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['master', 'admin'].includes(usuario.role ?? '')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const ALLOWED_UPDATE = ['status', 'arquivo_url', 'hash']
  const update: Record<string, unknown> = {}
  for (const k of ALLOWED_UPDATE) {
    if (k in body) update[k] = body[k]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 400 })
  }

  const { data, error } = await sb
    .from('exportacoes')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

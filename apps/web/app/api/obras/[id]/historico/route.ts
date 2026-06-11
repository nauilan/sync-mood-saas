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

// GET /api/obras/[id]/historico
// Retorna log de alterações campo a campo da obra
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

  // Confirma que obra pertence ao tenant
  const { data: obraCheck } = await sb
    .from('obras')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()
  if (!obraCheck) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const { data, error } = await sb
    .from('obras_historico')
    .select('id, campo, valor_anterior, valor_novo, origem, usuario_id, created_at')
    .eq('obra_id', id)
    .eq('tenant_id', usuario.tenant_id)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

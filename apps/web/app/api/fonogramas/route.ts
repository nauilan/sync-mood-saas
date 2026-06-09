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

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const token = getToken(req)
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const obra_id   = sp.get('obra_id')
  const isrc      = sp.get('isrc')
  const interprete = sp.get('interprete')
  const status    = sp.get('status') ?? 'ativo'
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1'))
  const limit     = Math.min(200, Math.max(1, parseInt(sp.get('limit') ?? '50')))
  const offset    = (page - 1) * limit

  let query = sb
    .from('fonogramas')
    .select(`
      id, obra_id, isrc, titulo_fonograma, interprete,
      versao, duracao_segundos, ano_gravacao, gravadora,
      produtor_fonografico, data_lancamento, pais, plataformas,
      url_preview, status, created_at, updated_at,
      obras ( id, titulo, codigo_obra, iswc )
    `, { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .eq('status', status)
    .order('titulo_fonograma')
    .range(offset, offset + limit - 1)

  if (obra_id)    query = query.eq('obra_id', obra_id)
  if (isrc)       query = query.eq('isrc', isrc.toUpperCase())
  if (interprete) query = query.ilike('interprete', `%${interprete}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    pages: Math.ceil((count ?? 0) / limit),
  })
}

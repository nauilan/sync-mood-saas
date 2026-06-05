import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

async function autenticar(req: NextRequest, sb: ReturnType<typeof createClient>): Promise<{ tenant_id: string; role: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('tenant_id, role').eq('auth_user_id', user.id).single()
  const u = data as { tenant_id: string; role: string } | null
  return u
}

// ── GET /api/obras — listar obras do tenant ───────────────────────────────────
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status   = searchParams.get('status')
  const search   = searchParams.get('q')
  const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const per_page = Math.min(200, parseInt(searchParams.get('per_page') ?? '100'))
  const offset   = (page - 1) * per_page

  let query = sb
    .from('obras')
    .select(`
      id, titulo, titulo_alternativo, subtitulo, codigo, iswc,
      idioma, genero, ano_criacao, duracao, status,
      codigo_interno_legado, codigo_obra_cwr_original,
      backoffice_song_id, backoffice_work_id, backoffice_status,
      origem_importacao, contrato_file, letra, editora_id,
      created_at, updated_at, tenant_id
    `, { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .order('titulo', { ascending: true })
    .range(offset, offset + per_page - 1)

  if (status) query = query.eq('status', status)
  if (search) query = query.or(`titulo.ilike.%${search}%,codigo.ilike.%${search}%`)

  const { data, error, count } = await query

  if (error) {
    console.error('[GET /api/obras]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
    total: count ?? 0,
    page,
    per_page,
  })
}

// ── POST /api/obras — criar obra manual ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  const { titulo, ...rest } = body
  if (!titulo) return NextResponse.json({ error: 'Campo "titulo" obrigatório' }, { status: 400 })

  const { data, error } = await sb
    .from('obras')
    .insert({ ...rest, titulo, tenant_id: usuario.tenant_id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

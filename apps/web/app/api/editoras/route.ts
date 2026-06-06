import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const SERVICE_KEY  = sanitize(process.env.SUPABASE_SERVICE_ROLE_KEY)

function getAdminClient() {
  if (!SUPABASE_URL || !SERVICE_KEY) return null
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
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

async function autenticar(sb: any, req: NextRequest): Promise<string | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return (usuario as any)?.tenant_id ?? null
}

// GET /api/editoras — lista editoras do tenant autenticado
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'ativo'

  let query = sb
    .from('editoras')
    .select('id,nome_fantasia,razao_social,cnpj,tipo_editora,controlada,status,codigo_publisher_cwr,codigo_cae,codigo_ipi,codigo_interno_cwr,pais_registro,codigo_ecad,codigo_interno,created_at')
    .eq('tenant_id', tenant_id)
    .order('nome_fantasia')

  if (status && status !== 'todos') query = query.eq('status', status)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ editoras: data ?? [] })
}

// POST /api/editoras — cria nova editora para o tenant autenticado
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const { nome_fantasia, razao_social, cnpj, tipo_editora, controlada, codigo_publisher_cwr, codigo_cae, codigo_ipi, codigo_interno_cwr, pais_registro, codigo_ecad, codigo_interno } = body

  if (!nome_fantasia?.trim() || !razao_social?.trim()) {
    return NextResponse.json({ error: 'nome_fantasia e razao_social são obrigatórios' }, { status: 400 })
  }

  const payload = {
    tenant_id,
    nome_fantasia: nome_fantasia.trim(),
    razao_social: razao_social.trim(),
    cnpj: cnpj?.trim() || null,
    tipo_editora: tipo_editora ?? 'administrada',
    controlada: controlada ?? false,
    codigo_publisher_cwr: codigo_publisher_cwr?.trim() || null,
    codigo_cae: codigo_cae?.trim() || null,
    codigo_ipi: codigo_ipi?.trim() || null,
    codigo_interno_cwr: codigo_interno_cwr?.trim() || null,
    pais_registro: pais_registro?.trim() || null,
    codigo_ecad: codigo_ecad?.trim() || null,
    codigo_interno: codigo_interno?.trim() || null,
    status: 'ativo',
  }

  const { data, error } = await sb.from('editoras').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ editora: data }, { status: 201 })
}

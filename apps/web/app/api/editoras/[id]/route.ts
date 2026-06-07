import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)
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

// GET /api/editoras/[id] — retorna uma editora pelo ID (usa admin direto, sem RLS)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const { id } = await params

  const { data, error } = await sb.from('editoras').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Editora não encontrada' }, { status: 404 })
  return NextResponse.json({ editora: data })
}

// PUT /api/editoras/[id] — atualiza uma editora do tenant autenticado
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const { id } = await params
  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const body = await req.json()
  const {
    nome_fantasia, razao_social, cnpj, tipo_editora, controlada,
    codigo_cae, codigo_ipi,
    pais_registro, codigo_ecad, codigo_interno,
    endereco, bairro, cep, cidade, estado, pais,
    telefone, email, site, sociedade_autoral_vinculada,
    dados_bancarios, status,
    sender_code, sender_name, sender_type,
  } = body

  const key = SERVICE_KEY || ANON_KEY
  const patchHeaders = {
    apikey: key, Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json', Prefer: 'return=representation',
  }

  const payload: Record<string, unknown> = {}
  if (nome_fantasia !== undefined)            payload.nome_fantasia            = nome_fantasia?.trim() || null
  if (razao_social !== undefined)             payload.razao_social             = razao_social?.trim() || null
  if (cnpj !== undefined)                     payload.cnpj                     = cnpj?.trim() || null
  if (tipo_editora !== undefined)             payload.tipo_editora             = tipo_editora || null
  if (controlada !== undefined)               payload.controlada               = controlada
  if (codigo_cae !== undefined)               payload.codigo_cae               = codigo_cae?.trim() || null
  if (codigo_ipi !== undefined)               payload.codigo_ipi               = codigo_ipi?.trim() || null
  if (pais_registro !== undefined)            payload.pais_registro            = pais_registro?.trim() || null
  if (codigo_ecad !== undefined)              payload.codigo_ecad              = codigo_ecad?.trim() || null
  if (codigo_interno !== undefined)           payload.codigo_interno           = codigo_interno?.trim() || null
  if (endereco !== undefined)                 payload.endereco                 = endereco?.trim() || null
  if (bairro !== undefined)                   payload.bairro                   = bairro?.trim() || null
  if (cep !== undefined)                      payload.cep                      = cep?.trim() || null
  if (cidade !== undefined)                   payload.cidade                   = cidade?.trim() || null
  if (estado !== undefined)                   payload.estado                   = estado?.trim() || null
  if (pais !== undefined)                     payload.pais                     = pais?.trim() || null
  if (telefone !== undefined)                 payload.telefone                 = telefone?.trim() || null
  if (email !== undefined)                    payload.email                    = email?.trim() || null
  if (site !== undefined)                     payload.site                     = site?.trim() || null
  if (sociedade_autoral_vinculada !== undefined) payload.sociedade_autoral_vinculada = sociedade_autoral_vinculada?.trim() || null
  if (dados_bancarios !== undefined)          payload.dados_bancarios          = dados_bancarios
  if (status !== undefined)                   payload.status                   = status
  if (sender_code !== undefined)              payload.sender_code              = sender_code?.trim() || null
  if (sender_name !== undefined)              payload.sender_name              = sender_name?.trim() || null
  if (sender_type !== undefined)              payload.sender_type              = sender_type?.trim() || null

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/editoras?id=eq.${id}&tenant_id=eq.${tenant_id}`,
    { method: 'PATCH', headers: patchHeaders, body: JSON.stringify(payload) }
  )
  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status })
  const editora = Array.isArray(data) ? data[0] : data
  return NextResponse.json({ editora })
}

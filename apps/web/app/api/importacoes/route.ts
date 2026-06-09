import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveUser(req: NextRequest, sb: any) {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await (sb as any).auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await (sb as any)
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return null
  return {
    userId: usuario.id as string,
    tenantId: usuario.tenant_id as string,
    role: usuario.role as string,
  }
}

// ── GET /api/importacoes ────────────────────────────────────────────────────
// Lista as últimas 50 importações do tenant
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

  const user = await resolveUser(req, sb)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data, error } = await (sb as any)
    .from('importacoes_log')
    .select('id, arquivo, tipo, status, obras_importadas, titulares_importados, detalhes, created_at')
    .eq('tenant_id', user.tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ importacoes: data ?? [] })
}

// ── POST /api/importacoes ───────────────────────────────────────────────────
// Registra um log de importação no banco
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

  const user = await resolveUser(req, sb)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const tipoValido = ['CWR', 'DSP_TXT', 'XLSX'].includes(String(body.tipo ?? ''))
  const statusValido = ['sucesso', 'parcial', 'erro'].includes(String(body.status ?? ''))

  const payload = {
    tenant_id:             user.tenantId,
    usuario_id:            user.userId,
    arquivo:               String(body.arquivo ?? '').trim() || 'arquivo.cwr',
    tipo:                  tipoValido ? String(body.tipo) : 'outro',
    status:                statusValido ? String(body.status) : 'sucesso',
    obras_importadas:      Number(body.obras_importadas ?? 0),
    titulares_importados:  Number(body.titulares_importados ?? 0),
    detalhes:              body.detalhes ? String(body.detalhes) : null,
  }

  const { data, error } = await (sb as any)
    .from('importacoes_log')
    .insert(payload)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id }, { status: 201 })
}

// ── DELETE /api/importacoes?id=... ──────────────────────────────────────────
// Remove um log de importação (apenas o registro, não os dados importados)
export async function DELETE(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 })

  const user = await resolveUser(req, sb)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await (sb as any)
    .from('importacoes_log')
    .delete()
    .eq('id', id)
    .eq('tenant_id', user.tenantId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

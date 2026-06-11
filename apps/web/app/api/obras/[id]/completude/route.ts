import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularCompletude } from '@/lib/obra-completude'

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

// GET /api/obras/[id]/completude
// Calcula completude editorial da obra e salva score/pendências no banco
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
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  // Buscar obra, participantes e fonogramas em paralelo
  const [{ data: obra }, { data: participantes }, { data: fonogramas }] = await Promise.all([
    sb.from('obras')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
      .is('deleted_at', null)
      .single(),
    sb.from('obras_participantes')
      .select('id, titular_id, nome_titular, papel, percentual, status_editorial')
      .eq('obra_id', id)
      .eq('tenant_id', usuario.tenant_id),
    sb.from('fonogramas')
      .select('id, isrc, titulo_fonograma, interprete')
      .eq('obra_id', id)
      .eq('tenant_id', usuario.tenant_id),
  ])

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const resultado = calcularCompletude(
    obra as Record<string, unknown>,
    (participantes ?? []) as Record<string, unknown>[],
    (fonogramas ?? []) as Record<string, unknown>[],
  )

  // Persistir score e pendências na obra (cache para exibição em listagens)
  await sb.from('obras').update({
    completude_score:      resultado.score,
    pendencias_exportacao: resultado.pendencias,
    ultima_completude_em:  new Date().toISOString(),
  }).eq('id', id).eq('tenant_id', usuario.tenant_id)

  return NextResponse.json({ data: resultado })
}

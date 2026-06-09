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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const { id: obra_id } = await params

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

  const { data, error } = await sb
    .from('obras_links')
    .select(`
      id, obra_id, numero_link, percentual_link, tipo_link, controlado, status,
      obras_links_titulares (
        id, obra_link_id, nome, papel, funcao_no_link,
        percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
        controlado, ipi, cae,
        titular_id, editora_id, editora_original_id, editora_administradora_id,
        contrato_id, status_controle
      )
    `)
    .eq('obra_id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .eq('status', 'ativo')
    .order('numero_link')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Normaliza para o formato esperado pelo componente
  const links = (data ?? []).map((l: any) => ({
    ...l,
    titulares: l.obras_links_titulares ?? [],
  }))

  return NextResponse.json({ data: links, total: links.length })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CWR_VERSION } from '@/lib/cwr-versions'

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
    try { const p = JSON.parse(decodeURIComponent(joined)); if (p?.access_token) return p.access_token } catch {}
    try { const p = JSON.parse(joined); if (p?.access_token) return p.access_token } catch {}
  }
  return ''
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase nÃ£o configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { id } = await params

  const [
    { data: exportacao, error: exportacaoError },
    { data: obras, error: obrasError },
    { data: logs, error: logsError },
    { data: retorno, error: retornoError },
  ] = await Promise.all([
    sb.from('exportacoes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
      .single(),
    sb.from('exportacoes_obras')
      .select(`
        obra_id, status_obra, codigo_externo_retornado, iswc_retornado,
        obras!inner ( id, titulo, codigo_obra, iswc, status_catalogo )
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

  if (exportacaoError) return NextResponse.json({ error: exportacaoError.message }, { status: 500 })
  if (obrasError) return NextResponse.json({ error: obrasError.message }, { status: 500 })
  if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 })
  if (retornoError) return NextResponse.json({ error: retornoError.message }, { status: 500 })
  if (!exportacao) return NextResponse.json({ error: 'ExportaÃ§Ã£o nÃ£o encontrada' }, { status: 404 })

  const obrasFlat = (obras ?? []).map((item: any) => ({
    id: `${id}:${item.obra_id}`,
    obra_id: item.obra_id,
    status_obra: item.status_obra,
    codigo_externo: item.codigo_externo_retornado ?? null,
    codigo_externo_retornado: item.codigo_externo_retornado ?? null,
    iswc_retornado: item.iswc_retornado ?? null,
    titulo: item.obras?.titulo ?? null,
    codigo_obra: item.obras?.codigo_obra ?? null,
    iswc: item.obras?.iswc ?? null,
    status_catalogo: item.obras?.status_catalogo ?? null,
    observacao: null,
  }))

  return NextResponse.json({
    data: {
      exportacao,
      obras: obrasFlat,
      logs: logs ?? [],
      retorno: retorno ?? null,
      cwr_version: exportacao.cwr_version ?? DEFAULT_CWR_VERSION,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase nÃ£o configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!usuario) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
  if (!['master', 'admin'].includes(usuario.role ?? '')) {
    return NextResponse.json({ error: 'PermissÃ£o insuficiente' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'JSON invÃ¡lido' }, { status: 400 })
  }

  const allowed = ['status', 'arquivo_url', 'hash'] as const
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = (body as Record<string, unknown>)[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo vÃ¡lido' }, { status: 400 })
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
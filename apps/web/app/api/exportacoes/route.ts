import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CWR_VERSION, isCWRVersion, normalizeCWRVersion } from '@/lib/cwr-versions'

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

async function getUsuario(sb: any, token: string) {
  const { data: authData, error: authError } = await sb.auth.getUser(token)
  if (authError || !authData?.user) return { error: 'Não autorizado', status: 401 as const }

  const { data: usuario, error: usuarioError } = await sb
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (usuarioError || !usuario) return { error: 'Usuário não encontrado', status: 401 as const }
  return { usuario }
}

function makeCodigo(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `EXP-${y}${m}${d}-${h}${min}${s}`
}

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const auth = await getUsuario(sb, token)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { usuario } = auth

  const { searchParams } = new URL(req.url)
  const obraId = searchParams.get('obra_id')

  if (obraId) {
    const { data: relacoes, error: relError } = await sb
      .from('exportacoes_obras')
      .select('exportacao_id, obra_id, status_obra, codigo_externo_retornado')
      .eq('obra_id', obraId)
      .limit(100)

    if (relError) return NextResponse.json({ error: relError.message }, { status: 500 })

    const exportacaoIds = Array.from(
      new Set((relacoes ?? []).map((row: Record<string, unknown>) => String(row.exportacao_id ?? '')).filter(Boolean))
    )

    if (exportacaoIds.length === 0) return NextResponse.json({ data: [] })

    const { data: exportacoes, error: expError } = await sb
      .from('exportacoes')
      .select('id, codigo, destino, formato, status, criado_em, total_obras')
      .in('id', exportacaoIds)
      .eq('tenant_id', usuario.tenant_id)
      .order('criado_em', { ascending: false })

    if (expError) return NextResponse.json({ error: expError.message }, { status: 500 })

    const exportacoesById = new Map((exportacoes ?? []).map((item: Record<string, unknown>) => [String(item.id), item]))

    const data = (relacoes ?? [])
      .map((row: Record<string, unknown>) => {
        const exp = exportacoesById.get(String(row.exportacao_id ?? '')) ?? null
        return {
          id: `${row.exportacao_id}:${row.obra_id}`,
          exportacao_id: row.exportacao_id,
          obra_id: row.obra_id,
          status_obra: row.status_obra,
          codigo_externo_retornado: row.codigo_externo_retornado,
          codigo: exp?.codigo,
          destino: exp?.destino,
          formato: exp?.formato,
          status: exp?.status,
          criado_em: exp?.criado_em,
          total_obras: exp?.total_obras,
        }
      })
      .filter((item) => !!item.codigo)

    return NextResponse.json({ data })
  }

  const { data, error } = await sb
    .from('exportacoes')
    .select('id, codigo, destino, formato, status, total_obras, criado_em')
    .eq('tenant_id', usuario.tenant_id)
    .order('criado_em', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const auth = await getUsuario(sb, token)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { usuario } = auth

  const body = await req.json().catch(() => ({}))
  const destino = String(body?.destino ?? 'cwr').trim().toLowerCase()
  const formato = String(body?.formato ?? 'txt').trim().toLowerCase()
  const requestedVersion = body?.cwr_version
  if (requestedVersion != null && !isCWRVersion(requestedVersion)) {
    return NextResponse.json({ error: 'Versão CWR inválida. Use 2.1 ou 2.2.' }, { status: 400 })
  }
  const cwrVersion = normalizeCWRVersion(requestedVersion)
  const obraIds = Array.from(new Set(Array.isArray(body?.obra_ids) ? body.obra_ids.map((value: unknown) => String(value).trim()).filter(Boolean) : []))

  const { data: exportacao, error: insertError } = await sb
    .from('exportacoes')
    .insert({
      tenant_id: usuario.tenant_id,
      codigo: makeCodigo(),
      destino,
      formato,
      cwr_version: cwrVersion ?? DEFAULT_CWR_VERSION,
      status: 'rascunho',
      total_obras: obraIds.length,
      criado_por: usuario.id,
    })
    .select('id, codigo, destino, formato, cwr_version, status, total_obras, criado_em')
    .single()

  if (insertError || !exportacao) {
    return NextResponse.json({ error: insertError?.message ?? 'Erro ao criar exportação' }, { status: 500 })
  }

  if (obraIds.length > 0) {
    const { data: obras, error: obrasError } = await sb
      .from('obras')
      .select('id')
      .in('id', obraIds)
      .eq('tenant_id', usuario.tenant_id)
      .is('deleted_at', null)

    if (obrasError) return NextResponse.json({ error: obrasError.message }, { status: 500 })

    const validIds = new Set((obras ?? []).map((obra: Record<string, unknown>) => String(obra.id)))
    const rows = obraIds
      .filter((id) => validIds.has(String(id)))
      .map((obraId) => ({
        exportacao_id: exportacao.id,
        obra_id: obraId,
        status_obra: 'incluida',
      }))

    if (rows.length > 0) {
      const { error: relError } = await sb.from('exportacoes_obras').insert(rows)
      if (relError) return NextResponse.json({ error: relError.message }, { status: 500 })
    }
  }

  await sb.from('exportacoes_logs').insert({
    exportacao_id: exportacao.id,
    evento: 'exportacao_criada',
    mensagem: `Lote criado com ${obraIds.length} obra(s).`,
    dados_json: { destino, formato, cwr_version: cwrVersion, obra_ids: obraIds },
    timestamp: new Date().toISOString(),
  })

  return NextResponse.json({ data: exportacao }, { status: 201 })
}
/**
 * GET /api/obras/[id]/integridade
 *
 * Calcula o status de integridade editorial da obra e persiste no banco.
 * Retorna o resultado completo com pendências acionáveis.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calcularIntegridade } from '@/lib/integridade-editorial'

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

async function fetchObraCompat(
  sb: any,
  obraId: string,
  tenantId: string,
) {
  const tentativaNova = await sb.from('obras')
    .select([
      'id', 'status_catalogo', 'contrato_origem_id',
      'contrato_manual_url', 'contrato_manual_nome', 'status_contrato',
      'exportacao_bloqueada', 'origem_cadastro', 'socinpro_status',
      'validacao_editorial_origem',
    ].join(', '))
    .eq('id', obraId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  if (!tentativaNova.error && tentativaNova.data) return tentativaNova.data

  const tentativaLegada = await sb.from('obras')
    .select('id, status_catalogo, contrato_origem_id, exportacao_bloqueada, origem_cadastro, socinpro_status')
    .eq('id', obraId)
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .single()

  return tentativaLegada.data ?? null
}

async function fetchTitularesCompat(
  sb: any,
  obraId: string,
  tenantId: string,
) {
  const tentativaNova = await sb.from('obras_links_titulares')
    .select([
      'id', 'link_id', 'titular_id', 'controlado',
      'editora_original_id', 'editora_administradora_id',
      'status_controle', 'percentual_controle_brasil', 'percentual_controle_exterior',
      'percentual', 'percentual_exec_publica', 'percentual_fonomecanico', 'percentual_sincronizacao',
    ].join(', '))
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  if (!tentativaNova.error && (tentativaNova.data?.length ?? 0) > 0) return tentativaNova.data ?? []

  const tentativaLegada = await sb.from('obras_links_titulares')
    .select([
      'id', 'obra_link_id', 'titular_id', 'controlado',
      'editora_id', 'editora_original_id', 'editora_administradora_id', 'status_controle',
      'percentual_exec_publica', 'percentual_fonomecanico', 'percentual_sincronizacao',
    ].join(', '))
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  return ((tentativaLegada.data ?? []) as Array<Record<string, unknown>>).map((item) => ({
    id: item.id,
    link_id: item.obra_link_id,
    titular_id: item.titular_id,
    controlado: item.controlado,
    editora_original_id: item.editora_original_id ?? item.editora_id ?? null,
    editora_administradora_id: item.editora_administradora_id,
    status_controle: item.status_controle ?? (item.controlado ? 'controlado' : null),
    percentual_controle_brasil: item.percentual_exec_publica ?? null,
    percentual_controle_exterior: item.percentual_exec_publica ?? null,
    percentual: item.percentual_exec_publica ?? null,
    percentual_exec_publica: item.percentual_exec_publica,
    percentual_fonomecanico: item.percentual_fonomecanico,
    percentual_sincronizacao: item.percentual_sincronizacao,
  }))
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  if (!usuario?.tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obraId } = await params

  // Buscar obra + links + titulares_por_link em paralelo
  const [obra, links, titulares] = await Promise.all([
    fetchObraCompat(sb, obraId, usuario.tenant_id),
    sb.from('obras_links')
      .select('id, numero_link, percentual_link, controlado')
      .eq('obra_id', obraId)
      .eq('tenant_id', usuario.tenant_id)
      .then((res) => res.data ?? []),
    fetchTitularesCompat(sb, obraId, usuario.tenant_id),
  ])

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const resultado = calcularIntegridade(
    obra as unknown as Parameters<typeof calcularIntegridade>[0],
    links as unknown as Parameters<typeof calcularIntegridade>[1],
    titulares as unknown as Parameters<typeof calcularIntegridade>[2],
  )

  // Persistir status + pendências na obra
  const tentativaPersistencia = await sb.from('obras').update({
    status_integridade:       resultado.status,
    integridade_calculada_em: new Date().toISOString(),
    integridade_pendencias:   resultado.pendencias,
  }).eq('id', obraId).eq('tenant_id', usuario.tenant_id)

  if (tentativaPersistencia.error) {
    await sb.from('obras').update({
      status_integridade: resultado.status,
    }).eq('id', obraId).eq('tenant_id', usuario.tenant_id)
  }

  return NextResponse.json({
    data: {
      obra_id:    obraId,
      ...resultado,
      calculado_em: new Date().toISOString(),
    }
  })
}

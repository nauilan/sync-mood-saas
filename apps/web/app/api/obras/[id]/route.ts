import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import { detectarCamposCriticos } from '@/lib/contrato-integridade'

const sanitize = (v: string | undefined) => (v ?? '').replace(/^\uFEFF/, '').trim()
const SUPABASE_URL = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)
const ANON_KEY     = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY)

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(req: NextRequest, sb: any): Promise<{ id: string; tenant_id: string; role: string } | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('id, tenant_id, role').eq('auth_user_id', user.id).single()
  return data as { id: string; tenant_id: string; role: string } | null
}

function tokenSource(req: NextRequest): 'authorization' | 'cookie' | 'none' {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return 'authorization'
  return getToken(req) ? 'cookie' : 'none'
}

function serializeError(error: unknown) {
  if (!error || typeof error !== 'object') return error
  const err = error as Record<string, unknown>
  return {
    name: err.name,
    message: err.message,
    status: err.status,
    code: err.code,
    details: err.details,
    hint: err.hint,
    raw: JSON.stringify(err),
  }
}

// Mapa CWR funcao_no_link → papel normalizado (espelhado em /links)
const CWR_ROLE_MAP: Record<string, string> = {
  E:  'editora_original',
  SE: 'subeditora', SA: 'subeditora',
  AM: 'administradora',
  CA: 'compositor', C: 'compositor', CE: 'compositor',
  A:  'autor',      T:  'autor',
  V:  'versionista', AD: 'adaptador',
  I:  'interprete_referencia',
}

// ── GET /api/obras/[id] ─────────────────────────────────────────────────────
// Suporta ?include=links — quando presente, anexa links+titulares no response
// (retrocompatível: sem o param, retorna exatamente o mesmo que antes)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const includeLinks = new URL(req.url).searchParams.get('include') === 'links'

  try {
    // Obra e links buscados em paralelo quando ?include=links está presente
    const linksQuery = includeLinks
      ? sb.from('obras_links')
          .select(`
            id, obra_id, numero_link, percentual_link, tipo_link, controlado, status,
            obras_links_titulares (
              id, obra_link_id, nome, papel, funcao_no_link,
              percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
              controlado, ipi, cae,
              titular_id, editora_id, editora_original_id, editora_administradora_id,
              contrato_id, status_controle,
              pct_repr_grafica, pct_repr_fonomecanica, pct_inclusao_audiovisual,
              pct_inclusao_publicitaria, pct_distribuicao_meios, pct_inclusao_base_dados,
              pct_comunicacao_publico, pct_autorizacoes_onus,
              pct_ext_repr_grafica, pct_ext_repr_fonomecanica, pct_ext_inclusao_audiovisual,
              pct_ext_inclusao_publicitaria, pct_ext_distribuicao_meios, pct_ext_inclusao_base_dados,
              pct_ext_comunicacao_publico,
              titulares ( codigo_interno )
            )
          `)
          .eq('obra_id', id)
          .eq('tenant_id', usuario.tenant_id)
          .eq('status', 'ativo')
          .order('numero_link')
          .then((r: { data: unknown; error: unknown }) => r)
      : Promise.resolve(null)

    const [obraRes, linksRes] = await Promise.all([
      sb.from('obras').select('*').eq('id', id).eq('tenant_id', usuario.tenant_id).is('deleted_at', null).single(),
      linksQuery,
    ])

    const { data: row, error } = obraRes as { data: Record<string, unknown> | null; error: unknown }
    if (error || !row) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

    // Enrich com info do contrato para o modal de exclusão
    let contrato_obras_count: number | null = null
    let contrato_numero: string | null = null
    if (row.contrato_origem_id) {
      const [countRes, ctrRes] = await Promise.all([
        sb.from('contrato_obras').select('*', { count: 'exact', head: true }).eq('contrato_id', row.contrato_origem_id),
        sb.from('contratos').select('numero').eq('id', row.contrato_origem_id).single(),
      ])
      contrato_obras_count = countRes.count ?? null
      contrato_numero = (ctrRes.data as { numero?: string } | null)?.numero ?? null
    }

    // Montar links normalizados (mesmo formato que /links retorna)
    let links: unknown[] | undefined
    if (includeLinks && linksRes) {
      const { data: linksData } = linksRes as { data: any[] | null }
      links = (linksData ?? []).map((l: any) => ({
        ...l,
        titulares: (l.obras_links_titulares ?? []).map((t: any) => {
          const fn = (t.funcao_no_link ?? '').toUpperCase()
          const papel = fn ? (CWR_ROLE_MAP[fn] ?? t.papel ?? 'autor') : (t.papel ?? 'autor')
          const { titulares: titNested, ...rest } = t
          return {
            ...rest,
            link_id: t.obra_link_id ?? l.id,
            papel,
            codigo_interno: (titNested as any)?.codigo_interno ?? null,
          }
        }),
        obras_links_titulares: undefined,
      }))
    }

    return NextResponse.json({
      data: {
        ...row,
        contrato_obras_count,
        contrato_numero,
        ...(includeLinks ? { links } : {}),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── PATCH /api/obras/[id] — atualizar obra ──────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  const { id } = await params
  console.info('[obra-patch-debug][backend][received]', {
    id,
    method: req.method,
    path: new URL(req.url).pathname,
    hasAuthorizationHeader: Boolean(req.headers.get('authorization')),
    tokenSource: tokenSource(req),
    cookieNames: req.cookies.getAll().map(cookie => cookie.name),
  })

  if (!sb) {
    console.info('[obra-patch-debug][backend][admin-client]', { id, ok: false, reason: 'Supabase não configurado' })
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  }

  const usuario = await autenticar(req, sb)
  console.info('[obra-patch-debug][backend][auth]', {
    id,
    authenticated: Boolean(usuario),
    usuarioId: usuario?.id ?? null,
    tenantId: usuario?.tenant_id ?? null,
    role: usuario?.role ?? null,
  })
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    console.info('[obra-patch-debug][backend][body]', { id, ok: false, reason: 'JSON inválido' })
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }
  console.info('[obra-patch-debug][backend][body]', {
    id,
    keys: Object.keys(body),
    subtitulo: body.subtitulo ?? null,
    titulo: body.titulo ?? null,
    titulo_alternativo: body.titulo_alternativo ?? null,
  })

  const ALLOWED = [
    'titulo', 'titulo_alternativo', 'subtitulo', 'idioma', 'genero_musical',
    'ano_criacao', 'duracao_segundos', 'letra', 'status', 'iswc', 'codigo_obra',
    'observacoes', 'contrato_origem_id', 'interprete_referencia', 'editora_id',
    'status_catalogo', 'origem_editora_id',
    // Migration 059 — CWR/Socinpro/BackOffice
    'titulo_original', 'cwr_work_id', 'socinpro_obra_id', 'socinpro_status',
    'exportacao_bloqueada', 'exportacao_bloqueio_motivo',
    // Migration 058 — campos editoriais completos
    'iswc_anterior', 'iswc_alternativo', 'iswc_origem', 'status_iswc',
    'territorio', 'prazo_inicio', 'prazo_fim', 'prazo_indeterminado',
    'direitos_administrados',
    // Migration 059 — campos operacionais BackOffice
    'backoffice_status', 'backoffice_song_id', 'backoffice_work_id',
    'backoffice_data_ultimo_envio', 'backoffice_data_ultimo_retorno',
    'backoffice_ultimo_arquivo', 'backoffice_ultimo_log',
    'backoffice_song_linkages', 'backoffice_oni_codes',
    'backoffice_counter_claims', 'backoffice_tickets', 'backoffice_alta_baixa',
    // Migration 060 — integridade contratual
    'status_contrato', 'requer_recontracao', 'motivo_recontracao',
    'contrato_manual_url', 'contrato_manual_nome', 'contrato_manual_em',
  ]

  const update: Record<string, unknown> = {}
  for (const k of ALLOWED) {
    if (k in body) update[k] = body[k]
  }
  // Compatibilidade: 'genero' → 'genero_musical'
  if ('genero' in body && !('genero_musical' in update)) update.genero_musical = body.genero

  if (Object.keys(update).length === 0) {
    console.info('[obra-patch-debug][backend][update-payload]', {
      id,
      ok: false,
      reason: 'Nenhum campo válido para atualizar',
      bodyKeys: Object.keys(body),
    })
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
  }
  console.info('[obra-patch-debug][backend][update-payload]', {
    id,
    keys: Object.keys(update),
    subtitulo: update.subtitulo ?? null,
    titulo: update.titulo ?? null,
    titulo_alternativo: update.titulo_alternativo ?? null,
  })

  const { data: anterior } = await sb
    .from('obras')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  console.info('[obra-patch-debug][backend][before-row]', {
    id,
    found: Boolean(anterior),
    subtitulo: (anterior as Record<string, unknown> | null)?.subtitulo ?? null,
    titulo: (anterior as Record<string, unknown> | null)?.titulo ?? null,
    updated_at: (anterior as Record<string, unknown> | null)?.updated_at ?? null,
  })
  if (!anterior) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  // ── Interceptor de campos críticos (Migration 060) ────────────────────────
  // Se um campo crítico mudou E a obra tem links controlados,
  // marcar como recontratação pendente e bloquear exportação.
  const camposCriticosAlterados = detectarCamposCriticos(update, anterior as Record<string, unknown>)
  let recontratacaoExigida = false
  if (camposCriticosAlterados.length > 0) {
    const { count: linksControlados } = await sb
      .from('obras_links_titulares')
      .select('*', { count: 'exact', head: true })
      .eq('obra_id', id)
      .eq('controlado', true)
    if ((linksControlados ?? 0) > 0) {
      recontratacaoExigida = true
      update.requer_recontracao   = true
      update.status_contrato      = 'recontratacao_pendente'
      update.exportacao_bloqueada = true
      update.exportacao_bloqueio_motivo = `Recontratação exigida — campo(s) crítico(s) alterado(s): ${camposCriticosAlterados.join(', ')}`
      update.motivo_recontracao   = `Edição de campo crítico: ${camposCriticosAlterados.join(', ')}`
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { data, error } = await sb
    .from('obras')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  console.info('[obra-patch-debug][backend][supabase-update]', {
    id,
    ok: !error,
    error: serializeError(error),
    returnedId: data?.id ?? null,
    returnedSubtitulo: data?.subtitulo ?? null,
    returnedUpdatedAt: data?.updated_at ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: reread, error: rereadError } = await sb
    .from('obras')
    .select('id, titulo, subtitulo, titulo_alternativo, updated_at')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()
  console.info('[obra-patch-debug][backend][reread-after-update]', {
    id,
    ok: !rereadError,
    error: serializeError(rereadError),
    subtitulo: reread?.subtitulo ?? null,
    titulo: reread?.titulo ?? null,
    titulo_alternativo: reread?.titulo_alternativo ?? null,
    updated_at: reread?.updated_at ?? null,
  })

  // ── Auto-registrar alterações em obras_historico ──────────────────────────
  const CAMPOS_RASTREAR = [
    'titulo', 'titulo_alternativo', 'subtitulo', 'idioma', 'genero_musical',
    'ano_criacao', 'letra', 'iswc', 'codigo_obra', 'status', 'status_catalogo',
    'interprete_referencia', 'editora_id', 'contrato_origem_id', 'observacoes',
    'titulo_original', 'cwr_work_id', 'socinpro_obra_id', 'socinpro_status',
    'exportacao_bloqueada',
    // Migration 058
    'iswc_anterior', 'iswc_alternativo', 'iswc_origem', 'status_iswc',
    'territorio', 'prazo_inicio', 'prazo_fim', 'prazo_indeterminado',
    'direitos_administrados',
    // Migration 059 — BackOffice
    'backoffice_status', 'backoffice_song_id', 'backoffice_work_id',
  ]
  const historico = CAMPOS_RASTREAR
    .filter(campo => campo in update && String(anterior[campo] ?? '') !== String(update[campo] ?? ''))
    .map(campo => ({
      obra_id:        id,
      tenant_id:      usuario.tenant_id,
      usuario_id:     usuario.id ?? null,
      campo,
      valor_anterior: anterior[campo] != null ? String(anterior[campo]) : null,
      valor_novo:     update[campo] != null ? String(update[campo]) : null,
      origem:         'usuario',
    }))
  if (historico.length > 0) {
    await sb.from('obras_historico').insert(historico)
  }
  // ─────────────────────────────────────────────────────────────────────────

  await logAudit({
    tenant_id: usuario.tenant_id,
    acao: 'alterar',
    modulo: 'obras',
    tabela_afetada: 'obras',
    registro_id: id,
    dados_anteriores: anterior as Record<string, unknown>,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  console.info('[obra-patch-debug][backend][response]', {
    id,
    status: 200,
    recontratacao_exigida: recontratacaoExigida,
    responseSubtitulo: data?.subtitulo ?? null,
  })
  return NextResponse.json({ data, recontratacao_exigida: recontratacaoExigida })
}

// ── DELETE /api/obras/[id] — hard delete em cascata ─────────────────────────
// Query param: ?cascade=contrato  → apaga também o contrato e todas as suas obras
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sbNullable = getAdminClient()
  if (!sbNullable) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })
  const sb = sbNullable

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const cascade = new URL(req.url).searchParams.get('cascade') // 'contrato' | null

  // 1. Verificar que a obra pertence ao tenant
  const { data: obra } = await sb
    .from('obras')
    .select('id, titulo, contrato_origem_id')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const CHUNK = 200

  // Função auxiliar: apaga obras em cascata (links + fonogramas + obra)
  async function deleteObras(obraIds: string[]) {
    for (let i = 0; i < obraIds.length; i += CHUNK) {
      const sl = obraIds.slice(i, i + CHUNK)
      await sb.from('obras_links_titulares').delete().in('obra_id', sl)
      await sb.from('fonogramas').delete().in('obra_id', sl)
      await sb.from('obras_links').delete().in('obra_id', sl)
    }
    let removed = 0
    for (let i = 0; i < obraIds.length; i += CHUNK) {
      const { count } = await sb.from('obras').delete({ count: 'exact' }).in('id', obraIds.slice(i, i + CHUNK))
      removed += count ?? 0
    }
    return removed
  }

  let obrasRemovidas = 0
  let contratoRemovido: string | null = null

  if (cascade === 'contrato' && obra.contrato_origem_id) {
    // ── Cascata: apagar contrato + todas as obras dele ────────────────────────
    const contratoId = obra.contrato_origem_id

    // Coletar todas as obras do contrato (junction + FK direto)
    const [{ data: coRows }, { data: obrasDir }] = await Promise.all([
      sb.from('contrato_obras').select('obra_id').eq('contrato_id', contratoId),
      sb.from('obras').select('id').eq('contrato_origem_id', contratoId),
    ])

    const todasObras = [...new Set([
      ...(coRows ?? []).map((r: any) => r.obra_id as string).filter(Boolean),
      ...(obrasDir ?? []).map((r: any) => r.id as string).filter(Boolean),
      id, // garantir que a obra clicada está incluída
    ])]

    obrasRemovidas = await deleteObras(todasObras)

    // Apagar junction + contrato
    await sb.from('contrato_obras').delete().eq('contrato_id', contratoId)
    await sb.from('contratos').delete().eq('id', contratoId)
    contratoRemovido = contratoId

  } else {
    // ── Apagar somente esta obra ──────────────────────────────────────────────
    obrasRemovidas = await deleteObras([id])
  }

  await logAudit({
    tenant_id: usuario.tenant_id,
    acao: 'deletar',
    modulo: 'obras',
    tabela_afetada: 'obras',
    registro_id: id,
    dados_anteriores: { titulo: obra.titulo, cascade, contrato_origem_id: obra.contrato_origem_id },
    dados_novos: null,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({
    ok: true,
    obras_removidas: obrasRemovidas,
    contrato_removido: contratoRemovido,
    titulo: obra.titulo,
  })
}

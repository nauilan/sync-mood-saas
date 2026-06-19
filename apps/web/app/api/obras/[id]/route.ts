import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

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

// ── GET /api/obras/[id] ─────────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const { data: row, error } = await sb
      .from('obras')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', usuario.tenant_id)
      .is('deleted_at', null)
      .single()

    if (error || !row) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })
    return NextResponse.json({ data: row })
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
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

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
  ]

  const update: Record<string, unknown> = {}
  for (const k of ALLOWED) {
    if (k in body) update[k] = body[k]
  }
  // Compatibilidade: 'genero' → 'genero_musical'
  if ('genero' in body && !('genero_musical' in update)) update.genero_musical = body.genero

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
  }

  const { data: anterior } = await sb
    .from('obras')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!anterior) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const { data, error } = await sb
    .from('obras')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

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

  return NextResponse.json({ data })
}

// ── DELETE /api/obras/[id] — soft delete ────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data: obra } = await sb
    .from('obras')
    .select('id, titulo')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .is('deleted_at', null)
    .single()

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const { error } = await sb
    .from('obras')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, message: `Obra "${obra.titulo}" excluída.` })
}

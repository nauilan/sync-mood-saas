import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'

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
async function autenticar(sb: any, req: NextRequest): Promise<string | null> {
  const token = getToken(req)
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data: usuario } = await sb
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  return usuario?.tenant_id ?? null
}

// ── GET /api/contratos/[id] ─────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data: raw, error } = await sb
    .from('contratos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .is('deleted_at', null)
    .single()

  if (error || !raw) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  // ── Joins paralelos ──────────────────────────────────────────
  const [titularRes, editoraRes, editoraFallbackRes] = await Promise.all([
    raw.titular_id
      ? sb.from('titulares').select('nome_completo, pessoa').eq('id', raw.titular_id).single()
      : Promise.resolve({ data: null }),
    raw.editora_id
      ? sb.from('editoras').select('nome_fantasia, razao_social').eq('id', raw.editora_id).single()
      : Promise.resolve({ data: null }),
    !raw.editora_id
      ? sb.from('editoras').select('id, nome_fantasia, razao_social').eq('tenant_id', tenant_id).limit(1).single()
      : Promise.resolve({ data: null }),
  ])

  const titular = titularRes.data as { nome_completo: string; pessoa?: string } | null
  const editora = (editoraRes.data ?? editoraFallbackRes.data) as { nome_fantasia?: string; razao_social?: string } | null

  // ── Mapeamento de campos: DB → ContratoV2 ────────────────────
  const contrato = {
    ...raw,
    // Nomes esperados pelo frontend (ContratoV2)
    vigencia_inicio:      raw.data_inicio ?? raw.vigencia_inicio ?? null,
    vigencia_fim:         raw.data_fim    ?? raw.vigencia_fim    ?? null,
    territorio_principal: raw.territorio  ?? raw.territorio_principal ?? 'Brasil e Exterior',
    // Joins
    titular_principal:    titular?.nome_completo ?? null,
    titular_tipo_pessoa:  titular?.pessoa === 'PJ' ? 'PJ' : 'PF',
    editora_nome:         editora?.nome_fantasia ?? editora?.razao_social ?? '—',
    editora_id:           raw.editora_id ?? editoraFallbackRes.data?.id ?? null,
    // Booleans com default seguro
    prazo_indeterminado:  raw.prazo_indeterminado  ?? false,
    exclusividade:        raw.exclusividade         ?? false,
    clausula_reversao:    raw.clausula_reversao     ?? false,
    prazo_reversao_anos:  raw.prazo_reversao_anos   ?? null,
    renovacao_automatica: raw.renovacao_automatica  ?? false,
    // Arrays vazios para abas (rascunho ainda não tem joins formais)
    _partes:      [],
    _direitos:    Array.isArray(raw.splits_direitos) ? raw.splits_direitos : [],
    _obras:       [],
    _assinaturas: [],
    _recoupment:  [],
    _aditivos:    [],
    _historico:   [],
    // KPIs
    _obras_count:           Array.isArray(raw.obras_json) ? raw.obras_json.length : 0,
    _assinaturas_pendentes: Array.isArray(raw.assinantes_d4sign) ? raw.assinantes_d4sign.length : 0,
    _recoupment_aberto:     0,
  }

  return NextResponse.json({ contrato })
}

// ── PATCH /api/contratos/[id] ───────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const tenant_id = await autenticar(sb, req)
  if (!tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  // Normalizar nomes de campo do frontend → DB
  if ('vigencia_inicio' in body && !('data_inicio' in body)) body.data_inicio = body.vigencia_inicio
  if ('vigencia_fim' in body && !('data_fim' in body)) body.data_fim = body.vigencia_fim
  if ('territorio_principal' in body && !('territorio' in body)) body.territorio = body.territorio_principal

  // Buscar registro anterior para audit
  const { data: anterior } = await sb
    .from('contratos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!anterior) return NextResponse.json({ error: 'Contrato não encontrado' }, { status: 404 })

  const { data, error } = await sb
    .from('contratos')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id,
    acao: 'alterar',
    modulo: 'contratos',
    tabela_afetada: 'contratos',
    registro_id: id,
    dados_anteriores: anterior,
    dados_novos: data,
    origem_execucao: 'usuario',
  })

  return NextResponse.json({ contrato: data })
}

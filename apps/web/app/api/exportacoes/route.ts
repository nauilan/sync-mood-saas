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

// ── GET /api/exportacoes ─────────────────────────────────────────────────────
// Lista exportações do tenant. Aceita ?obra_id=[id] para filtrar por obra.
export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('tenant_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const obraId = searchParams.get('obra_id')

  if (obraId) {
    // Filtrar exportações que incluem esta obra
    const { data, error } = await sb
      .from('exportacoes_obras')
      .select(`
        id,
        exportacao_id,
        status_obra,
        codigo_externo_retornado,
        exportacoes!inner (
          id,
          codigo,
          destino,
          formato,
          status,
          criado_em,
          tenant_id
        )
      `)
      .eq('obra_id', obraId)
      .eq('exportacoes.tenant_id', usuario.tenant_id)
      .order('exportacoes.criado_em', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const result = (data ?? []).map((row: Record<string, unknown>) => {
      const exp = row.exportacoes as Record<string, unknown> | null
      return {
        id:                       row.id,
        exportacao_id:            row.exportacao_id,
        status_obra:              row.status_obra,
        codigo_externo_retornado: row.codigo_externo_retornado,
        codigo:                   exp?.codigo,
        destino:                  exp?.destino,
        formato:                  exp?.formato,
        status:                   exp?.status,
        criado_em:                exp?.criado_em,
      }
    })

    return NextResponse.json({ data: result })
  }

  // Listar todas as exportações do tenant
  const { data, error } = await sb
    .from('exportacoes')
    .select('id, codigo, destino, formato, total_obras, status, arquivo_url, criado_em, editora_id, tenant_id')
    .eq('tenant_id', usuario.tenant_id)
    .order('criado_em', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

// ── POST /api/exportacoes ────────────────────────────────────────────────────
// Cria novo lote de exportação.
// Valida que todas as obras estão catalogo_ativo e com score = 100.
export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (!['master', 'admin'].includes(usuario.role ?? '')) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const { destino, formato, obra_ids, editora_id, periodo_inicio, periodo_fim } = body as {
    destino?: string
    formato?: string
    obra_ids?: string[]
    editora_id?: string
    periodo_inicio?: string
    periodo_fim?: string
  }

  if (!destino) return NextResponse.json({ error: 'Campo "destino" obrigatório' }, { status: 400 })
  if (!formato) return NextResponse.json({ error: 'Campo "formato" obrigatório' }, { status: 400 })

  // obra_ids é opcional na criação de rascunho
  const obraIds: string[] = Array.isArray(obra_ids) ? obra_ids : []

  // Se obra_ids fornecidos, validar cada uma
  let obrasEncontradas: Record<string, unknown>[] = []
  if (obraIds.length > 0) {
    const { data: obras } = await sb
      .from('obras')
      .select('*')
      .in('id', obraIds)
      .eq('tenant_id', usuario.tenant_id)
      .is('deleted_at', null)

    obrasEncontradas = obras ?? []
    if (obrasEncontradas.length !== obraIds.length) {
      return NextResponse.json({ error: 'Uma ou mais obras não encontradas' }, { status: 404 })
    }

    // Validar: todas devem ser catalogo_ativo
    const naoAtivas = obrasEncontradas.filter((o) => o.status_catalogo !== 'catalogo_ativo')
    if (naoAtivas.length > 0) {
      return NextResponse.json({
        error: `${naoAtivas.length} obra(s) não estão em "Catálogo Ativo": ${naoAtivas.map((o) => o.titulo).join(', ')}`,
        obras_bloqueadas: naoAtivas.map((o) => ({ id: o.id, titulo: o.titulo, status_catalogo: o.status_catalogo })),
      }, { status: 422 })
    }

    // Validar completude de cada obra
    const errosCompletude: { id: unknown; titulo: unknown; score: number; pendencias: unknown[] }[] = []
    for (const obra of obrasEncontradas) {
      const [{ data: participantes }, { data: fonogramas }] = await Promise.all([
        sb.from('obras_participantes').select('id, percentual').eq('obra_id', obra.id).eq('tenant_id', usuario.tenant_id),
        sb.from('fonogramas').select('id, isrc').eq('obra_id', obra.id).eq('tenant_id', usuario.tenant_id),
      ])
      const resultado = calcularCompletude(
        obra,
        (participantes ?? []) as Record<string, unknown>[],
        (fonogramas ?? []) as Record<string, unknown>[],
      )
      if (resultado.bloqueado) {
        errosCompletude.push({ id: obra.id, titulo: obra.titulo, score: resultado.score, pendencias: resultado.pendencias })
      }
    }
    if (errosCompletude.length > 0) {
      return NextResponse.json({
        error: `${errosCompletude.length} obra(s) com cadastro incompleto. Complete antes de exportar.`,
        obras_incompletas: errosCompletude,
      }, { status: 422 })
    }
  }

  // Gerar código sequencial: EXP-{YYYYMM}-{seq}
  const mesAtual = new Date().toISOString().slice(0, 7).replace('-', '')
  const { count } = await sb
    .from('exportacoes')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', usuario.tenant_id)
  const seq = String((count ?? 0) + 1).padStart(3, '0')
  const codigo = `EXP-${mesAtual}-${seq}`

  // Criar exportação
  const { data: exportacao, error: errExp } = await sb
    .from('exportacoes')
    .insert({
      codigo,
      destino,
      formato,
      total_obras:    obraIds.length,
      status:         'rascunho',
      editora_id:     editora_id ?? null,
      tenant_id:      usuario.tenant_id,
      periodo_inicio: periodo_inicio ?? null,
      periodo_fim:    periodo_fim ?? null,
    })
    .select()
    .single()

  if (errExp) return NextResponse.json({ error: errExp.message }, { status: 500 })

  // Inserir obras na fila se houver
  if (obraIds.length > 0) {
    const obrasExportacao = obraIds.map((obraId: string) => ({
      exportacao_id: exportacao.id,
      obra_id:       obraId,
      status_obra:   'incluida',
    }))
    await sb.from('exportacoes_obras').insert(obrasExportacao)
  }

  // Log inicial
  await sb.from('exportacoes_logs').insert({
    exportacao_id: exportacao.id,
    evento:        'criacao',
    mensagem:      `Exportação criada. ${obraIds.length} obras na fila.`,
    dados_json:    { destino, formato, total: obraIds.length },
    timestamp:     new Date().toISOString(),
  })

  return NextResponse.json({ data: exportacao }, { status: 201 })
}

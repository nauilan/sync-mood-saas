import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logAudit } from '@/lib/audit'
import { resolverRecebedorEditorial } from '@/lib/editorial-recebedor'

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
    if (m) {
      chunks[parseInt(m[1])] = c.value
      continue
    }
    if (c.name.endsWith('auth-token') && !c.name.match(/\.\d+$/)) chunks[0] = c.value
  }
  const joined = chunks.filter(Boolean).join('')
  if (joined) {
    try {
      const p = JSON.parse(decodeURIComponent(joined))
      if (p?.access_token) return p.access_token
    } catch {}
    try {
      const p = JSON.parse(joined)
      if (p?.access_token) return p.access_token
    } catch {}
  }
  return ''
}

async function autenticar(sb: any, req: NextRequest) {
  const token = getToken(req)
  if (!token) return null
  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return null
  const { data: usuario } = await sb
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()
  return usuario as { id: string; tenant_id: string; role: string } | null
}

async function obterStatusIntegridadeObra(
  req: NextRequest,
  sb: any,
  obraId: string,
  tenantId: string,
): Promise<string | null> {
  const tentativaNova = await sb.from('obras')
    .select('status_integridade')
    .eq('id', obraId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tentativaNova.error) {
    return (tentativaNova.data as Record<string, unknown> | null)?.status_integridade as string | null
  }

  const baseUrl = new URL(req.url).origin
  const authHeader = req.headers.get('authorization') ?? ''
  const tentativaApi = await fetch(new URL(`/api/obras/${obraId}/integridade`, baseUrl).toString(), {
    headers: { authorization: authHeader },
  }).catch(() => null)

  if (tentativaApi?.ok) {
    const body = await tentativaApi.json().catch(() => null)
    return (body as any)?.data?.status ?? null
  }

  return null
}

function gerarNumeroAutorizacao(): string {
  const now = new Date()
  return `AUT-${now.getFullYear()}-${Date.now().toString().slice(-6)}`
}

async function fetchRecebedorLinksCompat(sb: any, obraId: string, tenantId: string) {
  const { data: rows } = await sb.from('obras_links_titulares')
    .select([
      'funcao_no_link',
      'papel',
      'controlado',
      'status_controle',
      'percentual_controle_brasil',
      'percentual_controle_exterior',
      'percentual_exec_publica',
      'editora_id',
      'editora_original_id',
      'editora_administradora_id',
    ].join(', '))
    .eq('obra_id', obraId)
    .eq('tenant_id', tenantId)

  const baseRows = (rows ?? []) as Array<Record<string, unknown>>
  if (baseRows.length === 0) return []

  const editoraIds = Array.from(new Set(
    baseRows
      .flatMap((item) => [
        item.editora_id,
        item.editora_original_id,
        item.editora_administradora_id,
      ])
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  ))

  const { data: editoras } = editoraIds.length > 0
    ? await sb.from('editoras')
      .select('id, nome_fantasia, razao_social')
      .eq('tenant_id', tenantId)
      .in('id', editoraIds)
    : { data: [] as Array<Record<string, unknown>> }

  const editorasPorId = new Map(
    ((editoras ?? []) as Array<Record<string, unknown>>).map((item) => [
      String(item.id),
      {
        id: String(item.id),
        nome: String(item.nome_fantasia ?? item.razao_social ?? ''),
      },
    ]),
  )

  return baseRows.map((item) => ({
    papel: item.funcao_no_link ?? item.papel ?? null,
    controlado: item.controlado ?? null,
    status_controle: item.status_controle ?? null,
    percentual_controle_brasil: item.percentual_controle_brasil ?? item.percentual_exec_publica ?? null,
    percentual_controle_exterior: item.percentual_controle_exterior ?? item.percentual_exec_publica ?? null,
    percentual_controle: item.percentual_exec_publica ?? null,
    editora: item.editora_id ? editorasPorId.get(String(item.editora_id)) ?? null : null,
    editora_original: item.editora_original_id ? editorasPorId.get(String(item.editora_original_id)) ?? null : null,
    editora_administradora: item.editora_administradora_id ? editorasPorId.get(String(item.editora_administradora_id)) ?? null : null,
  }))
}

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status_workflow = searchParams.get('status_workflow') ?? ''
  const tipo_autorizacao = searchParams.get('tipo') ?? ''
  const obra_id = searchParams.get('obra_id') ?? ''
  const editora_id = searchParams.get('editora_id') ?? ''
  const per_page = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset = (page - 1) * per_page

  let q = sb.from('autorizacoes')
    .select('*', { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (status_workflow) q = q.eq('status_workflow', status_workflow)
  if (tipo_autorizacao) q = q.eq('tipo_autorizacao', tipo_autorizacao)
  if (obra_id) q = q.eq('obra_id', obra_id)
  if (editora_id) q = q.eq('editora_id', editora_id)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const [{ count: totalEmitidas }, { count: totalAguardando }, { count: totalRascunho }] = await Promise.all([
    sb.from('autorizacoes').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status_workflow', 'emitida'),
    sb.from('autorizacoes').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status_workflow', 'aguardando_aprovacao_admin'),
    sb.from('autorizacoes').select('*', { count: 'exact', head: true }).eq('tenant_id', usuario.tenant_id).eq('status_workflow', 'rascunho'),
  ])

  return NextResponse.json({
    data,
    total: count ?? 0,
    page,
    per_page,
    kpis: {
      total: count ?? 0,
      emitidas: totalEmitidas ?? 0,
      aguardando_aprovacao: totalAguardando ?? 0,
      rascunho: totalRascunho ?? 0,
    },
  })
}

export async function POST(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json()
  const {
    obra_id, editora_id, titular_id,
    tipo_autorizacao, finalidade, observacoes,
    licenciado_nome, licenciado_cnpj_cpf, licenciado_email,
    valor_licenca, moeda, territorio,
    prazo_inicio, prazo_fim, prazo_indeterminado,
    status_workflow: statusReq,
    editora_administrada_id,
    modelo_negocio,
    dados_especificos,
    dados_produto,
    pago_a,
    tipo_uso, licenciante, licenciado, data_inicio, data_fim, valor, descricao,
  } = body

  if (!obra_id) return NextResponse.json({ error: 'obra_id obrigatório' }, { status: 400 })

  const { data: obraCheck } = await sb
    .from('obras')
    .select('id')
    .eq('id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .single()
  if (!obraCheck) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  let nomeEditoraLicenciante = ''
  if (editora_id) {
    const { data: editoraRow } = await sb
      .from('editoras')
      .select('nome_fantasia, razao_social')
      .eq('id', editora_id)
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()
    nomeEditoraLicenciante = String(
      (editoraRow as any)?.nome_fantasia ??
      (editoraRow as any)?.razao_social ??
      ''
    )
  }

  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')
  let status_workflow = statusReq ?? 'rascunho'
  if (status_workflow === 'emitida' && !isAdmin) status_workflow = 'aguardando_aprovacao_admin'

  if (status_workflow === 'emitida') {
    const si = await obterStatusIntegridadeObra(req, sb, obra_id, usuario.tenant_id)
    if (si !== 'apta') {
      return NextResponse.json({
        error: `Autorização não pode ser emitida: a obra possui integridade editorial "${si ?? 'não calculada'}". Regularize via Saneamento Editorial antes de emitir.`,
        status_integridade: si ?? null,
      }, { status: 422 })
    }
  }

  let recebedorPagoA = pago_a ?? null
  const modeloNegocioResolvido = modelo_negocio ?? 'pago_editora'
  if (modeloNegocioResolvido === 'pago_editora') {
    const linksRecebedor = await fetchRecebedorLinksCompat(sb, obra_id, usuario.tenant_id)
    const recebedor = resolverRecebedorEditorial(linksRecebedor as any)
    if (!recebedor.ok) {
      return NextResponse.json({
        error: 'Autorização paga à editora exige recebedor válido (administradora ou editora original controlada).',
      }, { status: 422 })
    }
    recebedorPagoA = recebedor.editoraId
  }

  const emitida_em = status_workflow === 'emitida' ? new Date().toISOString() : null

  const payload: Record<string, unknown> = {
    tenant_id: usuario.tenant_id,
    obra_id,
    editora_id: editora_id ?? null,
    titular_id: titular_id ?? null,
    tipo_autorizacao: tipo_autorizacao ?? tipo_uso ?? null,
    status_workflow,
    finalidade: finalidade ?? descricao ?? null,
    descricao: finalidade ?? descricao ?? null,
    licenciado_nome: licenciado_nome ?? licenciado ?? null,
    licenciado_cnpj_cpf: licenciado_cnpj_cpf ?? null,
    licenciado_email: licenciado_email ?? null,
    valor_licenca: valor_licenca ?? valor ?? null,
    moeda: moeda ?? 'BRL',
    territorio: territorio ?? 'BR',
    prazo_inicio: prazo_inicio ?? data_inicio ?? null,
    prazo_fim: prazo_fim ?? data_fim ?? null,
    prazo_indeterminado: prazo_indeterminado ?? false,
    numero_autorizacao: gerarNumeroAutorizacao(),
    editora_administrada_id: editora_administrada_id ?? recebedorPagoA ?? null,
    emitida_por: status_workflow === 'emitida' ? usuario.id : null,
    emitida_em,
    modelo_negocio: modeloNegocioResolvido,
    observacoes: observacoes ?? null,
    dados_especificos: dados_especificos ?? {},
    dados_produto: dados_produto ?? {},
    validada_em: (status_workflow === 'emitida' && (modelo_negocio ?? 'pago_editora') === 'sem_onus') ? new Date().toISOString() : null,
    licenciante: licenciante ?? nomeEditoraLicenciante ?? 'Licenciante não informado',
    licenciado: licenciado ?? licenciado_nome ?? 'Licenciado não informado',
    tipo_uso: tipo_autorizacao ?? tipo_uso ?? null,
    data_inicio: prazo_inicio ?? data_inicio ?? new Date().toISOString().slice(0, 10),
    data_fim: prazo_fim ?? data_fim ?? null,
    valor: valor_licenca ?? valor ?? 0,
    status: status_workflow === 'emitida' ? 'vigente' : 'pendente',
  }

  const { data, error } = await sb.from('autorizacoes').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id: usuario.tenant_id,
    usuario_id: usuario.id,
    acao: 'criar',
    modulo: 'autorizacoes',
    tabela_afetada: 'autorizacoes',
    registro_id: (data as any).id,
    dados_novos: data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  const primeiroInterp = (dados_produto as any)?.interpretes?.[0]?.nome
  if (status_workflow === 'emitida' && primeiroInterp) {
    await sb.from('obras').update({
      interprete_referencia: primeiroInterp,
    }).eq('id', obra_id).eq('tenant_id', usuario.tenant_id)
  }

  return NextResponse.json({ data }, { status: 201 })
}
/**
 * GET  /api/autorizacoes — lista autorizações do tenant
 * POST /api/autorizacoes — cria autorização
 *
 * Regra de negócio:
 * - Usuário Master/Admin pode criar com status_workflow = 'emitida'
 * - Demais usuários só podem criar com status_workflow = 'rascunho' ou 'aguardando_aprovacao_admin'
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'
import { logAudit }                  from '@/lib/audit'
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

function gerarNumeroAutorizacao(): string {
  const now = new Date()
  const ano = now.getFullYear()
  const seq = Date.now().toString().slice(-6)
  return `AUT-${ano}-${seq}`
}

export async function GET(req: NextRequest) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Config inválida' }, { status: 500 })

  const usuario = await autenticar(sb, req)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status_workflow   = searchParams.get('status_workflow') ?? ''
  const tipo_autorizacao  = searchParams.get('tipo') ?? ''
  const obra_id           = searchParams.get('obra_id') ?? ''
  const editora_id        = searchParams.get('editora_id') ?? ''
  const per_page          = Math.min(Number(searchParams.get('per_page') ?? 50), 200)
  const page              = Math.max(Number(searchParams.get('page') ?? 1), 1)
  const offset            = (page - 1) * per_page

  let q = sb.from('autorizacoes')
    .select('*', { count: 'exact' })
    .eq('tenant_id', usuario.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + per_page - 1)

  if (status_workflow)  q = q.eq('status_workflow', status_workflow)
  if (tipo_autorizacao) q = q.eq('tipo_autorizacao', tipo_autorizacao)
  if (obra_id)          q = q.eq('obra_id', obra_id)
  if (editora_id)       q = q.eq('editora_id', editora_id)

  const { data, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // KPIs básicos
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
    // campos legados de compatibilidade
    tipo_uso, licenciante, licenciado, data_inicio, data_fim, valor, descricao,
  } = body

  if (!obra_id) return NextResponse.json({ error: 'obra_id obrigatório' }, { status: 400 })

  // Segurança: verificar que obra_id pertence ao tenant do usuário
  // Impede contaminação cross-tenant (Tenant B criando autorização para obra do Tenant A)
  const { data: obraCheck } = await sb
    .from('obras')
    .select('id')
    .eq('id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .single()
  if (!obraCheck) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const isAdmin = ['master', 'admin', 'administrador'].includes(usuario.role?.toLowerCase() ?? '')

  // Somente Admin/Master pode emitir diretamente
  let status_workflow = statusReq ?? 'rascunho'
  if (status_workflow === 'emitida' && !isAdmin) {
    status_workflow = 'aguardando_aprovacao_admin'
  }

  // Trava de integridade editorial: autorização só pode ser EMITIDA se a obra estiver apta.
  // Rascunhos e aguardando_aprovacao_admin passam livremente.
  if (status_workflow === 'emitida') {
    const { data: obraInteg } = await sb.from('obras')
      .select('status_integridade')
      .eq('id', obra_id)
      .eq('tenant_id', usuario.tenant_id)
      .single()
    const si = (obraInteg as Record<string, unknown> | null)?.status_integridade as string | null
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
    const { data: linksRecebedor } = await sb.from('obras_links_titulares')
      .select('papel:funcao_no_link, controlado, status_controle, percentual_controle_brasil, percentual_controle_exterior, percentual:percentual_exec_publica, editora:editoras!obras_links_titulares_editora_original_id_fkey(id,nome), editora_original:editoras!obras_links_titulares_editora_original_id_fkey(id,nome), editora_administradora:editoras!obras_links_titulares_editora_administradora_id_fkey(id,nome)')
      .eq('obra_id', obra_id)
      .eq('tenant_id', usuario.tenant_id)

    const recebedor = resolverRecebedorEditorial((linksRecebedor ?? []) as any)
    if (!recebedor.ok) {
      return NextResponse.json({
        error: 'AutorizaÃ§Ã£o paga Ã  editora exige recebedor vÃ¡lido (administradora ou editora original controlada).',
      }, { status: 422 })
    }
    recebedorPagoA = recebedor.editoraId
  }

  const emitida_em = status_workflow === 'emitida' ? new Date().toISOString() : null

  const payload: Record<string, unknown> = {
    tenant_id:              usuario.tenant_id,
    obra_id,
    editora_id:             editora_id ?? null,
    titular_id:             titular_id ?? null,
    tipo_autorizacao:       tipo_autorizacao ?? tipo_uso ?? null,
    status_workflow,
    finalidade:             finalidade ?? descricao ?? null,
    descricao:              finalidade ?? descricao ?? null,
    licenciado_nome:        licenciado_nome ?? licenciado ?? null,
    licenciado_cnpj_cpf:    licenciado_cnpj_cpf ?? null,
    licenciado_email:       licenciado_email ?? null,
    valor_licenca:          valor_licenca ?? valor ?? null,
    moeda:                  moeda ?? 'BRL',
    territorio:             territorio ?? 'BR',
    prazo_inicio:           prazo_inicio ?? data_inicio ?? null,
    prazo_fim:              prazo_fim ?? data_fim ?? null,
    prazo_indeterminado:    prazo_indeterminado ?? false,
    numero_autorizacao:     gerarNumeroAutorizacao(),
    editora_administrada_id: editora_administrada_id ?? null,
    emitida_por:            status_workflow === 'emitida' ? usuario.id : null,
    emitida_em,
    modelo_negocio:         modeloNegocioResolvido,
    pago_a:                 recebedorPagoA,
    observacoes:            observacoes ?? null,
    dados_especificos:      dados_especificos ?? {},
    dados_produto:          dados_produto ?? {},
    validada_em:            (status_workflow === 'emitida' && (modelo_negocio ?? 'pago_editora') === 'sem_onus') ? new Date().toISOString() : null,
    // legados
    licenciante:            licenciante ?? null,
    licenciado:             licenciado ?? null,
    tipo_uso:               tipo_autorizacao ?? tipo_uso ?? null,
    data_inicio:            prazo_inicio ?? data_inicio ?? new Date().toISOString().slice(0, 10),
    data_fim:               prazo_fim ?? data_fim ?? null,
    valor:                  valor_licenca ?? valor ?? 0,
    status:                 status_workflow === 'emitida' ? 'vigente' : 'pendente',
  }

  const { data, error } = await sb.from('autorizacoes').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    tenant_id:       usuario.tenant_id,
    usuario_id:      usuario.id,
    acao:            'criar',
    modulo:          'autorizacoes',
    tabela_afetada:  'autorizacoes',
    registro_id:     (data as any).id,
    dados_novos:     data as Record<string, unknown>,
    origem_execucao: 'usuario',
  })

  // Ao emitir: atualizar interprete_referencia da obra com primeiro interprete do produto
  const primeiroInterp = (dados_produto as any)?.interpretes?.[0]?.nome
  if (status_workflow === 'emitida' && primeiroInterp) {
    await sb.from('obras').update({
      interprete_referencia: primeiroInterp,
    }).eq('id', obra_id).eq('tenant_id', usuario.tenant_id)
  }

  return NextResponse.json({ data }, { status: 201 })
}

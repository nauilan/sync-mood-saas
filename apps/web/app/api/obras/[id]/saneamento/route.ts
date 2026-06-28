/**
 * GET /api/obras/[id]/saneamento
 *
 * Retorna o relatório detalhado de saneamento editorial da obra:
 * status_integridade, pendências por link, contrato, titulares controlados.
 * Não altera nada — apenas lê e calcula.
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
    .from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  if (!usuario?.tenant_id) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id: obraId } = await params

  // Carregar todos os dados necessários em paralelo
  const [
    { data: obra },
    { data: links },
    { data: titulares },
  ] = await Promise.all([
    sb.from('obras')
      .select([
        'id', 'titulo', 'codigo_obra', 'status_catalogo',
        'contrato_origem_id', 'contrato_manual_url', 'contrato_manual_nome',
        'status_contrato', 'exportacao_bloqueada', 'exportacao_bloqueio_motivo',
        'origem_cadastro', 'socinpro_status',
        'status_integridade', 'integridade_calculada_em', 'integridade_pendencias',
        'validacao_editorial_origem', 'validacao_editorial_referencia',
      ].join(', '))
      .eq('id', obraId)
      .eq('tenant_id', usuario.tenant_id)
      .is('deleted_at', null)
      .single(),

    sb.from('obras_links')
      .select('id, numero_link, percentual_link, tipo_link, controlado, percentual_controlado')
      .eq('obra_id', obraId)
      .eq('tenant_id', usuario.tenant_id)
      .order('numero_link', { ascending: true }),

    sb.from('obras_links_titulares')
      .select([
        'id', 'link_id', 'titular_id', 'funcao_no_link',
        'controlado', 'contrato_id',
        'editora_original_id', 'editora_administradora_id',
        'status_controle', 'percentual_controle_brasil', 'percentual_controle_exterior',
        'data_contrato', 'tipo_contrato', 'territorio_contrato', 'prazo_contrato',
        'validacao_contratual_origem', 'referencia_documental', 'observacao_validacao',
        'percentual', 'percentual_exec_publica',
        'percentual_fonomecanico', 'percentual_sincronizacao',
      ].join(', '))
      .eq('obra_id', obraId)
      .eq('tenant_id', usuario.tenant_id),
  ])

  if (!obra) return NextResponse.json({ error: 'Obra não encontrada' }, { status: 404 })

  const integridade = calcularIntegridade(
    obra as unknown as Parameters<typeof calcularIntegridade>[0],
    (links ?? []) as unknown as Parameters<typeof calcularIntegridade>[1],
    (titulares ?? []) as unknown as Parameters<typeof calcularIntegridade>[2],
  )

  // Enriquecer links com seus titulares e status individual
  const titularesArr = (titulares ?? []) as unknown as Array<{
    link_id: string
    percentual_exec_publica?: number | null
    percentual?: number | null
    controlado?: boolean | null
    editora_administradora_id?: string | null
    [k: string]: unknown
  }>

  const obraLinks = (links ?? []).map(link => {
    const lt = titularesArr.filter(t => t.link_id === link.id)
    const somaExec = lt.reduce((s, t) => s + (Number(t.percentual_exec_publica) || 0), 0)
    const somaGeral = lt.reduce((s, t) => s + (Number(t.percentual) || 0), 0)
    const soma = somaExec > 0 ? somaExec : somaGeral
    const percentuaisOk = lt.length === 0 || Math.abs(soma - 100) <= 0.5
    const recebedoresOk = lt.every(t => !t.controlado || t.editora_administradora_id)

    return {
      ...link,
      titulares: lt,
      total_titulares: lt.length,
      percentuais_ok: percentuaisOk,
      soma_percentuais: soma,
      recebedores_ok: recebedoresOk,
      link_ok: lt.length > 0 && percentuaisOk && recebedoresOk,
    }
  })

  // Buscar dados do contrato se vinculado
  let contrato = null
  const row = obra as unknown as Record<string, unknown>
  if (row.contrato_origem_id) {
    const { data: ctr } = await sb.from('contratos')
      .select('id, numero, tipo_contrato, status_contrato, titulo, data_vigencia_inicio, data_vigencia_fim')
      .eq('id', row.contrato_origem_id as string)
      .eq('tenant_id', usuario.tenant_id)
      .single()
    contrato = ctr
  }

  // Ações sugeridas com base nas pendências
  const acoes_sugeridas = integridade.pendencias.map(p => {
    const ACOES: Record<string, string> = {
      sem_contrato:          'Vincular um contrato à obra ou fazer upload do contrato manual',
      recontratacao_pendente:'Regularizar recontratação — revisar campos críticos alterados',
      sem_links:             'Cadastrar a formação editorial (links/participantes) da obra',
      link_sem_titular:      'Adicionar titulares ao link indicado',
      percentual_invalido:   'Corrigir percentuais para que somem 100%',
      recebedor_pendente:    'Definir editora administradora para os titulares controlados',
      cwr_nao_confirmado:    'Confirmar os dados editoriais da obra importada via CWR',
    }
    return { codigo: p.codigo, mensagem: p.mensagem, acao: ACOES[p.codigo] ?? 'Regularizar pendência' }
  })

  return NextResponse.json({
    data: {
      obra: {
        id:              obraId,
        titulo:          row.titulo,
        codigo_obra:     row.codigo_obra,
        status_catalogo: row.status_catalogo,
      },
      integridade,
      contrato,
      links: obraLinks,
      acoes_sugeridas,
      calculado_em: new Date().toISOString(),
    }
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase nÃ£o configurado' }, { status: 503 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: { user } } = await sb.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { data: usuario } = await sb
    .from('usuarios').select('id, tenant_id').eq('auth_user_id', user.id).single()
  if (!usuario?.tenant_id) return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })

  const { id: obraId } = await params
  const body = await req.json().catch(() => ({}))
  const linkId = body?.link_id as string | undefined
  if (!linkId) return NextResponse.json({ error: 'link_id obrigatÃ³rio' }, { status: 400 })

  const patch = {
    data_contrato: body?.data_contrato ?? null,
    tipo_contrato: body?.tipo_contrato ?? null,
    territorio_contrato: body?.territorio_contrato ?? null,
    prazo_contrato: body?.prazo_contrato ?? null,
    percentual_controle_brasil: body?.percentual_controle_brasil ?? null,
    percentual_controle_exterior: body?.percentual_controle_exterior ?? null,
    validacao_contratual_origem: body?.validacao_contratual_origem ?? 'declaratoria',
    referencia_documental: body?.referencia_documental ?? null,
    observacao_validacao: body?.observacao_validacao ?? null,
    controlado: body?.controlado ?? true,
    status_controle: body?.status_controle ?? 'controlado',
    editora_original_id: body?.editora_original_id ?? null,
    editora_administradora_id: body?.editora_administradora_id ?? null,
    validado_por_usuario_id: usuario.id,
    validado_em: new Date().toISOString(),
  }

  const { error } = await sb.from('obras_links_titulares')
    .update(patch)
    .eq('id', linkId)
    .eq('obra_id', obraId)
    .eq('tenant_id', usuario.tenant_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return GET(req, { params: Promise.resolve({ id: obraId }) })
}

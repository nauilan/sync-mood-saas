import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processarRecebimentoCCObra, getAdminClientForCC } from '@/lib/logica-cc-obra-v2'
import type { RecebimentoInput } from '@/lib/logica-cc-obra-v2'
import {
  executarBridge,
  type BridgeContexto,
  type ObraLinkInput,
  type LinkTitularInput,
  type ContratoEditorialInput,
  type NegocioEditorialInput,
  type CessaoInput,
} from '@/lib/bridge-analitico'

function getAdminClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autenticar(req: NextRequest, sb: any): Promise<{ tenant_id: string; role: string } | null> {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (!token) return null
  const { data: { user }, error } = await sb.auth.getUser(token)
  if (error || !user) return null
  const { data } = await sb.from('usuarios').select('tenant_id, role').eq('auth_user_id', user.id).single()
  const u = data as { tenant_id: string; role: string } | null
  return u
}

// ── Helpers de auto-bridge ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function autoExecutarBridge(sb: any, tenant_id: string, obra_id: string, tipo_direito_id: string | null, territorios: string[]) {
  // 1. Tipos de direito
  const { data: tiposDireitoDb } = await sb
    .from('tipos_direito')
    .select('id, codigo')
    .eq('ativo', true)
    .or('tenant_id.is.null,tenant_id.eq.' + tenant_id)
    .order('ordem')

  const tiposDireito = tipo_direito_id
    ? (tiposDireitoDb ?? []).filter((t: { id: string }) => t.id === tipo_direito_id)
    : (tiposDireitoDb ?? [])

  if (tiposDireito.length === 0) return { ok: false, error: 'Nenhum tipo de direito encontrado' }

  // 2. Links + titulares
  const { data: linksDb, error: linksErr } = await sb
    .from('obras_links')
    .select(`
      id, obra_id, numero_link, percentual_link, tipo_link, controlado,
      obras_links_titulares (
        id, obra_link_id, titular_id, editora_id, nome, funcao_no_link, papel,
        percentual_exec_publica, percentual_fonomecanico, percentual_sincronizacao,
        controlado, editora_original_id, editora_administradora_id, contrato_id,
        obras_links_titulares_direitos (
          tipo_direito_id, percentual, controlado, fonte,
          tipos_direito ( codigo )
        )
      )
    `)
    .eq('obra_id', obra_id)
    .eq('tenant_id', tenant_id)
    .eq('status', 'ativo')

  if (linksErr) return { ok: false, error: linksErr.message }

  const links: ObraLinkInput[] = (linksDb ?? []).map((l: any) => ({
    id: l.id, obra_id: l.obra_id, numero_link: l.numero_link,
    percentual_link: l.percentual_link, tipo_link: l.tipo_link, controlado: l.controlado,
    titulares: (l.obras_links_titulares ?? []).map((t: any): LinkTitularInput => ({
      id: t.id, obra_link_id: t.obra_link_id, titular_id: t.titular_id, editora_id: t.editora_id,
      nome: t.nome, funcao_no_link: t.funcao_no_link, papel: t.papel,
      percentual_exec_publica: t.percentual_exec_publica ?? 0,
      percentual_fonomecanico: t.percentual_fonomecanico ?? 0,
      percentual_sincronizacao: t.percentual_sincronizacao ?? 0,
      direitos_flexiveis: (t.obras_links_titulares_direitos ?? []).map((d: any) => ({
        tipo_direito_id: d.tipo_direito_id,
        tipo_direito_codigo: d.tipos_direito?.codigo ?? '',
        percentual: d.percentual, controlado: d.controlado, fonte: d.fonte,
      })),
      controlado: t.controlado, editora_original_id: t.editora_original_id,
      editora_administradora_id: t.editora_administradora_id, contrato_id: t.contrato_id,
    })),
  }))

  // 3. Contratos + negócios + cessões
  const titularIds = links.flatMap(l => l.titulares.map(t => t.titular_id).filter(Boolean))
  const editoraIds = links.flatMap(l => l.titulares.map(t => t.editora_id).filter(Boolean))

  const { data: contratosDb } = titularIds.length > 0
    ? await sb.from('contratos').select('id, titular_id, editora_id, percentual_editora, percentual_autor, splits_direitos, data_inicio, data_fim, status, territorio')
        .eq('tenant_id', tenant_id).in('titular_id', titularIds).in('status', ['vigente', 'assinado'])
    : { data: [] }

  const { data: negociosDb } = editoraIds.length > 0
    ? await sb.from('negocios_editoriais').select('*').eq('tenant_id', tenant_id).eq('status', 'ativo').in('editora_administrada_id', editoraIds)
    : { data: [] }

  const { data: cessoesDb } = titularIds.length > 0
    ? await sb.from('contratos').select('id, titular_id, editora_id, percentual_editora, splits_direitos, data_inicio, data_fim, status, territorio')
        .eq('tenant_id', tenant_id).in('tipo', ['cessao_pj', 'cessao_pf', 'licenciamento']).in('titular_id', titularIds).in('status', ['vigente', 'assinado'])
    : { data: [] }

  const contratos: ContratoEditorialInput[] = (contratosDb ?? []).map((c: any) => ({
    id: c.id, titular_id: c.titular_id, editora_id: c.editora_id,
    percentual_editora: c.percentual_editora ?? 0, percentual_autor: c.percentual_autor ?? 0,
    splits_direitos: c.splits_direitos ?? {}, data_inicio: c.data_inicio, data_fim: c.data_fim,
    status: c.status, territorio: c.territorio ?? null,
  }))
  const negocios: NegocioEditorialInput[] = (negociosDb ?? []).map((n: any) => ({
    id: n.id, editora_administrada_id: n.editora_administrada_id,
    editora_administrada_nome: n.editora_administrada_nome ?? '',
    editora_administradora_id: n.editora_administradora_id,
    editora_administradora_nome: n.editora_administradora_nome ?? '',
    percentual_administrada: n.percentual_administrada, percentual_administradora: n.percentual_administradora,
    receitas_aplicaveis: n.receitas_aplicaveis ?? [], abrangencia_tipo: n.abrangencia_tipo,
    abrangencia_ids: n.abrangencia_ids ?? [], territorios: n.territorios ?? [],
    tipo_direito_id: n.tipo_direito_id ?? null, data_inicio: n.data_inicio, data_fim: n.data_fim, status: n.status,
  }))
  const cessoes: CessaoInput[] = (cessoesDb ?? []).map((c: any) => ({
    id: c.id, titular_cedente_id: c.titular_id, titular_cessionario_id: null,
    editora_cessionaria_id: c.editora_id ?? null, nome_cessionario: c.nome_cessionario ?? 'Cessionário',
    tipo_cessionario: c.tipo === 'cessao_pj' ? 'cessionario_pj' : 'cessionario_pf',
    percentual_cessao: c.percentual_editora ?? 0, tipo_direito_codigo: null,
    territorio: c.territorio ?? null, data_inicio: c.data_inicio, data_fim: c.data_fim, status: c.status,
  }))

  // 4. Versão
  const { data: versaoDb } = await sb.from('obras_analitico').select('versao_calculo')
    .eq('obra_id', obra_id).eq('tenant_id', tenant_id).is('invalidado_em', null)
    .order('versao_calculo', { ascending: false }).limit(1)
  const versao_calculo = ((versaoDb?.[0]?.versao_calculo) ?? 0) + 1

  // 5. Executar bridge
  const ctx: BridgeContexto = {
    tenant_id, obra_id, links, contratos_editoriais: contratos,
    negocios_editoriais: negocios, cessoes, tipos_direito: tiposDireito,
    territorios, competencia_inicio: null, competencia_fim: null, versao_calculo,
  }
  const resultado = executarBridge(ctx)

  // 6. Invalida anteriores + insere novas linhas
  await sb.from('obras_analitico')
    .update({ invalidado_em: new Date().toISOString() })
    .eq('obra_id', obra_id).eq('tenant_id', tenant_id).is('invalidado_em', null)
    .in('tipo_direito_id', tiposDireito.map((t: { id: string }) => t.id))
    .in('territorio', territorios)

  const { data: tiposPartDb } = await sb.from('tipos_participante').select('id, codigo')
  const tiposPartMap = new Map<string, string>(
    (tiposPartDb ?? []).map((t: { id: string; codigo: string }) => [t.codigo, t.id])
  )
  for (let i = 0; i < resultado.linhas.length; i += 50) {
    const lote = resultado.linhas.slice(i, i + 50)
    await sb.from('obras_analitico').insert(lote.map((l: any) => ({
      tenant_id: l.tenant_id, obra_id: l.obra_id, obra_link_id: l.obra_link_id,
      obra_link_origem_id: l.obra_link_origem_id, titular_id: l.titular_id, editora_id: l.editora_id,
      nome_participante: l.nome_participante,
      tipo_participante_id: tiposPartMap.get(l.tipo_participante_codigo) ?? null,
      percentual_sobre_obra: l.percentual_sobre_obra, percentual_sobre_origem: l.percentual_sobre_origem,
      origem_participante_id: null, nivel_distribuicao: l.nivel_distribuicao,
      tipo_direito_id: l.tipo_direito_id, territorio: l.territorio,
      competencia_inicio: null, competencia_fim: null,
      contrato_id: l.contrato_id, negocio_editorial_id: l.negocio_editorial_id,
      status_calculo: l.status_calculo, pendencia: l.pendencia,
      versao_calculo: l.versao_calculo, calculado_por: l.calculado_por ?? 'auto_bridge',
    })))
  }

  return { ok: true, total_linhas: resultado.linhas.length, pendencias: resultado.pendencias }
}

// ── GET /api/recebimentos/[id] — detalhe ──────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params

  const { data, error } = await sb
    .from('recebimentos')
    .select(`
      *,
      obra:obra_id ( id, titulo, codigo_interno_legado, iswc ),
      tipo_direito:tipo_direito_id ( id, codigo, nome )
    `)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })

  // Buscar movimentos de CC associados
  const { data: movimentos } = await sb
    .from('cc_obras_movimentos')
    .select('*')
    .eq('recebimento_id', id)
    .eq('tenant_id', usuario.tenant_id)
    .order('status_movimento', { ascending: true })

  return NextResponse.json({ data, movimentos: movimentos ?? [] })
}

// ── PUT /api/recebimentos/[id] — atualizar status/observações ────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['master', 'admin', 'financeiro'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params

  let body: Record<string, unknown>
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  // Apenas campos editáveis manualmente
  const editaveis = ['status', 'observacoes', 'tipo_direito_id', 'territorio']
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const campo of editaveis) {
    if (campo in body) update[campo] = body[campo]
  }

  const { data, error } = await sb
    .from('recebimentos')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// ── POST /api/recebimentos/[id]/processar — executar CC Obra ──────────────────
// Rota especial: /api/recebimentos/[id] com body action='processar'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sb = getAdminClient()
  if (!sb) return NextResponse.json({ error: 'Supabase não configurado' }, { status: 503 })

  const usuario = await autenticar(req, sb)
  if (!usuario) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  if (!['master', 'admin', 'financeiro'].includes(usuario.role)) {
    return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
  }

  const { id } = await params

  // Buscar recebimento completo
  const { data: rec, error: recErr } = await sb
    .from('recebimentos')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', usuario.tenant_id)
    .single()

  if (recErr || !rec) return NextResponse.json({ error: 'Recebimento não encontrado' }, { status: 404 })
  if (!rec.obra_id) return NextResponse.json({ error: 'Recebimento sem obra vinculada — vincule uma obra primeiro' }, { status: 422 })

  const input: RecebimentoInput = {
    id:                  rec.id,
    obra_id:             rec.obra_id,
    tenant_id:           rec.tenant_id,
    valor_bruto:         Number(rec.valor_bruto),
    tipo_direito_id:     rec.tipo_direito_id ?? undefined,
    territorio:          rec.territorio ?? 'BR',
    competencia_inicio:  rec.competencia_inicio,
    competencia_fim:     rec.competencia_fim,
    fonte_pagadora_codigo: rec.fonte_pagadora_codigo,
    fonte_pagadora_tipo:  rec.fonte_pagadora_tipo ?? undefined,
    moeda:               rec.moeda ?? 'BRL',
    cotacao_brl:         rec.cotacao_brl ? Number(rec.cotacao_brl) : undefined,
  }

  // ── Auto-bridge: verificar se há analítico vigente; se não, calcular agora ──
  const territorios = [rec.territorio ?? 'BR']
  let bridgeFoiExecutada = false
  let bridgeAviso: string | null = null

  const { count: qtdAnalitico } = await sb
    .from('obras_analitico')
    .select('id', { count: 'exact', head: true })
    .eq('obra_id', rec.obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .is('invalidado_em', null)
    .eq('status_calculo', 'calculado')

  if (!qtdAnalitico || qtdAnalitico === 0) {
    const bridgeResult = await autoExecutarBridge(
      sb, usuario.tenant_id, rec.obra_id,
      rec.tipo_direito_id ?? null, territorios
    )
    if (!bridgeResult.ok) {
      return NextResponse.json({
        error: `Analítico não encontrado e bridge falhou: ${bridgeResult.error}. Calcule o Analítico manualmente antes de processar.`
      }, { status: 422 })
    }
    bridgeFoiExecutada = true
    bridgeAviso = `Bridge executada automaticamente (${bridgeResult.total_linhas} participantes).`
  }

  try {
    const sbAdmin = getAdminClientForCC()
    const resultado = await processarRecebimentoCCObra(sbAdmin, input)

    // Atualizar status do recebimento
    const novoStatus = resultado.fonte_excluida ? 'auditado'
      : resultado.alertas.length > 0 && resultado.total_retido > 0 ? 'pendente_matching'
      : 'distribuido'

    await sb.from('recebimentos')
      .update({ status: novoStatus, updated_at: new Date().toISOString() })
      .eq('id', id)

    return NextResponse.json({ resultado, bridge_executada: bridgeFoiExecutada, bridge_aviso: bridgeAviso })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

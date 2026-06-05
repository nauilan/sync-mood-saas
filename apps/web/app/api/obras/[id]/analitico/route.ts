/**
 * POST /api/obras/[id]/analitico
 *
 * Executa a bridge para uma obra e persiste o resultado em `obras_analitico`.
 * Invalida versões anteriores antes de inserir as novas linhas.
 *
 * Body (opcional):
 *   tipos_direito  string[]  — ex: ['digital','sincronizacao']. Padrão: todos ativos.
 *   territorios    string[]  — ex: ['BR','US']. Padrão: ['BR']
 *   competencia_inicio  string (YYYY-MM-DD)
 *   competencia_fim     string (YYYY-MM-DD)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  executarBridge,
  type BridgeContexto,
  type ObraLinkInput,
  type LinkTitularInput,
  type ContratoEditorialInput,
  type NegocioEditorialInput,
  type CessaoInput,
} from '@/lib/bridge-analitico'

function supabase() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = supabase()
  const { id: obra_id } = await params

  // ── Tenant ───────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { data: usuario } = await sb.from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })
  const tenant_id: string = usuario.tenant_id

  // ── Body ─────────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}))
  const territorios: string[] = body.territorios ?? ['BR']
  const competencia_inicio = body.competencia_inicio ? new Date(body.competencia_inicio) : null
  const competencia_fim    = body.competencia_fim    ? new Date(body.competencia_fim)    : null

  // ── Tipos de direito ─────────────────────────────────────────────────────
  const { data: tiposDireitoDb } = await sb
    .from('tipos_direito')
    .select('id, codigo')
    .eq('ativo', true)
    .or('tenant_id.is.null,tenant_id.eq.' + tenant_id)
    .order('ordem')

  const tiposDireito = body.tipos_direito
    ? (tiposDireitoDb ?? []).filter((t: { codigo: string }) => body.tipos_direito.includes(t.codigo))
    : (tiposDireitoDb ?? [])

  if (tiposDireito.length === 0) {
    return NextResponse.json({ error: 'Nenhum tipo de direito encontrado' }, { status: 400 })
  }

  // ── Obra + links + titulares ──────────────────────────────────────────────
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

  if (linksErr) return NextResponse.json({ error: linksErr.message }, { status: 500 })

  const links: ObraLinkInput[] = (linksDb ?? []).map((l: any) => ({
    id:             l.id,
    obra_id:        l.obra_id,
    numero_link:    l.numero_link,
    percentual_link: l.percentual_link,
    tipo_link:      l.tipo_link,
    controlado:     l.controlado,
    titulares:      (l.obras_links_titulares ?? []).map((t: any): LinkTitularInput => ({
      id:                         t.id,
      obra_link_id:               t.obra_link_id,
      titular_id:                 t.titular_id,
      editora_id:                 t.editora_id,
      nome:                       t.nome,
      funcao_no_link:             t.funcao_no_link,
      papel:                      t.papel,
      percentual_exec_publica:    t.percentual_exec_publica ?? 0,
      percentual_fonomecanico:    t.percentual_fonomecanico ?? 0,
      percentual_sincronizacao:   t.percentual_sincronizacao ?? 0,
      direitos_flexiveis:         (t.obras_links_titulares_direitos ?? []).map((d: any) => ({
        tipo_direito_id:     d.tipo_direito_id,
        tipo_direito_codigo: d.tipos_direito?.codigo ?? '',
        percentual:          d.percentual,
        controlado:          d.controlado,
        fonte:               d.fonte,
      })),
      controlado:                 t.controlado,
      editora_original_id:        t.editora_original_id,
      editora_administradora_id:  t.editora_administradora_id,
      contrato_id:                t.contrato_id,
    })),
  }))

  // ── Contratos editoriais vigentes para esta obra ──────────────────────────
  const titularIds = links.flatMap(l => l.titulares.map(t => t.titular_id).filter(Boolean))
  const editoraIds = links.flatMap(l => l.titulares.map(t => t.editora_id).filter(Boolean))

  const { data: contratosDb } = titularIds.length > 0
    ? await sb
        .from('contratos')
        .select('id, titular_id, editora_id, percentual_editora, percentual_autor, splits_direitos, data_inicio, data_fim, status, territorio')
        .eq('tenant_id', tenant_id)
        .in('titular_id', titularIds)
        .in('status', ['vigente', 'assinado'])
    : { data: [] }

  const contratos: ContratoEditorialInput[] = (contratosDb ?? []).map((c: any) => ({
    id:                 c.id,
    titular_id:         c.titular_id,
    editora_id:         c.editora_id,
    percentual_editora: c.percentual_editora ?? 0,
    percentual_autor:   c.percentual_autor ?? 0,
    splits_direitos:    c.splits_direitos ?? {},
    data_inicio:        c.data_inicio,
    data_fim:           c.data_fim,
    status:             c.status,
    territorio:         c.territorio ?? null,
  }))

  // ── Negócios editoriais ───────────────────────────────────────────────────
  const { data: negociosDb } = editoraIds.length > 0
    ? await sb
        .from('negocios_editoriais')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('status', 'ativo')
        .in('editora_administrada_id', editoraIds)
    : { data: [] }

  const negocios: NegocioEditorialInput[] = (negociosDb ?? []).map((n: any) => ({
    id:                         n.id,
    editora_administrada_id:    n.editora_administrada_id,
    editora_administrada_nome:  n.editora_administrada_nome ?? '',
    editora_administradora_id:  n.editora_administradora_id,
    editora_administradora_nome: n.editora_administradora_nome ?? '',
    percentual_administrada:    n.percentual_administrada,
    percentual_administradora:  n.percentual_administradora,
    receitas_aplicaveis:        n.receitas_aplicaveis ?? [],
    abrangencia_tipo:           n.abrangencia_tipo,
    abrangencia_ids:            n.abrangencia_ids ?? [],
    territorios:                n.territorios ?? [],
    tipo_direito_id:            n.tipo_direito_id ?? null,
    data_inicio:                n.data_inicio,
    data_fim:                   n.data_fim,
    status:                     n.status,
  }))

  // ── Cessões ───────────────────────────────────────────────────────────────
  const { data: cessoesDb } = titularIds.length > 0
    ? await sb
        .from('contratos')
        .select('id, titular_id, editora_id, percentual_editora, splits_direitos, data_inicio, data_fim, status, territorio')
        .eq('tenant_id', tenant_id)
        .in('tipo', ['cessao_pj', 'cessao_pf', 'licenciamento'])
        .in('titular_id', titularIds)
        .in('status', ['vigente', 'assinado'])
    : { data: [] }

  const cessoes: CessaoInput[] = (cessoesDb ?? []).map((c: any) => ({
    id:                        c.id,
    titular_cedente_id:        c.titular_id,
    titular_cessionario_id:    null,
    editora_cessionaria_id:    c.editora_id ?? null,
    nome_cessionario:          c.nome_cessionario ?? 'Cessionário',
    tipo_cessionario:          c.tipo === 'cessao_pj' ? 'cessionario_pj' : 'cessionario_pf',
    percentual_cessao:         c.percentual_editora ?? 0,
    tipo_direito_codigo:       null,
    territorio:                c.territorio ?? null,
    data_inicio:               c.data_inicio,
    data_fim:                  c.data_fim,
    status:                    c.status,
  }))

  // ── Versão atual ──────────────────────────────────────────────────────────
  const { data: versaoDb } = await sb
    .from('obras_analitico')
    .select('versao_calculo')
    .eq('obra_id', obra_id)
    .eq('tenant_id', tenant_id)
    .is('invalidado_em', null)
    .order('versao_calculo', { ascending: false })
    .limit(1)

  const versao_calculo = ((versaoDb?.[0]?.versao_calculo) ?? 0) + 1

  // ── Executa bridge ────────────────────────────────────────────────────────
  const ctx: BridgeContexto = {
    tenant_id,
    obra_id,
    links,
    contratos_editoriais: contratos,
    negocios_editoriais:  negocios,
    cessoes,
    tipos_direito:   tiposDireito,
    territorios,
    competencia_inicio,
    competencia_fim,
    versao_calculo,
  }

  const resultado = executarBridge(ctx)

  // ── Invalida versões anteriores ───────────────────────────────────────────
  await sb
    .from('obras_analitico')
    .update({ invalidado_em: new Date().toISOString() })
    .eq('obra_id', obra_id)
    .eq('tenant_id', tenant_id)
    .is('invalidado_em', null)
    .in('tipo_direito_id', tiposDireito.map((t: { id: string }) => t.id))
    .in('territorio', territorios)

  // ── Insere novas linhas ───────────────────────────────────────────────────
  // Remove campos temporários antes de inserir
  const { _tempKey: _k, _tempOrigemKey: _ko, ...fieldsToKeep } = resultado.linhas[0] ?? {}
  void _k; void _ko; void fieldsToKeep

  // Insere em lotes de 50, guardando mapa tempKey → id inserido
  const tempKeyToId = new Map<string, string>()

  // Ordena: nivel_distribuicao 0 primeiro (garantir que origens existam)
  const linhasOrdenadas = [...resultado.linhas].sort(
    (a, b) => a.nivel_distribuicao - b.nivel_distribuicao
  )

  for (let i = 0; i < linhasOrdenadas.length; i += 50) {
    const lote = linhasOrdenadas.slice(i, i + 50)

    const payload = lote.map(l => ({
      tenant_id:              l.tenant_id,
      obra_id:                l.obra_id,
      obra_link_id:           l.obra_link_id,
      obra_link_origem_id:    l.obra_link_origem_id,
      titular_id:             l.titular_id,
      editora_id:             l.editora_id,
      nome_participante:      l.nome_participante,
      tipo_participante_codigo: l.tipo_participante_codigo,
      percentual_sobre_obra:  l.percentual_sobre_obra,
      percentual_sobre_origem: l.percentual_sobre_origem,
      origem_participante_id: l._tempOrigemKey ? (tempKeyToId.get(l._tempOrigemKey) ?? null) : null,
      nivel_distribuicao:     l.nivel_distribuicao,
      tipo_direito_id:        l.tipo_direito_id,
      territorio:             l.territorio,
      competencia_inicio:     l.competencia_inicio?.toISOString().split('T')[0] ?? null,
      competencia_fim:        l.competencia_fim?.toISOString().split('T')[0] ?? null,
      contrato_id:            l.contrato_id,
      negocio_editorial_id:   l.negocio_editorial_id,
      status_calculo:         l.status_calculo,
      pendencia:              l.pendencia,
      versao_calculo:         l.versao_calculo,
      calculado_por:          l.calculado_por,
    }))

    const { data: inseridos, error: insErr } = await sb
      .from('obras_analitico')
      .insert(payload)
      .select('id')

    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

    // Mapeia _tempKey → id do banco
    lote.forEach((l, idx) => {
      if (l._tempKey && inseridos?.[idx]?.id) {
        tempKeyToId.set(l._tempKey, inseridos[idx].id)
      }
    })
  }

  return NextResponse.json({
    ok: true,
    versao_calculo,
    total_linhas:      resultado.linhas.length,
    pendencias:        resultado.pendencias,
    avisos:            resultado.avisos,
    soma_percentuais:  resultado.soma_percentuais,
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = supabase()
  const { id: obra_id } = await params

  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await sb.auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: usuario } = await sb.from('usuarios').select('tenant_id').eq('auth_user_id', user.id).single()
  if (!usuario) return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 403 })

  const { data, error } = await sb
    .from('obras_analitico')
    .select(`
      id, nome_participante, tipo_participante_codigo,
      percentual_sobre_obra, percentual_sobre_origem,
      nivel_distribuicao, territorio, status_calculo, pendencia,
      versao_calculo, calculado_em,
      tipo_direito_id, tipos_direito ( codigo, nome ),
      obra_link_id, obra_link_origem_id, origem_participante_id,
      contrato_id, negocio_editorial_id,
      competencia_inicio, competencia_fim
    `)
    .eq('obra_id', obra_id)
    .eq('tenant_id', usuario.tenant_id)
    .is('invalidado_em', null)
    .order('nivel_distribuicao')
    .order('nome_participante')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
